import express from 'express';
import { db, hashPassword, comparePassword, generateToken, verifyToken } from '../db.js';
import { computeStudentGWA, computeSectionGrade } from '../gwa.js';

const router = express.Router();

// ─── AUTH ──────────────────────────────────────────────

// Login (single institution — no slug)
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (user.status === 'inactive') return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });

    if (!comparePassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, school_id: user.school_id }
    });
});

// Register (students/teachers self-register)
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields are required.' });
    if (!['Student', 'Teacher'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered.' });

    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const newUser = {
        id: db.getNextId('users'),
        school_id: 1,
        email,
        password: hashPassword(password),
        role,
        name,
        status: 'active'
    };
    db.push('users', newUser);
    res.status(201).json({ message: 'Account created successfully.' });
});

// ─── ADMIN: STATS ──────────────────────────────────────

router.get('/stats', (req, res) => {
    const users = db.users.filter(u => u.school_id === 1);
    res.json({
        teachers: users.filter(u => u.role === 'Teacher'),
        students: users.filter(u => u.role === 'Student'),
        teachersCount: users.filter(u => u.role === 'Teacher').length,
        studentsCount: users.filter(u => u.role === 'Student').length,
        sectionsCount: db.sections.filter(s => s.school_id === 1).length
    });
});

// ─── ADMIN: USER CRUD ──────────────────────────────────

// Create user (admin action)
router.post('/admin/users', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required.' });
    if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already taken.' });

    const newUser = {
        id: db.getNextId('users'),
        school_id: 1,
        email,
        password: hashPassword(password),
        role,
        name,
        status: 'active'
    };
    db.push('users', newUser);

    db.auditLog('USER_CREATED', req.body.adminId || 1, {
        target_user_id: newUser.id,
        target_user_name: name,
        details: `Created ${role} account for ${name}`
    });

    res.status(201).json({ message: 'User created', user: { id: newUser.id, name, email, role, status: 'active' } });
});

// Update user
router.put('/admin/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, email, role, status } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (status) updates.status = status;

    const updated = db.update('users', userId, updates);
    if (!updated) return res.status(404).json({ error: 'User not found.' });

    db.auditLog('USER_UPDATED', req.body.adminId || 1, {
        target_user_id: userId,
        details: `Updated user: ${JSON.stringify(updates)}`
    });

    res.json({ message: 'User updated', user: updated });
});

// Soft-delete user (set inactive)
router.delete('/admin/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    db.update('users', userId, { status: 'inactive' });

    db.auditLog('USER_DEACTIVATED', parseInt(req.query.adminId) || 1, {
        target_user_id: userId,
        target_user_name: user.name,
        details: `Deactivated account for ${user.name}`
    });

    res.json({ message: 'User deactivated.' });
});

// ─── ADMIN: AUDIT LOGS ────────────────────────────────

router.get('/audit-logs', (req, res) => {
    const logs = db.audit_logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
});

// ─── TEACHER: CLASSES ──────────────────────────────────

router.get('/teacher/:teacherId/classes', (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const classes = db.sections.filter(s => s.teacher_id === teacherId);
    res.json(classes.map(cls => ({
        id: cls.id,
        name: cls.course_program,
        section: cls.code_name,
        schedule: cls.schedule || 'TBA',
        studentCount: db.enrollments.filter(e => e.section_id === cls.id).length,
        weights: cls.settings?.weights || null
    })));
});

// Create class
router.post('/create-class', (req, res) => {
    const { name, section, teacherId, description, schedule } = req.body;
    if (!name || !section || !teacherId) return res.status(400).json({ error: 'All fields required.' });

    const newSection = {
        id: db.getNextId('sections'),
        school_id: 1,
        teacher_id: parseInt(teacherId),
        grade_id: 1,
        code_name: section,
        course_program: name,
        description: description || '',
        schedule: schedule || 'TBA',
        settings: {}
    };
    db.push('sections', newSection);
    res.status(201).json({ message: 'Class created', section: newSection });
});

// Update section weights
router.put('/class/:sectionId/weights', (req, res) => {
    const sectionId = parseInt(req.params.sectionId);
    const { weights } = req.body; // { Quiz: 0.3, Project: 0.3, 'Module Exam': 0.4 }

    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 1.0) > 0.01) {
        return res.status(400).json({ error: 'Weights must sum to 100%.' });
    }

    const section = db.sections.find(s => s.id === sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found.' });

    const settings = section.settings || {};
    settings.weights = weights;
    db.update('sections', sectionId, { settings });

    res.json({ message: 'Weights updated.', weights });
});

