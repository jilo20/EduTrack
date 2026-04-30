from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.models import User, Announcement, Notification
from api.utils import create_audit_log, create_notification


class StatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'message': 'EduTrack API Connected', 'version': '3.0.0-django'})


class UserNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        notifications = Notification.objects.filter(user_id=int(user_id)).order_by('-created_at')
        return Response([{
            'id': n.id, 'user_id': n.user_id, 'title': n.title,
            'message': n.message, 'type': n.type, 'status': n.status,
            'created_at': n.created_at.isoformat(),
        } for n in notifications])


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            n = Notification.objects.get(id=int(notification_id))
            n.status = 'read'
            n.save(update_fields=['status'])
            return Response({'message': 'Marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        Notification.objects.filter(user_id=int(user_id)).update(status='read')
        return Response({'message': 'Marked all as read'})


class ClearAllNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        Notification.objects.filter(user_id=int(user_id)).delete()
        return Response({'message': 'Cleared all'})


class AnnouncementListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        announcements = Announcement.objects.all()
        return Response([{
            'id': a.id, 'title': a.title, 'content': a.content,
            'priority': a.priority, 'target': a.target,
            'section_id': a.section_id,
            'date': str(a.date), 'school_id': 1,
        } for a in announcements])


class AnnouncementCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        content = request.data.get('content', '')
        priority = request.data.get('priority', 'normal')
        target = request.data.get('target', 'all')

        announcement = Announcement.objects.create(
            title=title, content=content, priority=priority, target=target,
            author=request.user
        )

        # Notify target users
        if target == 'teachers':
            users = User.objects.filter(role='Teacher')
        elif target == 'students':
            users = User.objects.filter(role='Student')
        else:
            users = User.objects.filter(role__in=['Teacher', 'Student'])

        for u in users:
            create_notification(u, f'Announcement: {title}', content, 'announcement')

        create_audit_log('BROADCAST_ANNOUNCEMENT', request.user, title=title, target=target)

        return Response({
            'id': announcement.id, 'title': announcement.title,
            'content': announcement.content, 'priority': announcement.priority,
            'target': announcement.target, 'date': str(announcement.date), 'school_id': 1,
        })
