from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from api.models import User, Section, Enrollment, Assessment, Score, Attendance, AuditLog
from api.permissions import IsAdmin, IsTeacherOrAdmin, IsOwnerOrAdmin
from api.gwa import compute_student_gwa, compute_section_grade


class AdminAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        students = User.objects.filter(role='Student')
        teachers = User.objects.filter(role='Teacher')
        sections = Section.objects.all()

        enrollment_stats = [{
            'name': s.code_name, 'fullName': s.course_program,
            'count': Enrollment.objects.filter(section=s).count(),
        } for s in sections]

        gwas = [compute_student_gwa(s.id)['gwa'] for s in students]
        valid_gwas = [g for g in gwas if g > 0]
        system_avg = round(sum(valid_gwas) / len(valid_gwas), 1) if valid_gwas else 0
        
        from api.gwa import percentage_to_grade_point
        system_avg_equiv = percentage_to_grade_point(system_avg)

        recent_activity = [{
            'id': log.id, 'timestamp': log.timestamp.isoformat(),
            'action': log.action, 'actor_name': log.actor_name,
            'actor_role': log.actor_role, 'details': log.details,
        } for log in AuditLog.objects.all()[:10]]

        return Response({
            'stats': {
                'totalStudents': students.count(), 'totalTeachers': teachers.count(),
                'totalSections': sections.count(), 'systemAvgGWA': system_avg,
                'systemAvgEquiv': system_avg_equiv,
            },
            'enrollmentStats': enrollment_stats,
            'recentActivity': recent_activity,
        })


class TeacherRichAnalyticsView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request, teacher_id):
        teacher_id = int(teacher_id)
        if request.user.role == 'Teacher' and request.user.id != teacher_id:
            return Response({'error': 'Access denied.'}, status=403)

        sections = Section.objects.filter(teacher_id=teacher_id, status='active')
        section_id = request.query_params.get('sectionId')
        if section_id:
            sections = sections.filter(id=section_id)

        # Class performance
        class_performance = []
        for s in sections:
            enrollments = Enrollment.objects.filter(section=s)
            student_ids = list(enrollments.values_list('student_id', flat=True))
            gwas = [compute_section_grade(sid, s.id)['sectionGrade'] for sid in student_ids]
            valid = [g for g in gwas if g > 0]
            avg = round(sum(valid) / len(valid), 1) if valid else 0
            
            from api.gwa import percentage_to_grade_point
            avg_equiv = percentage_to_grade_point(avg)

            class_performance.append({
                'id': s.id, 'name': s.code_name, 'fullName': s.course_program,
                'average': avg, 'averageEquiv': avg_equiv, 'studentCount': len(student_ids),
                'passingGrade': s.settings.get('passing_grade', 60),
            })

        # Assessment stats
        assessment_stats = []
        for s in sections:
            assessments = Assessment.objects.filter(section=s)
            enrollments = Enrollment.objects.filter(section=s)
            total_possible = assessments.count() * enrollments.count()
            total_graded = Score.objects.filter(assessment__section=s).count()
            assessment_stats.append({
                'name': s.code_name, 'total': total_possible,
                'graded': total_graded, 'pending': total_possible - total_graded,
            })

        # At-risk students
        at_risk = []
        for s in sections:
            for e in Enrollment.objects.filter(section=s):
                grade_info = compute_section_grade(e.student_id, s.id)
                grade = grade_info['sectionGrade']
                passing_grade = s.settings.get('passing_grade', 60)
                if 0 < grade < passing_grade:
                    at_risk.append({
                        'id': e.student_id, 'name': e.student.get_full_name(),
                        'section': s.code_name, 'grade': grade,
                        'equivalentGrade': grade_info['equivalentGrade'],
                    })

        # Category performance
        category_stats = {}
        for s in sections:
            for e in Enrollment.objects.filter(section=s):
                breakdown = compute_section_grade(e.student_id, s.id)['categoryBreakdown']
                for atype, data in breakdown.items():
                    if atype not in category_stats:
                        category_stats[atype] = {'sum': 0, 'count': 0}
                    category_stats[atype]['sum'] += data['average']
                    category_stats[atype]['count'] += 1

        from api.gwa import percentage_to_grade_point
        category_performance = [{
            'type': t, 
            'average': round(d['sum'] / d['count'], 1) if d['count'] > 0 else 0,
            'equivalentGrade': percentage_to_grade_point(round(d['sum'] / d['count'], 1)) if d['count'] > 0 else 5.00,
        } for t, d in category_stats.items()]

        # Attendance
        valid_att = Attendance.objects.filter(section__in=sections).exclude(status='No Class')
        total_att = valid_att.count()
        present = valid_att.filter(status='Present').count()
        late = valid_att.filter(status='Late').count()

        return Response({
            'classPerformance': class_performance,
            'assessmentStats': assessment_stats,
            'atRisk': at_risk,
            'categoryPerformance': category_performance,
            'attendance': {
                'total': total_att, 'present': present,
                'absent': valid_att.filter(status='Absent').count(),
                'late': late,
                'percentage': round(((present + late * 0.5) / total_att) * 100) if total_att > 0 else 0,
            },
        })


class StudentAnalyticsView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, student_id):
        student_id = int(student_id)
        gwa_info = compute_student_gwa(student_id)

        scores = Score.objects.filter(student_id=student_id)
        trend_data = []
        for s in scores:
            assessment = Assessment.objects.filter(id=s.assessment_id).first()
            trend_data.append({
                'id': s.id, 'title': assessment.title if assessment else 'Unknown',
                'score': round((s.score / (assessment.perfect_score if assessment else 1)) * 100),
                'date': assessment.id if assessment else 0,
            })
        trend_data.sort(key=lambda x: x['id'])

        # Category strengths
        summary = {}
        for sg in gwa_info['sectionGrades']:
            for atype, data in sg['categoryBreakdown'].items():
                if atype not in summary:
                    summary[atype] = {'sum': 0, 'count': 0}
                summary[atype]['sum'] += data['average']
                summary[atype]['count'] += 1

        if summary:
            category_strengths = [{
                'subject': cat, 'A': round(d['sum'] / d['count']), 'fullMark': 100,
            } for cat, d in summary.items()]
        else:
            category_strengths = [{'subject': c, 'A': 0, 'fullMark': 100}
                                  for c in ['Quiz', 'Project', 'Module Exam', 'Assignment']]

        valid_att = Attendance.objects.filter(student_id=student_id).exclude(status='No Class')
        total = valid_att.count()
        present = valid_att.filter(status='Present').count()
        late = valid_att.filter(status='Late').count()

        enrollments = Enrollment.objects.filter(student_id=student_id)
        section_ids = list(enrollments.values_list('section_id', flat=True))

        return Response({
            'gwa': gwa_info['gwa'],
            'equivalentGrade': gwa_info['equivalentGrade'],
            'section_ids': section_ids,
            'trendData': trend_data,
            'categoryStrengths': category_strengths,
            'attendanceStats': {
                'total': total, 'presentCount': present,
                'absentCount': valid_att.filter(status='Absent').count(),
                'lateCount': late,
                'percentage': round(((present + late * 0.5) / total) * 100) if total > 0 else 0,
            },
            'recentGrades': trend_data[-5:][::-1],
        })