// ─── TEACHER: ROSTER & ENROLLMENT ─────────────────────

router.get('/class/:sectionId/roster', (req, res) => {
    const sectionId = parseInt(req.params.sectionId);
    const enrollments = db.enrollments.filter(e => e.section_id === sectionId);
    const studentIds = enrollments.map(e => e.student_id);
    const students = db.users.filter(u => studentIds.includes(u.id));
    const assessments = db.assessments.filter(a => a.section_id === sectionId);
    const assessmentIds = assessments.map(a => a.id);
    const existingScores = db.scores.filter(s => assessmentIds.includes(s.assessment_id));
    res.json({ students, assessments, existingScores });
});

router.post('/enroll-students', (req, res) => {
    const { sectionId, studentIds } = req.body;
    const sid = parseInt(sectionId);
    studentIds.forEach(studentId => {
        const alreadyEnrolled = db.enrollments.find(e => e.section_id === sid && e.student_id === parseInt(studentId));
        if (!alreadyEnrolled) {
            db.push('enrollments', { id: db.getNextId('enrollments'), section_id: sid, student_id: parseInt(studentId) });
        }
    });
    res.json({ message: 'Roster updated.' });
});

// School students pool (all students)
router.get('/students', (req, res) => {
    const students = db.users.filter(u => u.school_id === 1 && u.role === 'Student' && u.status !== 'inactive');
    res.json(students);
});

// ─── TEACHER: ASSESSMENTS & GRADING ───────────────────

router.post('/create-assessment', (req, res) => {
    const { sectionId, title, type, perfectScore } = req.body;
    const newAssessment = {
        id: db.getNextId('assessments'),
        section_id: parseInt(sectionId),
        title,
        type,
        perfect_score: parseInt(perfectScore)
    };
    db.push('assessments', newAssessment);
    res.status(201).json(newAssessment);
});

// Submit scores (with optional reason for audit trail)
router.post('/submit-scores', (req, res) => {
    const { assessmentId, scores, reason, teacherId } = req.body;
    const aid = parseInt(assessmentId);
    const assessment = db.assessments.find(a => a.id === aid);

    scores.forEach(s => {
        const result = db.upsertScore(aid, parseInt(s.studentId), parseInt(s.score));
        const student = db.users.find(u => u.id === parseInt(s.studentId));

        if (result.isUpdate && result.oldScore !== parseInt(s.score)) {
            // Grade was CHANGED — log it
            db.auditLog('GRADE_CHANGED', teacherId || 1, {
                assessment_id: aid,
                assessment_title: assessment?.title || 'Unknown',
                target_user_id: parseInt(s.studentId),
                target_user_name: student?.name || 'Unknown',
                old_value: result.oldScore,
                new_value: parseInt(s.score),
                reason: reason || 'No reason provided',
                details: `Grade changed from ${result.oldScore} to ${s.score} for ${student?.name} on "${assessment?.title}"`
            });
        } else if (!result.isUpdate) {
            db.auditLog('GRADE_ENTERED', teacherId || 1, {
                assessment_id: aid,
                assessment_title: assessment?.title || 'Unknown',
                target_user_id: parseInt(s.studentId),
                target_user_name: student?.name || 'Unknown',
                new_value: parseInt(s.score),
                details: `Initial grade of ${s.score} entered for ${student?.name} on "${assessment?.title}"`
            });
        }
    });
    res.json({ message: 'Scores updated.' });
});

// ─── TEACHER: ATTENDANCE ──────────────────────────────

router.get('/class/:sectionId/attendance', (req, res) => {
    const sectionId = parseInt(req.params.sectionId);
    const { date } = req.query;
    let records = db.attendance.filter(a => a.section_id === sectionId);
    if (date) records = records.filter(a => a.date === date);
    res.json(records);
});

router.post('/mark-attendance', (req, res) => {
    const { sectionId, date, records, teacherId } = req.body;
    // records = [{ studentId, status, remarks }]
    const sid = parseInt(sectionId);

    records.forEach(r => {
        const studentId = parseInt(r.studentId);
        // Check if record already exists for this date
        const existing = db.attendance.find(
            a => a.section_id === sid && a.student_id === studentId && a.date === date
        );

        if (existing) {
            db.update('attendance', existing.id, { status: r.status, remarks: r.remarks || '' });
        } else {
            db.push('attendance', {
                id: db.getNextId('attendance'),
                student_id: studentId,
                section_id: sid,
                date,
                status: r.status,
                remarks: r.remarks || ''
            });
        }
    });

    db.auditLog('ATTENDANCE_MARKED', teacherId || 1, {
        section_id: sid,
        date,
        details: `Attendance marked for ${records.length} students on ${date}`
    });

    res.json({ message: 'Attendance recorded.' });
});

