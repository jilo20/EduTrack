from django.urls import path
from api.views import (
    # Auth
    LoginView, VerifyIDView, RegisterView,
    # Admin
    AdminStatsView, InviteCreateView, InviteListView,
    AdminUserCreateView, AdminUserUpdateView, AdminUserDeleteView,
    AuditLogListView,
    # Teacher
    TeacherClassesView, ClassCreateView, ClassWeightsView,
    ClassRosterView, EnrollStudentsView, ClassAnnouncementView,
    EndSemesterView, ClassReportView, StudentSectionDetailView,
    AssessmentCreateView, SubmitScoresView,
    ClassAttendanceView, MarkAttendanceView,
    TeacherAnalyticsView,
    # Student
    StudentDashboardView, StudentPerformanceView, StudentGWAView,
    StudentAttendanceView, StudentPoolView, StudentDashboardSummaryView,
    # Analytics
    AdminAnalyticsView, TeacherRichAnalyticsView, StudentAnalyticsView,
    # Misc
    StatusView, UserNotificationsView, MarkNotificationReadView,
    MarkAllNotificationsReadView, ClearAllNotificationsView,
    AnnouncementListView, AnnouncementCreateView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────
    path('login', LoginView.as_view()),
    path('verify-id', VerifyIDView.as_view()),
    path('register', RegisterView.as_view()),

    # ── Admin ─────────────────────────────────────────
    path('stats', AdminStatsView.as_view()),
    path('admin/invite', InviteCreateView.as_view()),
    path('admin/invites', InviteListView.as_view()),
    path('admin/users', AdminUserCreateView.as_view()),
    path('admin/users/<int:user_id>', AdminUserUpdateView.as_view()),
    path('admin/users/<int:user_id>/delete', AdminUserDeleteView.as_view()),
    path('audit-logs', AuditLogListView.as_view()),

    # ── Teacher ───────────────────────────────────────
    path('teacher/<int:teacher_id>/classes', TeacherClassesView.as_view()),
    path('create-class', ClassCreateView.as_view()),
    path('class/<int:section_id>/weights', ClassWeightsView.as_view()),
    path('class/<int:section_id>/roster', ClassRosterView.as_view()),
    path('enroll-students', EnrollStudentsView.as_view()),
    path('class-announcement', ClassAnnouncementView.as_view()),
    path('class/<int:section_id>/end-semester', EndSemesterView.as_view()),
    path('class/<int:section_id>/report', ClassReportView.as_view()),
    path('class/<int:section_id>/student/<int:student_id>/report', StudentSectionDetailView.as_view()),
    path('create-assessment', AssessmentCreateView.as_view()),
    path('submit-scores', SubmitScoresView.as_view()),
    path('class/<int:section_id>/attendance', ClassAttendanceView.as_view()),
    path('mark-attendance', MarkAttendanceView.as_view()),
    path('teacher/<int:teacher_id>/analytics', TeacherAnalyticsView.as_view()),

    # ── Student ───────────────────────────────────────
    path('students/<int:student_id>/dashboard', StudentDashboardView.as_view()),
    path('student/<int:student_id>/performance', StudentPerformanceView.as_view()),
    path('student/<int:student_id>/gwa', StudentGWAView.as_view()),
    path('student/<int:student_id>/attendance', StudentAttendanceView.as_view()),
    path('student/<int:student_id>/summary', StudentDashboardSummaryView.as_view()),
    path('students', StudentPoolView.as_view()),

    # ── Analytics ─────────────────────────────────────
    path('analytics/admin', AdminAnalyticsView.as_view()),
    path('analytics/teacher/<int:teacher_id>', TeacherRichAnalyticsView.as_view()),
    path('analytics/student/<int:student_id>', StudentAnalyticsView.as_view()),

    # ── Misc ──────────────────────────────────────────
    path('status', StatusView.as_view()),
    path('notifications/user/<int:user_id>', UserNotificationsView.as_view()),
    path('notifications/<int:notification_id>/read', MarkNotificationReadView.as_view()),
    path('notifications/mark-all-read/<int:user_id>', MarkAllNotificationsReadView.as_view()),
    path('notifications/clear-all/<int:user_id>', ClearAllNotificationsView.as_view()),
    path('announcements', AnnouncementListView.as_view()),
    path('announcements/create', AnnouncementCreateView.as_view()),
]

