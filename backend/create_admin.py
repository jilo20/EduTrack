import os
import django
import random
import string

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import RegisteredID

User = get_user_model()

def generate_id():
    return ''.join(random.choices(string.digits, k=10))

def setup():
    print("--- EduTrack System Setup ---")
    
    # 1. Create/Update Admin
    admin_email = 'admin@edutrack.com'
    admin_password = 'admin'
    
    admin, created = User.objects.get_or_create(
        email=admin_email,
        defaults={
            'username': 'admin',
            'name': 'System Administrator',
            'role': 'Admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    admin.set_password(admin_password)
    admin.save()
    
    if created:
        print(f"✅ Created Admin: {admin_email} / {admin_password}")
    else:
        print(f"✅ Updated Admin password for: {admin_email}")

    # 2. Create Sample Invitations (RegisteredIDs)
    print("\nGenerating sample invitations...")
    
    invites = [
        ('Teacher', 'T-2026-001'),
        ('Teacher', 'T-2026-002'),
        ('Student', 'S-2026-001'),
        ('Student', 'S-2026-002'),
        ('Student', 'S-2026-003'),
    ]
    
    for role, id_num in invites:
        rid, rid_created = RegisteredID.objects.get_or_create(
            id_number=id_num,
            defaults={
                'role': role,
                'created_by': admin
            }
        )
        if rid_created:
            print(f"  + Added {role} Invite: {id_num}")
        else:
            print(f"  . {role} Invite {id_num} already exists")

    print("\n--- Setup Complete ---")
    print("You can now log in with the admin account and use the invitation IDs above to register new accounts.")

if __name__ == '__main__':
    setup()
