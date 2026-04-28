import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem,
    Stack, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, Tooltip,
    Snackbar, Alert
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const GradingHub = () => {
    const teacher = JSON.parse(localStorage.getItem('user'));
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
    const [roster, setRoster] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [dbScores, setDBScores] = useState([]);
    const [open, setOpen] = useState(false);
    const [newAssessment, setNewAssessment] = useState({ title: '', type: 'Quiz', perfectScore: 50 });
    const [studentScores, setStudentScores] = useState({});
    const [editMode, setEditMode] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Grade change reason dialog
    const [reasonOpen, setReasonOpen] = useState(false);
    const [changeReason, setChangeReason] = useState('');
    const [pendingEdit, setPendingEdit] = useState(null); // { studentId }

    useEffect(() => {
        const fetchClasses = async () => {
            const res = await fetch(`/api/teacher/${teacher.id}/classes`);
            const data = await res.json();
            setClasses(data);
            if (data.length > 0) setSelectedClassId(data[0].id);
        };
        fetchClasses();
    }, [teacher.id]);

    useEffect(() => {
        if (selectedClassId) {
            const fetchRoster = async () => {
                const res = await fetch(`/api/class/${selectedClassId}/roster`);
                const data = await res.json();
                setRoster(data.students);
                setAssessments(data.assessments);
                setDBScores(data.existingScores || []);
                if (data.assessments.length > 0) setSelectedAssessmentId(data.assessments[0].id);
                else setSelectedAssessmentId('');
            };
            fetchRoster();
        }
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedAssessmentId && dbScores.length > 0) {
            const currentScores = {};
            dbScores.filter(s => s.assessment_id.toString() === selectedAssessmentId.toString()).forEach(s => {
                currentScores[s.student_id] = s.score.toString();
            });
            setStudentScores(currentScores);
        } else {
            setStudentScores({});
        }
        setEditMode({});
    }, [selectedAssessmentId, dbScores]);

    const activeAssessment = assessments.find(a => a.id === selectedAssessmentId);

    const handleScoreChange = (sid, score) => {
        if (!activeAssessment) return;
        const val = parseFloat(score);
        let updatedScore = score;
        if (val < 0) updatedScore = '0';
        if (val > activeAssessment.perfect_score) updatedScore = activeAssessment.perfect_score.toString();
        setStudentScores({ ...studentScores, [sid]: updatedScore });
    };

    const handleRequestEdit = (studentId) => {
        setPendingEdit({ studentId });
        setChangeReason('');
        setReasonOpen(true);
    };

    const handleConfirmEdit = () => {
        if (!changeReason.trim()) return;
        setEditMode({ ...editMode, [pendingEdit.studentId]: true });
        setReasonOpen(false);
    };

    const handleCreateAssessment = async () => {
        const res = await fetch('/api/create-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newAssessment, sectionId: selectedClassId })
        });
        const data = await res.json();
        setAssessments([...assessments, data]);
        setSelectedAssessmentId(data.id);
        setOpen(false);
        setSnackbar({ open: true, message: 'Assessment created.', severity: 'success' });
    };

    const handleSubmitScores = async () => {
        if (!selectedAssessmentId) return;
        const scoresToSubmit = Object.entries(studentScores)
            .filter(([id, score]) => score !== '')
            .map(([id, score]) => ({ studentId: id, score: parseFloat(score) }));

        const res = await fetch('/api/submit-scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assessmentId: selectedAssessmentId,
                scores: scoresToSubmit,
                reason: changeReason || 'Initial grading',
                teacherId: teacher.id
            })
        });

        if (res.ok) {
            setSnackbar({ open: true, message: 'Grades finalized and audit logged.', severity: 'success' });
            const rosterRes = await fetch(`/api/class/${selectedClassId}/roster`);
            const rosterData = await rosterRes.json();
            setDBScores(rosterData.existingScores || []);
            setEditMode({});
            setChangeReason('');
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                    Academic Assessment Center
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Create assessments, enter grades, and manage class evaluations.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Select a Class</Typography>
                            <FormControl fullWidth sx={{ mt: 1 }}>
                                <InputLabel>Available Sections</InputLabel>
                                <Select value={selectedClassId} label="Available Sections" onChange={(e) => setSelectedClassId(e.target.value)}>
                                    {classes.map(cls => (<MenuItem key={cls.id} value={cls.id}>{cls.name} ({cls.section})</MenuItem>))}
                                </Select>
                            </FormControl>
                        </CardContent>
                    </Card>
                </Grid>

                {selectedClassId && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <FormControl sx={{ minWidth: 250 }}>
                                <InputLabel>Assessment</InputLabel>
                                <Select value={selectedAssessmentId} label="Assessment" onChange={(e) => setSelectedAssessmentId(e.target.value)}>
                                    {assessments.map(a => (<MenuItem key={a.id} value={a.id}>{a.title} ({a.type})</MenuItem>))}
                                    {assessments.length === 0 && <MenuItem disabled>No assessments created</MenuItem>}
                                </Select>
                            </FormControl>
                            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setOpen(true)}
                                sx={{ bgcolor: '#2563EB', fontWeight: 700, borderRadius: 2 }}>
                                New Assessment
                            </Button>
                        </Paper>
                    </Grid>
                )}

                {activeAssessment && (
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                            <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight={800}>
                                        {activeAssessment.title} <Chip label={activeAssessment.type} size="small" sx={{ ml: 1, fontWeight: 700 }} />
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={800}>
                                        MAX POINTS: {activeAssessment.perfect_score}
                                    </Typography>
                                </Box>
                                <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSubmitScores}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}>
                                    Finalize Records
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Raw Score</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">%</TableCell>
                                            <TableCell align="right"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {roster.map((student) => {
                                            const score = studentScores[student.id];
                                            const isGraded = dbScores.some(s => s.assessment_id.toString() === selectedAssessmentId.toString() && s.student_id === student.id);
                                            const isEditing = editMode[student.id];
                                            const isDisabled = isGraded && !isEditing;
                                            const percentage = score && activeAssessment ? Math.round((parseFloat(score) / activeAssessment.perfect_score) * 100) : null;

                                            return (
                                                <TableRow key={student.id} hover>
                                                    <TableCell sx={{ fontWeight: 600 }}>{student.name}</TableCell>
                                                    <TableCell sx={{ color: 'text.secondary' }}>{student.email}</TableCell>
                                                    <TableCell align="center">
                                                        <TextField size="small" type="number" disabled={isDisabled}
                                                            placeholder={isDisabled ? "LOCKED" : "Grade"}
                                                            value={score || ''} onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                            sx={{ width: 100, '& .MuiOutlinedInput-input': { fontWeight: 800, p: 1, textAlign: 'center' } }} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {percentage !== null && (
                                                            <Chip label={`${percentage}%`} size="small"
                                                                color={percentage >= 85 ? 'success' : percentage >= 75 ? 'primary' : 'error'}
                                                                sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {isGraded ? (
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Chip label="FINALIZED" color="success" size="small" icon={<LockIcon />}
                                                                    sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                                                <Tooltip title="Edit Grade (requires reason)">
                                                                    <IconButton size="small" onClick={() => isEditing ? setEditMode({ ...editMode, [student.id]: false }) : handleRequestEdit(student.id)}>
                                                                        <EditIcon fontSize="small" color={isEditing ? "primary" : "action"} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>PENDING</Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Create Assessment Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Create Assessment</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField fullWidth label="Assessment Title" value={newAssessment.title} onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })} />
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select value={newAssessment.type} label="Category" onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}>
                                <MenuItem value="Assignment">Assignment</MenuItem>
                                <MenuItem value="Quiz">Quiz</MenuItem>
                                <MenuItem value="Project">Project</MenuItem>
                                <MenuItem value="Exam">Module / Final Exam</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth type="number" label="Perfect Score" value={newAssessment.perfectScore} onChange={(e) => setNewAssessment({ ...newAssessment, perfectScore: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateAssessment} sx={{ bgcolor: '#2563EB', fontWeight: 700 }}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* Grade Change Reason Dialog */}
            <Dialog open={reasonOpen} onClose={() => setReasonOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#F59E0B' }} /> Grade Modification Request
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Editing a finalized grade is a tracked action. Please provide a reason for this change. This will be logged in the audit trail.
                    </Typography>
                    <TextField
                        fullWidth multiline rows={3}
                        label="Reason for Grade Change"
                        placeholder="e.g. Recomputed due to appeal, scoring error correction..."
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setReasonOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" color="warning" disabled={!changeReason.trim()} onClick={handleConfirmEdit} sx={{ fontWeight: 700 }}>
                        Proceed with Edit
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default GradingHub;
