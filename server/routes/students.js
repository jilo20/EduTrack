import express from 'express';
import { db } from '../db.js';
import { computeStudentGWA } from '../gwa.js';

const router = express.Router();

// Student dashboard (used by Assignments & Attendance legacy routes)
router.get('/:id/dashboard', (req, res) => {
    const studentId = parseInt(req.params.id);
    const enrollments = db.enrollments.filter(e => e.student_id === studentId);
    const sectionIds = enrollments.map(e => e.section_id);
    const assessments = db.assessments.filter(a => sectionIds.includes(a.section_id));
    const scores = db.scores.filter(s => s.student_id === studentId);
    const attendance = db.attendance.filter(a => a.student_id === studentId);
    const presentCount = attendance.filter(r => r.status === 'Present').length;

    const gwaData = computeStudentGWA(studentId);

    res.json({
        profile: db.users.find(u => u.id === studentId),
        attendance_percentage: attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0,
        recent_attendance: attendance.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
        recent_scores: scores.slice(-10).map(s => {
            const assessment = assessments.find(a => a.id === s.assessment_id) ||
                               db.assessments.find(a => a.id === s.assessment_id);
            return {
                score_id: s.id,
                score: s.score,
                assessment: assessment ? {
                    title: assessment.title,
                    type: assessment.type,
                    perfect_score: assessment.perfect_score,
                    description: `${assessment.type} — ${assessment.title}`
                } : null
            };
        }),
        current_gpa: gwaData.gwa,
        equivalent_grade: gwaData.equivalentGrade,
        grade_description: gwaData.gradeDescription
    });
});

export default router;
