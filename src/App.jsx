import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Layout
import DashboardLayout from './components/Common/DashboardLayout';

// Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';
import BroadcastCenter from './components/Admin/BroadcastCenter';
import StudentManagement from './components/Admin/StudentManagement';
import AuditLogs from './components/Admin/AuditLogs';
import InviteCenter from './components/Admin/InviteCenter';
import UserManager from './components/Admin/UserManager';

// Teacher Components
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import TeacherClasses from './components/Teacher/TeacherClasses';
import GradingHub from './components/Teacher/GradingHub';
import AttendanceManager from './components/Teacher/AttendanceManager';

// Student Components
import StudentDashboard from './components/Student/StudentDashboard';
import AcademicPerformance from './components/Student/AcademicPerformance';
import Assignments from './components/Student/Assignments';
import Attendance from './components/Student/Attendance';
import Announcements from './components/Common/Announcements';

import './App.css';
import ErrorBoundary from './components/Common/ErrorBoundary';

const DashboardRouter = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return <Navigate to="/" replace />;
    try {
        const user = JSON.parse(userStr);
        if (!user) return <Navigate to="/" replace />;
        if (user.role === 'Admin') return <AdminDashboard />;
        if (user.role === 'Teacher') return <TeacherDashboard />;
        return <StudentDashboard />;
    } catch (e) {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }
};

const PerformanceRouter = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return <Navigate to="/" replace />;
    try {
        const user = JSON.parse(userStr);
        if (!user) return <Navigate to="/" replace />;
        if (user.role === 'Teacher') return <GradingHub />;
        return <AcademicPerformance />;
    } catch (e) {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }
};

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<DashboardRouter />} />
                            <Route path="users" element={<UserManager />} />
                            <Route path="broadcast" element={<BroadcastCenter />} />
                            <Route path="audit-logs" element={<AuditLogs />} />
                            <Route path="classes" element={<TeacherClasses />} />
                            <Route path="performance" element={<PerformanceRouter />} />
                            <Route path="attendance" element={<AttendanceManager />} />
                            <Route path="my-attendance" element={<Attendance />} />
                            <Route path="assignments" element={<Assignments />} />
                            <Route path="announcements" element={<Announcements />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
