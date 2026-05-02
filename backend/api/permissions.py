from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Teacher'


class IsTeacherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ('Teacher', 'Admin')


class IsOwnerOrAdmin(BasePermission):
    """Check that user is accessing their own data, or is an Admin."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'Admin':
            return True
        # Check URL kwargs for ownership
        user_id = view.kwargs.get('user_id') or view.kwargs.get('teacher_id') or view.kwargs.get('student_id')
        if user_id:
            return request.user.id == int(user_id)
        return True
