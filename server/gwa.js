import { db } from './db.js';

/**
 * GWA (General Weighted Average) Calculation Engine
 * 
 * Default Category Weights:
 *   Quiz:         30%
 *   Project:      30%
 *   Module Exam:  40%
 * 
 * Teachers can customize weights per section via section.settings.weights
 * 
 * Formula per section:
 *   category_avg = Σ(score / perfect_score) / count_in_category
 *   section_grade = Σ(category_avg × category_weight)
 * 
 * Overall GWA:
 *   GWA = Σ(section_grade) / number_of_sections
 */

const DEFAULT_WEIGHTS = {
    'Quiz': 0.30,
    'Project': 0.30,
    'Module Exam': 0.40
};

/**
 * Get weights for a section — uses custom if set, otherwise defaults
 */
function getSectionWeights(sectionId) {
    const section = db.sections.find(s => s.id === sectionId);
    if (section?.settings?.weights) {
        return section.settings.weights;
    }
    return { ...DEFAULT_WEIGHTS };
}

/**
 * Compute grade breakdown for a single student in a single section
 */
export function computeSectionGrade(studentId, sectionId) {
    const assessments = db.assessments.filter(a => a.section_id === sectionId);
    const scores = db.scores.filter(s => s.student_id === studentId);
    const weights = getSectionWeights(sectionId);

    // Group assessments by type
    const categories = {};
    for (const assessment of assessments) {
        const scoreEntry = scores.find(s => s.assessment_id === assessment.id);
        if (!scoreEntry) continue;

        const type = assessment.type;
        if (!categories[type]) {
            categories[type] = { scores: [], totalPercent: 0, count: 0 };
        }
        const percentage = (scoreEntry.score / assessment.perfect_score) * 100;
        categories[type].scores.push({
            assessmentId: assessment.id,
            title: assessment.title,
            score: scoreEntry.score,
            perfectScore: assessment.perfect_score,
            percentage: Math.round(percentage * 100) / 100
        });
        categories[type].totalPercent += percentage;
        categories[type].count++;
    }

    // Compute category averages
    const categoryBreakdown = {};
    let weightedTotal = 0;
    let totalWeightUsed = 0;

    for (const [type, data] of Object.entries(categories)) {
        const avg = data.count > 0 ? data.totalPercent / data.count : 0;
        const weight = weights[type] || 0;
        categoryBreakdown[type] = {
            average: Math.round(avg * 100) / 100,
            weight: Math.round(weight * 100),
            weightedValue: Math.round(avg * weight * 100) / 100,
            assessmentCount: data.count,
            scores: data.scores
        };
        weightedTotal += avg * weight;
        totalWeightUsed += weight;
    }

    // Normalize if not all categories have scores
    const sectionGrade = totalWeightUsed > 0
        ? Math.round((weightedTotal / totalWeightUsed) * 100) / 100
        : 0;

    const section = db.sections.find(s => s.id === sectionId);

    return {
        sectionId,
        sectionName: section?.course_program || 'Unknown',
        sectionCode: section?.code_name || '',
        sectionGrade,
        categoryBreakdown,
        weights,
        totalAssessments: assessments.length,
        gradedAssessments: Object.values(categories).reduce((sum, c) => sum + c.count, 0)
    };
}

/**
 * Compute full GWA for a student across all enrolled sections
 */
export function computeStudentGWA(studentId) {
    const enrollments = db.enrollments.filter(e => e.student_id === studentId);
    const sectionIds = [...new Set(enrollments.map(e => e.section_id))];

    const sectionGrades = [];
    let totalGrade = 0;
    let gradedSections = 0;

    for (const sectionId of sectionIds) {
        const result = computeSectionGrade(studentId, sectionId);
        sectionGrades.push(result);
        if (result.gradedAssessments > 0) {
            totalGrade += result.sectionGrade;
            gradedSections++;
        }
    }

    const gwa = gradedSections > 0
        ? Math.round((totalGrade / gradedSections) * 100) / 100
        : 0;

    const equivalentGrade = percentageToGradePoint(gwa);

    return {
        studentId,
        gwa,
        equivalentGrade,
        gradeDescription: getGradeDescription(equivalentGrade),
        sectionGrades,
        totalSections: sectionIds.length,
        gradedSections,
        formula: `GWA = Σ(Section Grades) / ${gradedSections} = ${totalGrade.toFixed(2)} / ${gradedSections} = ${gwa}%`,
        defaultWeights: DEFAULT_WEIGHTS
    };
}

/**
 * Philippine grading scale conversion
 */
function percentageToGradePoint(percentage) {
    if (percentage >= 97) return 1.00;
    if (percentage >= 94) return 1.25;
    if (percentage >= 91) return 1.50;
    if (percentage >= 88) return 1.75;
    if (percentage >= 85) return 2.00;
    if (percentage >= 82) return 2.25;
    if (percentage >= 79) return 2.50;
    if (percentage >= 76) return 2.75;
    if (percentage >= 75) return 3.00;
    return 5.00;
}

function getGradeDescription(gradePoint) {
    if (gradePoint <= 1.25) return 'Excellent';
    if (gradePoint <= 1.75) return 'Very Good';
    if (gradePoint <= 2.25) return 'Good';
    if (gradePoint <= 2.75) return 'Satisfactory';
    if (gradePoint <= 3.00) return 'Passing';
    return 'Failed';
}
