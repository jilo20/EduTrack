import random
from rest_framework.views import APIView
from rest_framework.response import Response

from api.models import User, Section, Enrollment, RegisteredID, AuditLog
from api.permissions import IsAdmin
from api.utils import create_audit_log


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        def sanitize(u):
            return {
                'id': u.id, 'name': u.get_full_name(), 'email': u.email,
                'role': u.role, 'status': u.status, 'id_number': u.id_number,
            }

        admins_qs = User.objects.filter(role='Admin')
        teachers_qs = User.objects.filter(role='Teacher')
        students_qs = User.objects.filter(role='Student')
        sections_qs = Section.objects.all()

        admins = [sanitize(a) for a in admins_qs]
        
        students = []
        for s in students_qs:
            enrolled_ids = list(Enrollment.objects.filter(student=s).values_list('section_id', flat=True))
            sections = [
                {'id': sec.id, 'name': f"{sec.code_name} — {sec.course_program}"}
                for sec in sections_qs.filter(id__in=enrolled_ids)
            ]
            students.append({**sanitize(s), 'sections': sections})

        teachers = []
        for t in teachers_qs:
            sections = [
                {'id': sec.id, 'name': f"{sec.code_name} — {sec.course_program}"}
                for sec in sections_qs.filter(teacher=t)
            ]
            teachers.append({**sanitize(t), 'sections': sections})

        return Response({
            'admins': admins,
            'teachers': teachers,
            'students': students,
            'teachersCount': len(teachers),
            'studentsCount': len(students),
            'sectionsCount': sections_qs.count(),
        })



class InviteCreateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        role = request.data.get('role')
        if not role:
            return Response({'error': 'Role is required.'}, status=400)
        if role not in ('Student', 'Teacher'):
            return Response({'error': 'Invalid role.'}, status=400)

        year = __import__('datetime').datetime.now().year
        while True:
            random_num = random.randint(100000, 999999)
            id_number = f"{year}{random_num}"
            if not RegisteredID.objects.filter(id_number=id_number).exists() and \
               not User.objects.filter(id_number=id_number).exists():
                break

        invite = RegisteredID.objects.create(
            id_number=id_number,
            role=role,
            created_by=request.user,
        )

        create_audit_log('INVITE_GENERATED', request.user,
                         details=f"Generated invite ID {id_number} for role {role}")

        return Response({
            'message': 'Invite ID generated',
            'invite': {
                'id': invite.id, 'id_number': invite.id_number, 'role': invite.role,
                'is_used': invite.is_used, 'used_by_email': invite.used_by_email,
                'created_at': invite.created_at.isoformat(), 'created_by': request.user.id,
            }
        }, status=201)


class InviteListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        invites = RegisteredID.objects.all().order_by('-created_at')
        data = [{
            'id': i.id, 'id_number': i.id_number, 'role': i.role,
            'is_used': i.is_used, 'used_by_email': i.used_by_email,
            'created_at': i.created_at.isoformat(),
            'created_by': i.created_by_id,
        } for i in invites]
        return Response(data)


class AdminUserCreateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        name = request.data.get('name', '')
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        role = request.data.get('role', '')

        if not all([name, email, password, role]):
            return Response({'error': 'All fields required.'}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already taken.'}, status=400)

        parts = name.split(' ', 1)
        user = User.objects.create_user(
            username=email, email=email, password=password,
            first_name=parts[0], last_name=parts[1] if len(parts) > 1 else '',
            role=role, status='active',
        )

        create_audit_log('USER_CREATED', request.user,
                         details=f"Created {role} account for {name}",
                         target_user_id=user.id, target_user_name=name)

        return Response({
            'message': 'User created',
            'user': {'id': user.id, 'name': name, 'email': email, 'role': role, 'status': 'active'}
        }, status=201)


class AdminUserUpdateView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        updates = {}
        for field in ('status', 'role'):
            val = request.data.get(field)
            if val:
                setattr(user, field, val)
                updates[field] = val

        name = request.data.get('name')
        if name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            updates['name'] = name

        email = request.data.get('email')
        if email:
            user.email = email
            user.username = email
            updates['email'] = email

        user.save()

        create_audit_log('USER_UPDATED', request.user,
                         details=f"Updated user: {updates}", target_user_id=user_id)

        return Response({'message': 'User updated', 'user': {
            'id': user.id, 'name': user.get_full_name(), 'email': user.email,
            'role': user.role, 'status': user.status,
        }})


class AdminUserDeleteView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        user.status = 'inactive'
        user.save(update_fields=['status'])

        create_audit_log('USER_DEACTIVATED', request.user,
                         details=f"Deactivated account for {user.get_full_name()}",
                         target_user_id=user_id, target_user_name=user.get_full_name())

        return Response({'message': 'User deactivated.'})


class AuditLogListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = AuditLog.objects.all()[:200]
        data = [{
            'id': log.id, 'timestamp': log.timestamp.isoformat(),
            'action': log.action, 'actor_id': log.actor_id,
            'actor_name': log.actor_name, 'actor_role': log.actor_role,
            'details': log.details, **log.extra_data,
        } for log in logs]
        return Response(data)
