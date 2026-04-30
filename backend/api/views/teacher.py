from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from api.models import User, Section, Enrollment, Assessment, Score, Attendance
from api.permissions import IsTeacherOrAdmin, IsTeacher
from api.utils import create_audit_log, create_notification
from api.gwa import compute_section_grade


class TeacherClassesView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request, teacher_id):
        teacher_id = int(teacher_id)
        if request.user.role == 'Teacher' and request.user.id != teacher_id:
            return Response({'error': 'Access denied.'}, status=403)

        sections = Section.objects.filter(teacher_id=teacher_id)
        data = [{
            'id': s.id, 'name': s.course_program, 'section': s.code_name,
            'schedule': s.schedule or 'TBA', 'status': s.status or 'active',
            'ended_at': s.ended_at.isoformat() if s.ended_at else None,
            'studentCount': Enrollment.objects.filter(section=s).count(),
            'weights': s.settings.get('weights') if s.settings else None,
        } for s in sections]
        return Response(data)


class ClassCreateView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        name = request.data.get('name')
        section_code = request.data.get('section')
        teacher_id = request.data.get('teacherId')
        description = request.data.get('description', '')
        schedule = request.data.get('schedule', 'TBA')

        if request.user.role == 'Teacher' and request.user.id != int(teacher_id):
            return Response({'error': 'Access denied.'}, status=403)
        if not all([name, section_code, teacher_id]):
            return Response({'error': 'All fields required.'}, status=400)

        section = Section.objects.create(
            teacher_id=int(teacher_id), code_name=section_code,
            course_program=name, description=description, schedule=schedule,
        )
        return Response({
            'message': 'Class created',
            'section': {
                'id': section.id, 'school_id': 1, 'teacher_id': section.teacher_id,
                'grade_id': 1, 'code_name': section.code_name,
                'course_program': section.course_program,
                'description': section.description, 'schedule': section.schedule,
                'settings': section.settings,
            }
        }, status=201)


class ClassWeightsView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def put(self, request, section_id):
        weights = request.data.get('weights', {})
        total = sum(weights.values())
        if abs(total - 1.0) > 0.01:
            return Response({'error': 'Weights must sum to 100%.'}, status=400)

        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        settings = section.settings or {}
        settings['weights'] = weights
        section.settings = settings
        section.save(update_fields=['settings'])
        return Response({'message': 'Weights updated.', 'weights': weights})


class ClassRosterView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request, section_id):
        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        if request.user.role == 'Teacher' and section.teacher_id != request.user.id:
            return Response({'error': 'Access denied.'}, status=403)

        enrollments = Enrollment.objects.filter(section=section)
        student_ids = enrollments.values_list('student_id', flat=True)
        students = [
            {'id': u.id, 'name': u.get_full_name(), 'email': u.email}
            for u in User.objects.filter(id__in=student_ids)
        ]
        assessments = [
            {'id': a.id, 'title': a.title, 'type': a.type, 'perfect_score': a.perfect_score,
             'section_id': a.section_id}
            for a in Assessment.objects.filter(section=section)
        ]
        assessment_ids = [a['id'] for a in assessments]
        existing_scores = [
            {'id': s.id, 'assessment_id': s.assessment_id, 'student_id': s.student_id,
             'score': s.score, 'status': s.status}
            for s in Score.objects.filter(assessment_id__in=assessment_ids)
        ]
        return Response({'students': students, 'assessments': assessments, 'existingScores': existing_scores})


