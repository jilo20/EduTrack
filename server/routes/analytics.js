import express from 'express';
import { db } from '../db.js';
import { computeStudentGWA, computeSectionGrade } from '../gwa.js';

const router = express.Router();

// Helper to get attendance stats
const getAttendanceStats = (studentId, sectionId = null) => {
    let records = db.attendance;
    if (studentId) records = records.filter(r => r.student_id === studentId);
    if (sectionId) records = records.filter(r => r.section_id === sectionId);

    const total = records.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    const percentage = total > 0 ? Math.round(((presentCount + (lateCount * 0.5)) / total) * 100) : 0;

    return { total, presentCount, absentCount, lateCount, percentage };
};

// Admin Analytics
router.get('/admin', (req, res) => {
    const students = db.users.filter(u => u.role === 'Student');
    const teachers = db.users.filter(u => u.role === 'Teacher');
    const sections = db.sections;

    // Enrollment distribution
    const enrollmentStats = sections.map(s => ({
        name: s.code_name,
        fullName: s.course_program,
        count: db.enrollments.filter(e => e.section_id === s.id).length
    }));

    // System-wide performance (average GWA)
    const studentGWAs = students.map(s => computeStudentGWA(s.id).gwa).filter(gwa => gwa > 0);
    const systemAvgGWA = studentGWAs.length > 0 
        ? Math.round((studentGWAs.reduce((a, b) => a + b, 0) / studentGWAs.length) * 10) / 10 
        : 0;

    // Recent activity (from audit logs)
    const recentActivity = [...db.audit_logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    res.json({
        stats: {
            totalStudents: students.length,
            totalTeachers: teachers.length,
            totalSections: sections.length,
            systemAvgGWA
        },
        enrollmentStats,
        recentActivity
    });
});

// Teacher Analytics
router.get('/teacher/:teacherId', (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const teacherSections = db.sections.filter(s => s.teacher_id === teacherId);
    
    // Performance comparison
    const classPerformance = teacherSections.map(s => {
        const enrollments = db.enrollments.filter(e => e.section_id === s.id);
        const studentIds = enrollments.map(e => e.student_id);
        const gwas = studentIds.map(id => computeSectionGrade(id, s.id).sectionGrade).filter(g => g > 0);
        const avg = gwas.length > 0 ? Math.round((gwas.reduce((a, b) => a + b, 0) / gwas.length) * 10) / 10 : 0;
        
        return {
            id: s.id,
            name: s.code_name,
            fullName: s.course_program,
            average: avg,
            studentCount: enrollments.length
        };
    });

    // Assessment completion
    const assessmentStats = teacherSections.map(s => {
        const assessments = db.assessments.filter(a => a.section_id === s.id);
        const enrollments = db.enrollments.filter(e => e.section_id === s.id);
        const totalPossible = assessments.length * enrollments.length;
        const totalGraded = db.scores.filter(sc => assessments.some(a => a.id === sc.assessment_id)).length;
        
        return {
            name: s.code_name,
            total: totalPossible,
            graded: totalGraded,
            pending: totalPossible - totalGraded
        };
    });

    // At-risk students (GWA < 75 in any of their classes)
    const atRisk = [];
    teacherSections.forEach(s => {
        const enrollments = db.enrollments.filter(e => e.section_id === s.id);
        enrollments.forEach(e => {
            const grade = computeSectionGrade(e.student_id, s.id).sectionGrade;
            if (grade > 0 && grade < 75) {
                const student = db.users.find(u => u.id === e.student_id);
                atRisk.push({
                    id: student.id,
                    name: student.name,
                    section: s.code_name,
                    grade
                });
            }
        });
    });

    // Category performance across all classes
    const categoryStats = {
        'Quiz': { sum: 0, count: 0 },
        'Project': { sum: 0, count: 0 },
        'Module Exam': { sum: 0, count: 0 }
    };

    teacherSections.forEach(s => {
        const enrollments = db.enrollments.filter(e => e.section_id === s.id);
        enrollments.forEach(e => {
            const breakdown = computeSectionGrade(e.student_id, s.id).categoryBreakdown;
            Object.entries(breakdown).forEach(([type, data]) => {
                if (categoryStats[type]) {
                    categoryStats[type].sum += data.average;
                    categoryStats[type].count++;
                }
            });
        });
    });

    const categoryPerformance = Object.entries(categoryStats).map(([type, data]) => ({
        type,
        average: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0
    }));

    res.json({
        classPerformance,
        assessmentStats,
        atRisk,
        categoryPerformance
    });
});

// Student Analytics
router.get('/student/:studentId', (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const gwaInfo = computeStudentGWA(studentId);
    
    // Performance trend (over all graded assessments sorted by date/id)
    const studentScores = db.scores.filter(s => s.student_id === studentId);
    const trendData = studentScores.map(s => {
        const assessment = db.assessments.find(a => a.id === s.assessment_id);
        return {
            id: s.id,
            title: assessment?.title || 'Unknown',
            score: Math.round((s.score / (assessment?.perfect_score || 1)) * 100),
            date: assessment?.id // Simplification: using ID as proxy for time
        };
    }).sort((a, b) => a.id - b.id);

    // Category Strengths (Radar Chart)
    const summaryBreakdown = {};
    gwaInfo.sectionGrades.forEach(sg => {
        Object.entries(sg.categoryBreakdown).forEach(([type, data]) => {
            if (!summaryBreakdown[type]) summaryBreakdown[type] = { sum: 0, count: 0 };
            summaryBreakdown[type].sum += data.average;
            summaryBreakdown[type].count++;
        });
    });

    const categoryStrengths = Object.keys(summaryBreakdown).length > 0 
        ? Object.entries(summaryBreakdown).map(([cat, data]) => ({
            subject: cat,
            A: Math.round(data.sum / data.count),
            fullMark: 100
        }))
        : ['Quiz', 'Project', 'Module Exam', 'Assignment'].map(cat => ({
            subject: cat,
            A: 0,
            fullMark: 100
        }));

    // Attendance data (last 30 days or similar)
    const attendanceRecords = db.attendance.filter(r => r.student_id === studentId);
    const attendanceStats = getAttendanceStats(studentId);

    res.json({
        gwa: gwaInfo.gwa,
        equivalentGrade: gwaInfo.equivalentGrade,
        trendData,
        categoryStrengths,
        attendanceStats,
        recentGrades: trendData.slice(-5).reverse()
    });
});

export default router;
