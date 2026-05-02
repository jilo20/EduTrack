from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """Ensures all errors return JSON with an 'error' key, matching the Express API contract."""
    response = exception_handler(exc, context)

    if response is not None:
        # Normalize DRF errors to match Express format: { "error": "message" }
        if 'detail' in response.data:
            response.data = {'error': str(response.data['detail'])}
        elif isinstance(response.data, dict):
            # Flatten validation errors
            errors = []
            for field, messages in response.data.items():
                if isinstance(messages, list):
                    errors.extend([f"{field}: {m}" for m in messages])
                else:
                    errors.append(f"{field}: {messages}")
            response.data = {'error': '; '.join(errors) if errors else 'An error occurred.'}

    return response


def create_audit_log(action, actor, details='', **extra):
    """Helper to create audit log entries."""
    from api.models import AuditLog
    return AuditLog.objects.create(
        action=action,
        actor=actor,
        actor_name=actor.get_full_name() if actor else 'Unknown',
        actor_role=actor.role if actor else 'Unknown',
        details=details,
        extra_data=extra,
    )


def create_notification(user, title, message, notif_type='info'):
    """Helper to create notification entries."""
    from api.models import Notification
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notif_type,
    )
