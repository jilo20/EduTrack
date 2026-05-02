from django.contrib.auth.models import AbstractUser
from django.db import models
import json


class User(AbstractUser):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Teacher', 'Teacher'),
        ('Student', 'Student'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Student')
    id_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    login_attempts = models.IntegerField(default=0)
    lock_until = models.DateTimeField(blank=True, null=True)

    # Override username to use email as login
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    email = models.EmailField(unique=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class Section(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taught_sections')
    code_name = models.CharField(max_length=50)
    course_program = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    schedule = models.CharField(max_length=100, default='TBA')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    ended_at = models.DateTimeField(blank=True, null=True)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'sections'

    def __str__(self):
        return f"{self.code_name} — {self.course_program}"


class Enrollment(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')

    class Meta:
        db_table = 'enrollments'
        unique_together = ('section', 'student')

    def __str__(self):
        return f"{self.student} → {self.section}"


class Assessment(models.Model):
    TYPE_CHOICES = [
        ('Written Works', 'Written Works'),
        ('Performance Tasks', 'Performance Tasks'),
        ('Major Exams', 'Major Examinations'),
        ('Projects', 'Projects & Portfolio'),
        ('Other', 'Other Assessments'),
    ]

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='assessments')
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    perfect_score = models.IntegerField()

    class Meta:
        db_table = 'assessments'

    def __str__(self):
        return f"{self.title} ({self.type}) — {self.section.code_name}"


class Score(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scores')
    score = models.FloatField()
    status = models.CharField(max_length=20, default='Graded')

    class Meta:
        db_table = 'scores'
        unique_together = ('assessment', 'student')

    def __str__(self):
        return f"{self.student} — {self.assessment.title}: {self.score}"


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'attendance'
        unique_together = ('student', 'section', 'date')

    def __str__(self):
        return f"{self.student} — {self.date}: {self.status}"


class AuditLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=100)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    actor_name = models.CharField(max_length=200, blank=True, default='')
    actor_role = models.CharField(max_length=20, blank=True, default='')
    details = models.TextField(blank=True, default='')
    extra_data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.action} by {self.actor_name}"


class Announcement(models.Model):
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    TARGET_CHOICES = [
        ('all', 'All'),
        ('teachers', 'Teachers'),
        ('students', 'Students'),
    ]

    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    target = models.CharField(max_length=10, choices=TARGET_CHOICES, default='all')
    section = models.ForeignKey('Section', on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='authored_announcements')
    date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-date']

    def __str__(self):
        return self.title


class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('announcement', 'Announcement'),
        ('warning', 'Warning'),
    ]
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unread')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.user}"


class RegisteredID(models.Model):
    ROLE_CHOICES = [
        ('Student', 'Student'),
        ('Teacher', 'Teacher'),
    ]

    id_number = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    is_used = models.BooleanField(default=False)
    used_by_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_invites')

    class Meta:
        db_table = 'registered_ids'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.id_number} ({self.role}) — {'Used' if self.is_used else 'Available'}"
