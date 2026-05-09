import os
import django
import random

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import RegisteredID

User = get_user_model()

first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]

def create_students(count=10):
    print(f"--- Creating {count} Student Users ---")
    
    admin = User.objects.filter(role='Admin').first()
    
    created_count = 0
    for i in range(count):
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        email = f"{fname.lower()}.{lname.lower()}{random.randint(100,999)}@edutrack.edu"
        id_num = f"S-2026-{random.randint(1000, 9999)}"
        
        # Ensure ID is unique
        while User.objects.filter(id_number=id_num).exists() or RegisteredID.objects.filter(id_number=id_num).exists():
            id_num = f"S-2026-{random.randint(1000, 9999)}"
            
        # Create RegisteredID first for consistency
        RegisteredID.objects.get_or_create(
            id_number=id_num,
            defaults={'role': 'Student', 'is_used': True, 'used_by_email': email, 'created_by': admin}
        )
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': fname,
                'last_name': lname,
                'role': 'Student',
                'id_number': id_num,
                'status': 'active'
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✅ Created Student: {user.get_full_name()} ({email}) - ID: {id_num}")
            created_count += 1
        else:
            print(f"⚠️ Student {email} already exists")
    
    print(f"\n--- Done! Created {created_count} students. ---")
    print("Default password for all is: password123")

if __name__ == '__main__':
    create_students()
