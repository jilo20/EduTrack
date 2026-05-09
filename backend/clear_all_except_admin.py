import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    User, Section, Enrollment, Assessment, Score, 
    Attendance, AuditLog, Announcement, Notification, RegisteredID
)

def clear_data():
    print("⚠️  Starting Data Deletion...")
    
    # Delete dependent models first to avoid Foreign Key issues
    print("Deleting scores and assessments...")
    Score.objects.all().delete()
    Assessment.objects.all().delete()
    
    print("Deleting attendance, enrollments, and sections...")
    Attendance.objects.all().delete()
    Enrollment.objects.all().delete()
    Section.objects.all().delete()
    
    print("Deleting logs, notifications, and announcements...")
    AuditLog.objects.all().delete()
    Notification.objects.all().delete()
    Announcement.objects.all().delete()
    
    print("Deleting registered IDs (invites)...")
    RegisteredID.objects.all().delete()
    
    print("Deleting users (keeping admins)...")
    # Keep users who have the 'Admin' role or are Django superusers
    deleted_count, _ = User.objects.exclude(role='Admin').exclude(is_superuser=True).delete()
    
    print(f"✅ Cleanup Complete!")
    print(f"   - Removed {deleted_count} non-admin users.")
    print("   - All classes, scores, logs, and invitations have been cleared.")
    print("   - Only Admin accounts remain.")

if __name__ == '__main__':
    print("This script will PERMANENTLY DELETE all data except admin users.")
    confirm = input("Type 'YES' to confirm: ")
    if confirm.strip().upper() == 'YES':
        clear_data()
    else:
        print("❌ Operation cancelled.")
