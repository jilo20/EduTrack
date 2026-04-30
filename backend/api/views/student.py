from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from api.models import User, Enrollment, Assessment, Score, Attendance, Section
from api.permissions import IsOwnerOrAdmin
from api.gwa import compute_student_gwa, compute_section_grade


class StudentDashboardView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, student_id):
        student_id = int(student_id)
        if request.user.role == 'Student' and request.user.id != student_id:
            return Response({'error': 'Access denied.'}, status=403)

        try:
            user = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=404)

        enrollments = Enrollment.objects.filter(student_id=student_id)
        section_ids = list(enrollments.values_list('section_id', flat=True))
        assessments = Assessment.objects.filter(section_id__in=section_ids)
        scores_qs = Score.objects.filter(student_id=student_id)
        attendance = Attendance.objects.filter(student_id=student_id)
        present_count = attendance.filter(status='Present').count()

        gwa_data = compute_student_gwa(student_id)

        recent_scores = []
        for s in scores_qs.order_by('-id')[:10]:
            assessment = assessments.filter(id=s.assessment_id).first()
            if not assessment:
                assessment = Assessment.objects.filter(id=s.assessment_id).first()
            recent_scores.append({
                'score_id': s.id, 'score': s.score,
                'assessment': {
                    'title': assessment.title, 'type': assessment.type,
                    'perfect_score': assessment.perfect_score,
                    'description': f'{assessment.type} — {assessment.title}',
                } if assessment else None,
            })

        return Response({
            'profile': {
                'id': user.id, 'name': user.get_full_name(), 'email': user.email,
                'role': user.role, 'id_number': user.id_number,
            },
            'attendance_percentage': round((present_count / attendance.count()) * 100) if attendance.count() > 0 else 0,
            'recent_attendance': [
                {'id': a.id, 'date': str(a.date), 'status': a.status, 'section_id': a.section_id, 'remarks': a.remarks}
                for a in attendance.order_by('-date')[:10]
            ],
            'recent_scores': recent_scores,
            'current_gpa': gwa_data['gwa'],
            'equivalent_grade': gwa_data['equivalentGrade'],
            'grade_description': gwa_data['gradeDescription'],
        })


class StudentPerformanceView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, student_id):
        student_id = int(student_id)
        enrollments = Enrollment.objects.filter(student_id=student_id)
        section_ids = list(enrollments.values_list('section_id', flat=True))
        assessments = Assessment.objects.filter(section_id__in=section_ids)

        data = []
        for a in assessments:
            score_entry = Score.objects.filter(assessment=a, student_id=student_id).first()
            section = Section.objects.filter(id=a.section_id).first()
            data.append({
                'id': a.id, 'title': a.title, 'type': a.type,
                'perfectScore': a.perfect_score,
                'achievedScore': score_entry.score if score_entry else None,
                'sectionName': section.course_program if section else 'Unknown',
            })
        return Response(data)


class StudentGWAView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, student_id):
        return Response(compute_student_gwa(int(student_id)))


class StudentAttendanceView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, student_id):
        student_id = int(student_id)
        records = Attendance.objects.filter(student_id=student_id).order_by('-date')
        present = records.filter(status='Present').count()
        total = records.count()
        return Response({
            'records': [
                {'id': r.id, 'date': str(r.date), 'status': r.status,
                 'section_id': r.section_id, 'remarks': r.remarks}
                for r in records
            ],
            'total': total,
            'presentCount': present,
            'absentCount': records.filter(status='Absent').count(),
            'lateCount': records.filter(status='Late').count(),
            'percentage': round((present / total) * 100) if total > 0 else 0,
        })


class StudentPoolView(APIView):
    """All active students for enrollment dropdown."""
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request):
        students = User.objects.filter(role='Student', status='active')
        return Response([
            {'id': s.id, 'name': s.get_full_name(), 'email': s.email,
             'role': s.role, 'school_id': 1}
            for s in students
        ])


class StudentDashboardSummaryView(APIView):
    """Lightweight dashboard summary endpoint."""
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, student_id):
        student_id = int(student_id)
        gwa_data = compute_student_gwa(student_id)
        attendance = Attendance.objects.filter(student_id=student_id)
        present_count = attendance.filter(status='Present').count()
        enrollments = Enrollment.objects.filter(student_id=student_id)
        section_ids = list(enrollments.values_list('section_id', flat=True))
        total_assessments = Assessment.objects.filter(section_id__in=section_ids).count()
        graded = Score.objects.filter(student_id=student_id).count()

        return Response({
            'gwa': gwa_data['gwa'],
            'equivalentGrade': gwa_data['equivalentGrade'],
            'gradeDescription': gwa_data['gradeDescription'],
            'attendancePercentage': round((present_count / attendance.count()) * 100) if attendance.count() > 0 else 0,
            'totalAssessments': total_assessments,
            'gradedAssessments': graded,
            'pendingAssessments': total_assessments - graded,
        })
