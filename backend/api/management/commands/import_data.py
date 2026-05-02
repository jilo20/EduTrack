import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from api.models import (
    User, Section, Enrollment, Assessment, Score, 
    Attendance, AuditLog, Announcement, Notification, RegisteredID
)

class Command(BaseCommand):
    help = 'Imports data from the old Express backend database.json'

    def handle(self, *args, **options):
        db_path = Path(__file__).resolve().parent.parent.parent.parent.parent / 'server' / 'database.json'
        
        if not db_path.exists():
            self.stdout.write(self.style.ERROR(f'database.json not found at {db_path}'))
            return
            
        with open(db_path, 'r') as f:
            data = json.load(f)
            
        self.stdout.write('Starting data import...')
        
        # 1. Users
        self.stdout.write('Importing Users...')
        User.objects.all().delete()
        for u in data.get('users', []):
            parts = u.get('name', '').split(' ', 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''
            
            user = User(
                id=u['id'],
                username=u['email'],
                email=u['email'],
                password=f"legacy_sha256$${u['password']}",  # tag for Django hasher
                first_name=first_name,
                last_name=last_name,
                role=u.get('role', 'Student'),
                status=u.get('status', 'active'),
                id_number=u.get('id_number', None),
                login_attempts=u.get('login_attempts', 0),
            )
            # lock_until is a timestamp integer or null in json
            lock_until_ts = u.get('lock_until')
            if lock_until_ts:
                user.lock_until = datetime.fromtimestamp(lock_until_ts / 1000.0, tz=timezone.utc)
                
            user.save()
            
        # 2. Sections
        self.stdout.write('Importing Sections...')
        Section.objects.all().delete()
        for s in data.get('sections', []):
            ended_at_str = s.get('ended_at')
            ended_at = None
            if ended_at_str:
                try:
                    ended_at = datetime.fromisoformat(ended_at_str.replace('Z', '+00:00'))
                except ValueError:
                    pass

            Section.objects.create(
                id=s['id'],
                teacher_id=s['teacher_id'],
                code_name=s['code_name'],
                course_program=s['course_program'],
                description=s.get('description', ''),
                schedule=s.get('schedule', 'TBA'),
                status=s.get('status', 'active'),
                ended_at=ended_at,
                settings=s.get('settings', {})
            )
            
        # 3. Enrollments
        self.stdout.write('Importing Enrollments...')
        Enrollment.objects.all().delete()
        for e in data.get('enrollments', []):
            Enrollment.objects.create(
                id=e['id'],
                section_id=e['section_id'],
                student_id=e['student_id']
            )
            
        # 4. Assessments
        self.stdout.write('Importing Assessments...')
        Assessment.objects.all().delete()
        for a in data.get('assessments', []):
            Assessment.objects.create(
                id=a['id'],
                section_id=a['section_id'],
                title=a['title'],
                type=a['type'],
                perfect_score=a['perfect_score']
            )
            
        # 5. Scores
        self.stdout.write('Importing Scores...')
        Score.objects.all().delete()
        for s in data.get('scores', []):
            Score.objects.create(
                id=s['id'],
                assessment_id=s['assessment_id'],
                student_id=s['student_id'],
                score=s['score'],
                status=s.get('status', 'Graded')
            )
            
        # 6. Attendance
        self.stdout.write('Importing Attendance...')
        Attendance.objects.all().delete()
        for a in data.get('attendance', []):
            try:
                date_obj = datetime.strptime(a['date'], '%Y-%m-%d').date()
            except ValueError:
                date_obj = timezone.now().date()
                
            Attendance.objects.create(
                id=a['id'],
                student_id=a['student_id'],
                section_id=a['section_id'],
                date=date_obj,
                status=a['status'],
                remarks=a.get('remarks', '')
            )
            
        # 7. Announcements
        self.stdout.write('Importing Announcements...')
        Announcement.objects.all().delete()
        for a in data.get('announcements', []):
            try:
                date_obj = datetime.strptime(a['date'], '%Y-%m-%d').date()
            except ValueError:
                date_obj = timezone.now().date()
                
            Announcement.objects.create(
                id=a['id'],
                title=a['title'],
                content=a['content'],
                priority=a.get('priority', 'normal'),
                target=a.get('target', 'all'),
                date=date_obj
            )
            
        # 8. Notifications
        self.stdout.write('Importing Notifications...')
        Notification.objects.all().delete()
        for n in data.get('notifications', []):
            created_at_str = n.get('created_at')
            created_at = timezone.now()
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                except ValueError:
                    pass
                    
            Notification.objects.create(
                id=n['id'],
                user_id=n['user_id'],
                title=n['title'],
                message=n['message'],
                type=n.get('type', 'info'),
                status=n.get('status', 'unread'),
                created_at=created_at
            )
            
        # 9. RegisteredIDs
        self.stdout.write('Importing Registered IDs...')
        RegisteredID.objects.all().delete()
        for r in data.get('registered_ids', []):
            created_at_str = r.get('created_at')
            created_at = timezone.now()
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                except ValueError:
                    pass
            
            created_by_id = r.get('created_by')
            if created_by_id and not User.objects.filter(id=created_by_id).exists():
                created_by_id = None
                
            RegisteredID.objects.create(
                id=r['id'],
                id_number=r['id_number'],
                role=r['role'],
                is_used=r.get('is_used', False),
                used_by_email=r.get('used_by_email', None),
                created_by_id=created_by_id,
                created_at=created_at
            )
            
        # 10. AuditLogs
        self.stdout.write('Importing Audit Logs...')
        AuditLog.objects.all().delete()
        for log in data.get('audit_logs', []):
            ts = log.get('timestamp')
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                except ValueError:
                    dt = timezone.now()
            else:
                dt = timezone.now()
                
            actor_id = log.get('actor_id')
            if actor_id and not User.objects.filter(id=actor_id).exists():
                actor_id = None
                
            AuditLog.objects.create(
                id=log['id'],
                timestamp=dt,
                action=log['action'],
                actor_id=actor_id,
                actor_name=log.get('actor_name', ''),
                actor_role=log.get('actor_role', ''),
                details=log.get('details', ''),
                extra_data=log.get('extra_data', {})
            )

        self.stdout.write(self.style.SUCCESS('Data import completed successfully!'))
