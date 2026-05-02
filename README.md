# EduTrack — University Management System

A full-stack academic management platform with role-based dashboards for **Admins**, **Teachers**, and **Students**.

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19 + Material UI + Recharts |
| Backend   | Django 6 + Django REST Framework  |
| Database  | SQLite (dev) / PostgreSQL (prod)  |
| Auth      | JWT via SimpleJWT                 |

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.12

### 1. Install frontend dependencies
```bash
npm install
```

### 2. Set up the Django backend
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Setup database and default admin
python manage.py migrate
python create_admin.py
```

### 3. Run both servers
Open two terminal windows/tabs:

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

The system will be accessible at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`

---

## 🔑 Default Accounts & Testing

After running `python create_admin.py`, you can use these to test:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@edutrack.com` | `admin` |

### 🎟️ Sample Invitation IDs
To test the **Registration** flow, use these pre-generated IDs:
- **Teacher Invites**: `T-2026-001`, `T-2026-002`
- **Student Invites**: `S-2026-001`, `S-2026-002`, `S-2026-003`


## Project Structure

```
EduTrack/
├── backend/                  # Django REST Framework
│   ├── manage.py
│   ├── config/               # Django settings, root URLs
│   ├── api/                  # Main API app
│   │   ├── models.py         # User, Section, Assessment, Score, etc.
│   │   ├── serializers.py    # DRF serializers
│   │   ├── permissions.py    # IsAdmin, IsTeacher, IsOwnerOrAdmin
│   │   ├── gwa.py            # GWA calculation engine
│   │   ├── urls.py           # API URL routing
│   │   ├── views/            # Organized by role
│   │   │   ├── auth.py       # Login, Register, Verify-ID
│   │   │   ├── admin.py      # Stats, User CRUD, Invites, Audit Logs
│   │   │   ├── teacher.py    # Classes, Grading, Attendance, Reports
│   │   │   ├── student.py    # Dashboard, Performance, GWA
│   │   │   ├── analytics.py  # Admin/Teacher/Student analytics
│   │   │   └── misc.py       # Status, Notifications, Announcements
│   │   └── management/commands/
│   │       └── import_data.py # JSON → SQLite migration
│   └── requirements.txt
├── src/                      # React frontend
│   ├── App.jsx               # Router with ErrorBoundary
│   ├── components/
│   │   ├── Admin/            # AdminDashboard, UserManager, AuditLogs
│   │   ├── Teacher/          # TeacherDashboard, GradingHub, Attendance
│   │   ├── Student/          # StudentDashboard, AcademicPerformance
│   │   ├── Auth/             # Login, Register
│   │   └── Common/           # DashboardLayout, ErrorBoundary, Announcements
│   └── index.css
├── index.html
├── package.json
└── vite.config.js            # Proxy /api → Django :8000
```

## API Endpoints

### Auth (public)
- `POST /api/login` — JWT login
- `POST /api/verify-id` — Validate registration ID
- `POST /api/register` — Create account

### Admin (requires Admin role)
- `GET /api/stats` — System statistics
- `POST /api/admin/invite` — Generate invite ID
- `GET /api/admin/invites` — List invites
- `POST|PUT|DELETE /api/admin/users` — User management
- `GET /api/audit-logs` — Audit trail

### Teacher (requires Teacher/Admin role)
- `GET /api/teacher/:id/classes` — Teacher's sections
- `POST /api/create-class` — Create section
- `GET /api/class/:id/roster` — Class roster & scores
- `POST /api/create-assessment` — Create assessment
- `POST /api/submit-scores` — Grade students
- `POST /api/mark-attendance` — Record attendance

### Student (requires ownership or Admin)
- `GET /api/students/:id/dashboard` — Student dashboard
- `GET /api/student/:id/gwa` — GWA computation
- `GET /api/student/:id/performance` — Assessment results
- `GET /api/student/:id/attendance` — Attendance records

### Analytics
- `GET /api/analytics/admin` — System-wide analytics
- `GET /api/analytics/teacher/:id` — Teacher analytics
- `GET /api/analytics/student/:id` — Student analytics

## License

ISC
