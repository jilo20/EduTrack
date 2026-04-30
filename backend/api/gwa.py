"""
GWA (General Weighted Average) Calculation Engine — Django Port

Default Category Weights:
  Quiz:         30%
  Project:      30%
  Module Exam:  40%

Teachers can customize weights per section via section.settings['weights']

Formula per section:
  category_avg = Σ(score / perfect_score) / count_in_category
  section_grade = Σ(category_avg × category_weight)

Overall GWA:
  GWA = Σ(section_grade) / number_of_sections
"""

from api.models import Section, Assessment, Score, Enrollment

DEFAULT_WEIGHTS = {
    'Quiz': 0.30,
    'Project': 0.30,
    'Module Exam': 0.40,
}


def get_section_weights(section):
    """Get weights for a section — uses custom if set, otherwise defaults."""
    if section.settings and 'weights' in section.settings:
        return section.settings['weights']
    return dict(DEFAULT_WEIGHTS)


def compute_section_grade(student_id, section_id):
    """Compute grade breakdown for a single student in a single section."""
    try:
        section = Section.objects.get(id=section_id)
    except Section.DoesNotExist:
        return {'sectionGrade': 0, 'categoryBreakdown': {}, 'gradedAssessments': 0}

    assessments = Assessment.objects.filter(section_id=section_id)
    scores = Score.objects.filter(student_id=student_id, assessment__section_id=section_id)
    weights = get_section_weights(section)

    # Group by type
    categories = {}
    for assessment in assessments:
        score_entry = scores.filter(assessment=assessment).first()
        if not score_entry:
            continue
        atype = assessment.type
        if atype not in categories:
            categories[atype] = {'scores': [], 'totalPercent': 0, 'count': 0}
        percentage = (score_entry.score / assessment.perfect_score) * 100
        categories[atype]['scores'].append({
            'assessmentId': assessment.id,
            'title': assessment.title,
            'score': score_entry.score,
            'perfectScore': assessment.perfect_score,
            'percentage': round(percentage, 2),
        })
        categories[atype]['totalPercent'] += percentage
        categories[atype]['count'] += 1

    # Compute category averages
    category_breakdown = {}
    weighted_total = 0
    total_weight_used = 0

    for atype, data in categories.items():
        avg = data['totalPercent'] / data['count'] if data['count'] > 0 else 0
        weight = weights.get(atype, 0)
        category_breakdown[atype] = {
            'average': round(avg, 2),
            'weight': round(weight * 100),
            'weightedValue': round(avg * weight, 2),
            'assessmentCount': data['count'],
            'scores': data['scores'],
        }
        weighted_total += avg * weight
        total_weight_used += weight

    # Normalize if not all categories have scores
    section_grade = round(weighted_total / total_weight_used, 2) if total_weight_used > 0 else 0

    return {
        'sectionId': section_id,
        'sectionName': section.course_program,
        'sectionCode': section.code_name,
        'sectionGrade': section_grade,
        'categoryBreakdown': category_breakdown,
        'weights': weights,
        'totalAssessments': assessments.count(),
        'gradedAssessments': sum(c['count'] for c in categories.values()),
    }


def compute_student_gwa(student_id):
    """Compute full GWA for a student across all enrolled sections."""
    enrollment_section_ids = list(
        Enrollment.objects.filter(student_id=student_id).values_list('section_id', flat=True).distinct()
    )

    section_grades = []
    total_grade = 0
    graded_sections = 0

    for section_id in enrollment_section_ids:
        result = compute_section_grade(student_id, section_id)
        section_grades.append(result)
        if result['gradedAssessments'] > 0:
            total_grade += result['sectionGrade']
            graded_sections += 1

    gwa = round(total_grade / graded_sections, 2) if graded_sections > 0 else 0
    equivalent_grade = percentage_to_grade_point(gwa)

    return {
        'studentId': student_id,
        'gwa': gwa,
        'equivalentGrade': equivalent_grade,
        'gradeDescription': get_grade_description(equivalent_grade),
        'sectionGrades': section_grades,
        'totalSections': len(enrollment_section_ids),
        'gradedSections': graded_sections,
        'formula': f"GWA = Σ(Section Grades) / {graded_sections} = {total_grade:.2f} / {graded_sections} = {gwa}%",
        'defaultWeights': DEFAULT_WEIGHTS,
    }


def percentage_to_grade_point(percentage):
    """Philippine grading scale conversion."""
    if percentage >= 97: return 1.00
    if percentage >= 94: return 1.25
    if percentage >= 91: return 1.50
    if percentage >= 88: return 1.75
    if percentage >= 85: return 2.00
    if percentage >= 82: return 2.25
    if percentage >= 79: return 2.50
    if percentage >= 76: return 2.75
    if percentage >= 75: return 3.00
    return 5.00


def get_grade_description(grade_point):
    if grade_point <= 1.25: return 'Excellent'
    if grade_point <= 1.75: return 'Very Good'
    if grade_point <= 2.25: return 'Good'
    if grade_point <= 2.75: return 'Satisfactory'
    if grade_point <= 3.00: return 'Passing'
    return 'Failed'
