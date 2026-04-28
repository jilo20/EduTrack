import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select,
    MenuItem, Stack, Chip, TextField, Snackbar, Alert, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import EventNoteIcon from '@mui/icons-material/EventNote';

const AttendanceManager = () => {
    const teacher = JSON.parse(localStorage.getItem('user'));
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [roster, setRoster] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: { status, remarks } }
    const [existingRecords, setExistingRecords] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
            };
            fetchRoster();
        }
    }, [selectedClassId]);

    // Load existing attendance when date or class changes
    useEffect(() => {
        if (selectedClassId && selectedDate) {
            const fetchAttendance = async () => {
                const res = await fetch(`/api/class/${selectedClassId}/attendance?date=${selectedDate}`);
                const data = await res.json();
                setExistingRecords(data);

                // Pre-fill from existing records
                const prefilled = {};
                data.forEach(r => {
                    prefilled[r.student_id] = { status: r.status, remarks: r.remarks || '' };
                });
                // Default remaining students to 'Present'
                roster.forEach(s => {
                    if (!prefilled[s.id]) {
                        prefilled[s.id] = { status: 'Present', remarks: '' };
                    }
                });
                setAttendanceRecords(prefilled);
            };
            fetchAttendance();
        }
    }, [selectedClassId, selectedDate, roster.length]);

    const handleStatusChange = (studentId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks }
        }));
    };

    const handleSubmit = async () => {
        const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
            studentId: parseInt(studentId),
            status: data.status,
            remarks: data.remarks
        }));

        const res = await fetch('/api/mark-attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sectionId: selectedClassId,
                date: selectedDate,
                records,
                teacherId: teacher.id
            })
        });

        if (res.ok) {
            setSnackbar({ open: true, message: `Attendance for ${selectedDate} saved successfully.`, severity: 'success' });
        } else {
            setSnackbar({ open: true, message: 'Failed to save attendance.', severity: 'error' });
        }
    };

    const presentCount = Object.values(attendanceRecords).filter(r => r.status === 'Present').length;
    const absentCount = Object.values(attendanceRecords).filter(r => r.status === 'Absent').length;
    const lateCount = Object.values(attendanceRecords).filter(r => r.status === 'Late').length;

    const statusColors = {
        Present: { bg: '#ecfdf5', color: '#059669', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
        Absent: { bg: '#fee2e2', color: '#DC2626', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
        Late: { bg: '#fef3c7', color: '#D97706', icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                    Attendance Manager
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Mark and manage daily attendance for your classes.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Controls */}
                <Grid item xs={12} md={5}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Class & Date</Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Class</InputLabel>
                                    <Select value={selectedClassId} label="Select Class" onChange={(e) => setSelectedClassId(e.target.value)}>
                                        {classes.map(cls => (<MenuItem key={cls.id} value={cls.id}>{cls.name} ({cls.section})</MenuItem>))}
                                    </Select>
                                </FormControl>
                                <TextField fullWidth type="date" label="Date" value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Summary */}
                <Grid item xs={12} md={7}>
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
                        {[
                            { label: 'Present', count: presentCount, color: '#059669', bg: '#ecfdf5' },
                            { label: 'Absent', count: absentCount, color: '#DC2626', bg: '#fee2e2' },
                            { label: 'Late', count: lateCount, color: '#D97706', bg: '#fef3c7' },
                        ].map(stat => (
                            <Card key={stat.label} elevation={0} sx={{ 
                                width: 140, height: 140, 
                                border: '1px solid', borderColor: 'divider', borderRadius: 4,
                                display: 'flex', flexDirection: 'column', justifyContent: 'center'
                            }}>
                                <CardContent sx={{ textAlign: 'center', p: '16px !important' }}>
                                    <Typography variant="h3" fontWeight={900} sx={{ color: stat.color }}>{stat.count}</Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.secondary">{stat.label}</Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Grid>

                {/* Attendance Table */}
                {selectedClassId && roster.length > 0 && (
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                            <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <EventNoteIcon sx={{ color: '#2563EB' }} />
                                    <Typography variant="h6" fontWeight={800}>
                                        Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </Typography>
                                </Stack>
                                <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSubmit}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}>
                                    Save Attendance
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {roster.map((student) => {
                                            const record = attendanceRecords[student.id] || { status: 'Present', remarks: '' };
                                            return (
                                                <TableRow key={student.id} hover>
                                                    <TableCell sx={{ fontWeight: 600 }}>{student.name}</TableCell>
                                                    <TableCell sx={{ color: 'text.secondary' }}>{student.email}</TableCell>
                                                    <TableCell align="center">
                                                        <ToggleButtonGroup
                                                            value={record.status}
                                                            exclusive
                                                            onChange={(e, val) => val && handleStatusChange(student.id, val)}
                                                            size="small"
                                                        >
                                                            {['Present', 'Absent', 'Late'].map(status => {
                                                                const sc = statusColors[status];
                                                                return (
                                                                    <ToggleButton key={status} value={status}
                                                                        sx={{
                                                                            px: 1.5, fontWeight: 700, fontSize: '0.7rem',
                                                                            '&.Mui-selected': { bgcolor: sc.bg, color: sc.color, borderColor: sc.color, '&:hover': { bgcolor: sc.bg } }
                                                                        }}>
                                                                        {sc.icon}
                                                                        <Box component="span" sx={{ ml: 0.5 }}>{status}</Box>
                                                                    </ToggleButton>
                                                                );
                                                            })}
                                                        </ToggleButtonGroup>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField size="small" placeholder="Optional remarks..."
                                                            value={record.remarks} onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                                            sx={{ width: '100%', '& .MuiOutlinedInput-input': { fontSize: '0.8rem' } }} />
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

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AttendanceManager;