class EnrollStudentsView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        section_id = int(request.data.get('sectionId', 0))
        student_ids = request.data.get('studentIds', [])

        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        if request.user.role == 'Teacher' and section.teacher_id != request.user.id:
            return Response({'error': 'Access denied.'}, status=403)

        existing_ids = set(Enrollment.objects.filter(section=section).values_list('student_id', flat=True))
        class_name = section.code_name

        for sid in student_ids:
            sid = int(sid)
            if sid not in existing_ids:
                Enrollment.objects.create(section=section, student_id=sid)
                student = User.objects.filter(id=sid).first()

                create_notification(User.objects.get(id=sid),
                                    'New Class Enrollment',
                                    f'You have been added to Class {class_name}.')

                for peer_id in existing_ids:
                    create_notification(User.objects.get(id=peer_id),
                                        'New Classmate',
                                        f'{student.get_full_name() if student else "A new student"} has joined your class ({class_name}).')
                existing_ids.add(sid)

        return Response({'message': 'Roster updated.'})


class ClassAnnouncementView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request):
        section_id = int(request.data.get('sectionId', 0))
        title = request.data.get('title', '')
        message = request.data.get('message', '')

        if not all([section_id, title, message]):
            return Response({'error': 'Title and message are required.'}, status=400)

        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        if section.status == 'completed':
            return Response({'error': 'Cannot announce to a completed class.'}, status=400)

        from api.models import Announcement
        Announcement.objects.create(
            title=title,
            content=message,
            target='students',
            section=section,
            author=request.user
        )

        enrollments = Enrollment.objects.filter(section=section)
        for e in enrollments:
            create_notification(
                e.student,
                f'📢 {title}',
                f'[{section.code_name}] {message} — {request.user.get_full_name()}',
                'announcement'
            )

        create_audit_log('CLASS_ANNOUNCEMENT', request.user,
                         sectionId=section_id, title=title, studentCount=enrollments.count())

        return Response({'message': f'Announcement sent to {enrollments.count()} student(s).'})


class EndSemesterView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request, section_id):
        section_id = int(section_id)
        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        if request.user.role == 'Teacher' and section.teacher_id != request.user.id:
            return Response({'error': 'Not authorized.'}, status=403)

        enrollments = Enrollment.objects.filter(section=section)
        assessments = Assessment.objects.filter(section=section)
        all_attendance = Attendance.objects.filter(section=section)

        students_data = []
        for e in enrollments:
            user = e.student
            student_scores = Score.objects.filter(student=user, assessment__section=section)
            total_perc = 0
            count = 0
            for s in student_scores:
                a = s.assessment
                total_perc += (s.score / a.perfect_score) * 100
                count += 1
            grade = round(total_perc / count) if count > 0 else 0

            st_att = all_attendance.filter(student=user)
            total_days = st_att.count()
            present = st_att.filter(status='Present').count()
            late = st_att.filter(status='Late').count()
            att_rate = round(((present + late * 0.5) / total_days) * 100) if total_days > 0 else 0

            students_data.append({
                'name': user.get_full_name(), 'email': user.email,
                'grade': grade, 'attendanceRate': att_rate,
            })

        students_data.sort(key=lambda x: x['grade'], reverse=True)

        grades = [s['grade'] for s in students_data if s['grade'] > 0]
        class_avg = round(sum(grades) / len(grades)) if grades else 0
        passing = sum(1 for s in students_data if s['grade'] >= 75)

        total_att = all_attendance.count()
        total_present = all_attendance.filter(status='Present').count()
        total_late = all_attendance.filter(status='Late').count()
        att_rate = round(((total_present + total_late * 0.5) / total_att) * 100) if total_att > 0 else 0

        section.status = 'completed'
        section.ended_at = timezone.now()
        section.save(update_fields=['status', 'ended_at'])

        create_audit_log('END_SEMESTER', request.user,
                         sectionId=section_id, className=section.course_program, sectionCode=section.code_name)

        for e in enrollments:
            report = next((s for s in students_data if s['email'] == e.student.email), None)
            create_notification(
                e.student, 'Semester Ended',
                f'{section.course_program} ({section.code_name}) has been marked as completed. Your final grade: {report["grade"] if report else 0}%.'
            )

        for admin in User.objects.filter(role='Admin'):
            create_notification(
                admin, 'Section Completed',
                f'Teacher {request.user.get_full_name()} has ended the semester for {section.course_program} ({section.code_name}). Average Grade: {class_avg}%.'
            )

        return Response({
            'message': 'Semester ended successfully.',
            'report': {
                'className': section.course_program, 'sectionCode': section.code_name,
                'totalStudents': len(students_data), 'classAverage': class_avg,
                'attendanceRate': att_rate, 'passingCount': passing,
                'students': students_data,
            }
        })