// ─── TEACHER: ANALYTICS ───────────────────────────────

router.get('/teacher/:teacherId/analytics', (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const teacherSections = db.sections.filter(s => s.teacher_id === teacherId);
    const sectionIds = teacherSections.map(s => s.id);
    const enrollments = db.enrollments.filter(e => sectionIds.includes(e.section_id));
    const studentIds = [...new Set(enrollments.map(e => e.student_id))];
    const assessments = db.assessments.filter(a => sectionIds.includes(a.section_id));
    const assessmentIds = assessments.map(a => a.id);
    const scores = db.scores.filter(s => assessmentIds.includes(s.assessment_id));

    let totalPerc = 0; let count = 0;
    scores.forEach(s => {
        const a = assessments.find(ax => ax.id === s.assessment_id);
        if (a) { totalPerc += (s.score / a.perfect_score) * 100; count++; }
    });

    const studentStats = enrollments.map(e => {
        const user = db.users.find(u => u.id === e.student_id);
        const section = teacherSections.find(s => s.id === e.section_id);
        const myScores = scores.filter(s => s.student_id === e.student_id && assessments.find(a => a.id === s.assessment_id && a.section_id === e.section_id));
        
        let sTotal = 0; let sCount = 0;
        myScores.forEach(s => {
            const a = assessments.find(ax => ax.id === s.assessment_id);
            if (a) { sTotal += (s.score / a.perfect_score) * 100; sCount++; }
        });
        
        return { 
            name: user?.name, 
            average: sCount > 0 ? Math.round(sTotal / sCount) : 0,
            section_id: e.section_id,
            section_name: section?.code_name
        };
    }).sort((a, b) => b.average - a.average);

    res.json({
        totalStudents: studentIds.length,
        totalClasses: teacherSections.length,
        averagePerformance: count > 0 ? Math.round(totalPerc / count) : 0,
        topStudents: studentStats.slice(0, 50), // Return more so frontend can filter
        sections: teacherSections.map(s => ({ id: s.id, name: s.code_name }))
    });
});

// ─── STUDENT: PERFORMANCE & GWA ───────────────────────

router.get('/student/:studentId/performance', (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const enrollments = db.enrollments.filter(e => e.student_id === studentId);
    const sectionIds = enrollments.map(e => e.section_id);
    const assessments = db.assessments.filter(a => sectionIds.includes(a.section_id));
    const performance = assessments.map(a => {
        const scoreEntry = db.scores.find(s => s.assessment_id === a.id && s.student_id === studentId);
        const section = db.sections.find(s => s.id === a.section_id);
        return {
            id: a.id,
            title: a.title,
            type: a.type,
            perfectScore: a.perfect_score,
            achievedScore: scoreEntry ? scoreEntry.score : null,
            sectionName: section ? section.course_program : 'Unknown'
        };
    });
    res.json(performance);
});

router.get('/student/:studentId/gwa', (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const gwaData = computeStudentGWA(studentId);
    res.json(gwaData);
});

router.get('/student/:studentId/attendance', (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const records = db.attendance.filter(a => a.student_id === studentId);
    const presentCount = records.filter(r => r.status === 'Present').length;
    const total = records.length;
    res.json({
        records: records.sort((a, b) => new Date(b.date) - new Date(a.date)),
        total,
        presentCount,
        absentCount: records.filter(r => r.status === 'Absent').length,
        lateCount: records.filter(r => r.status === 'Late').length,
        percentage: total > 0 ? Math.round((presentCount / total) * 100) : 0
    });
});

// Student dashboard summary
router.get('/student/:studentId/dashboard', (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const gwaData = computeStudentGWA(studentId);
    const attendance = db.attendance.filter(a => a.student_id === studentId);
    const presentCount = attendance.filter(r => r.status === 'Present').length;
    const enrollments = db.enrollments.filter(e => e.student_id === studentId);
    const sectionIds = enrollments.map(e => e.section_id);
    const assessments = db.assessments.filter(a => sectionIds.includes(a.section_id));
    const scores = db.scores.filter(s => s.student_id === studentId);

    res.json({
        gwa: gwaData.gwa,
        equivalentGrade: gwaData.equivalentGrade,
        gradeDescription: gwaData.gradeDescription,
        attendancePercentage: attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0,
        totalAssessments: assessments.length,
        gradedAssessments: scores.length,
        pendingAssessments: assessments.length - scores.length
    });
});

// ─── MISC ─────────────────────────────────────────────

export default router;