class ClassReportView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request, section_id):
        try:
            section = Section.objects.get(id=int(section_id))
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        if request.user.role == 'Teacher' and section.teacher_id != request.user.id:
            return Response({'error': 'Access denied.'}, status=403)

        enrollments = Enrollment.objects.filter(section=section)
        all_attendance = Attendance.objects.filter(section=section)

        students_data = []
        for e in enrollments:
            user = e.student
            student_scores = Score.objects.filter(student=user, assessment__section=section)
            total_perc = 0
            count = 0
            for s in student_scores:
                total_perc += (s.score / s.assessment.perfect_score) * 100
                count += 1
            grade = round(total_perc / count) if count > 0 else 0

            st_att = all_attendance.filter(student=user)
            total_days = st_att.count()
            present = st_att.filter(status='Present').count()
            late = st_att.filter(status='Late').count()
            att_rate = round(((present + late * 0.5) / total_days) * 100) if total_days > 0 else 0

            students_data.append({'name': user.get_full_name(), 'email': user.email, 'grade': grade, 'attendanceRate': att_rate})

        students_data.sort(key=lambda x: x['grade'], reverse=True)
        grades = [s['grade'] for s in students_data if s['grade'] > 0]
        class_avg = round(sum(grades) / len(grades)) if grades else 0
        passing = sum(1 for s in students_data if s['grade'] >= 75)

        total_att = all_attendance.count()
        total_present = all_attendance.filter(status='Present').count()
        total_late = all_attendance.filter(status='Late').count()
        att_rate = round(((total_present + total_late * 0.5) / total_att) * 100) if total_att > 0 else 0

        return Response({
            'className': section.course_program, 'sectionCode': section.code_name,
            'totalStudents': len(students_data), 'classAverage': class_avg,
            'attendanceRate': att_rate, 'passingCount': passing, 'students': students_data,
        })


class AssessmentCreateView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request):
        section_id = request.data.get('sectionId')
        title = request.data.get('title')
        atype = request.data.get('type')
        perfect_score = request.data.get('perfectScore')

        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        if section.teacher_id != request.user.id:
            return Response({'error': 'Unauthorized.'}, status=403)

        assessment = Assessment.objects.create(
            section=section, title=title, type=atype, perfect_score=int(perfect_score)
        )
        return Response({
            'id': assessment.id, 'section_id': assessment.section_id,
            'title': assessment.title, 'type': assessment.type,
            'perfect_score': assessment.perfect_score,
        }, status=201)


class SubmitScoresView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        assessment_id = int(request.data.get('assessmentId', 0))
        scores = request.data.get('scores', [])
        reason = request.data.get('reason', 'No reason provided')

        try:
            assessment = Assessment.objects.get(id=assessment_id)
        except Assessment.DoesNotExist:
            return Response({'error': 'Assessment not found.'}, status=404)

        for s in scores:
            student_id = int(s['studentId'])
            new_score = float(s['score'])
            student = User.objects.filter(id=student_id).first()

            existing = Score.objects.filter(assessment_id=assessment_id, student_id=student_id).first()
            if existing:
                old_score = existing.score
                existing.score = new_score
                existing.status = 'Graded'
                existing.save()
                if old_score != new_score:
                    create_audit_log('GRADE_CHANGED', request.user,
                                     assessment_id=assessment_id, assessment_title=assessment.title,
                                     target_user_id=student_id,
                                     target_user_name=student.get_full_name() if student else 'Unknown',
                                     old_value=old_score, new_value=new_score, reason=reason,
                                     details=f'Grade changed from {old_score} to {new_score} for {student.get_full_name() if student else "Unknown"} on "{assessment.title}"')
            else:
                Score.objects.create(assessment_id=assessment_id, student_id=student_id, score=new_score)
                create_audit_log('GRADE_ENTERED', request.user,
                                 assessment_id=assessment_id, assessment_title=assessment.title,
                                 target_user_id=student_id,
                                 target_user_name=student.get_full_name() if student else 'Unknown',
                                 new_value=new_score,
                                 details=f'Initial grade of {new_score} entered for {student.get_full_name() if student else "Unknown"} on "{assessment.title}"')

        return Response({'message': 'Scores updated.'})


class ClassAttendanceView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request, section_id):
        records = Attendance.objects.filter(section_id=int(section_id))
        date = request.query_params.get('date')
        if date:
            records = records.filter(date=date)
        data = [
            {'id': r.id, 'student_id': r.student_id, 'section_id': r.section_id,
             'date': str(r.date), 'status': r.status, 'remarks': r.remarks}
            for r in records
        ]
        return Response(data)


class MarkAttendanceView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request):
        section_id = int(request.data.get('sectionId', 0))
        date = request.data.get('date')
        records = request.data.get('records', [])

        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found.'}, status=404)

        if section.teacher_id != request.user.id:
            return Response({'error': 'Unauthorized.'}, status=403)

        if section.status == 'completed':
            return Response({'error': 'Cannot mark attendance for a completed class.'}, status=400)

        for r in records:
            student_id = int(r['studentId'])
            existing = Attendance.objects.filter(section_id=section_id, student_id=student_id, date=date).first()
            if existing:
                existing.status = r['status']
                existing.remarks = r.get('remarks', '')
                existing.save()
            else:
                Attendance.objects.create(
                    student_id=student_id, section_id=section_id,
                    date=date, status=r['status'], remarks=r.get('remarks', '')
                )

        create_audit_log('ATTENDANCE_MARKED', request.user,
                         section_id=section_id, date=date,
                         details=f'Attendance marked for {len(records)} students on {date}')

        return Response({'message': 'Attendance recorded.'})


class TeacherAnalyticsView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request, teacher_id):
        teacher_id = int(teacher_id)
        if request.user.role == 'Teacher' and request.user.id != teacher_id:
            return Response({'error': 'Access denied.'}, status=403)

        sections = Section.objects.filter(teacher_id=teacher_id)
        section_ids = list(sections.values_list('id', flat=True))
        enrollments = Enrollment.objects.filter(section_id__in=section_ids)
        assessments = Assessment.objects.filter(section_id__in=section_ids)
        assessment_ids = list(assessments.values_list('id', flat=True))
        scores = Score.objects.filter(assessment_id__in=assessment_ids)

        total_perc = 0
        count = 0
        for s in scores:
            a = assessments.filter(id=s.assessment_id).first()
            if a:
                total_perc += (s.score / a.perfect_score) * 100
                count += 1

        student_stats = []
        for e in enrollments:
            user = e.student
            section = sections.filter(id=e.section_id).first()
            my_scores = scores.filter(student_id=e.student_id, assessment__section_id=e.section_id)

            s_total = 0
            s_count = 0
            for s in my_scores:
                a = assessments.filter(id=s.assessment_id).first()
                if a:
                    s_total += (s.score / a.perfect_score) * 100
                    s_count += 1

            student_stats.append({
                'name': user.get_full_name(),
                'average': round(s_total / s_count) if s_count > 0 else 0,
                'section_id': e.section_id,
                'section_name': section.code_name if section else '',
            })

        student_stats.sort(key=lambda x: x['average'], reverse=True)
        unique_students = set(enrollments.values_list('student_id', flat=True))

        return Response({
            'totalStudents': len(unique_students),
            'totalClasses': sections.count(),
            'averagePerformance': round(total_perc / count) if count > 0 else 0,
            'topStudents': student_stats[:50],
            'sections': [{'id': s.id, 'name': s.code_name} for s in sections],
        })
