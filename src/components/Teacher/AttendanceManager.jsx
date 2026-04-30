import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select,
    MenuItem, Stack, Chip, TextField, Snackbar, Alert, ToggleButtonGroup, ToggleButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import SummarizeIcon from '@mui/icons-material/Summarize';

// Schedule-to-day mapping
const SCHEDULE_DAYS = {
    MWF: [1, 3, 5],   // Mon, Wed, Fri
    TTH: [2, 4],       // Tue, Thu
    Sat: [6],           // Saturday
    Daily: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const isClassDay = (schedule, dateString) => {
    if (!schedule || schedule === 'TBA') return true; // TBA = allow any day
    const dayOfWeek = new Date(dateString).getDay();
    const allowedDays = SCHEDULE_DAYS[schedule];
    return allowedDays ? allowedDays.includes(dayOfWeek) : true;
};

const AttendanceManager = () => {
    const teacher = (() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) { return null; }
    })();
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [roster, setRoster] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [existingRecords, setExistingRecords] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // End Class state
    const [endClassOpen, setEndClassOpen] = useState(false);
    const [endClassReport, setEndClassReport] = useState(null);
    const [endingClass, setEndingClass] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!teacher || !teacher.id) return;
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/teacher/${teacher.id}/classes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setClasses(data);
                        if (data.length > 0) setSelectedClassId(data[0].id);
                    }
                }

            } catch (err) {
                console.error('Failed to fetch classes:', err);
            }
        };
        fetchClasses();
    }, [teacher?.id]);

    useEffect(() => {
        if (selectedClassId) {
            const fetchRoster = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`/api/class/${selectedClassId}/roster`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.students && Array.isArray(data.students)) {
                            setRoster(data.students);
                        } else {
                            setRoster([]);
                        }
                    } else {
                        setRoster([]);
                    }

                } catch (err) {
                    console.error('Failed to fetch roster:', err);
                    setRoster([]);
                }
            };
            fetchRoster();
        } else {
            setRoster([]);
        }
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedClassId && selectedDate) {
            const fetchAttendance = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`/api/class/${selectedClassId}/attendance?date=${selectedDate}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            setExistingRecords(data);
                            const prefilled = {};
                            data.forEach(r => {
                                prefilled[r.student_id] = { status: r.status, remarks: r.remarks || '' };
                            });
                            (roster || []).forEach(s => {
                                if (!prefilled[s.id]) {
                                    prefilled[s.id] = { status: 'Present', remarks: '' };
                                }
                            });
                            setAttendanceRecords(prefilled);
                        }
                    }

                } catch (err) {
                    console.error('Failed to fetch attendance:', err);
                }
            };
            fetchAttendance();
        } else {
            setExistingRecords([]);
            setAttendanceRecords({});
        }
    }, [selectedClassId, selectedDate, roster.length]);

    const [analytics, setAnalytics] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchAnalytics = async () => {
        if (!teacher || !teacher.id) return;
        const token = localStorage.getItem('token');
        try {
            const url = `/api/analytics/teacher/${teacher.id}${selectedClassId ? `?sectionId=${selectedClassId}` : ''}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.attendance) setAnalytics(data.attendance);
            }

        } catch (err) { console.error('Failed to fetch analytics'); }
    };

    useEffect(() => { fetchAnalytics(); }, [teacher?.id, selectedClassId]);

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const isCompleted = selectedClass?.status === 'completed';
    const classSchedule = selectedClass?.schedule || 'TBA';
    const dateIsClassDay = isClassDay(classSchedule, selectedDate);
    const selectedDayName = DAY_NAMES[new Date(selectedDate).getDay()];

    const filteredRoster = roster.filter(student => {
        const name = student.name || '';
        const email = student.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             email.toLowerCase().includes(searchTerm.toLowerCase());
        const record = attendanceRecords[student.id] || { status: 'Present' };
        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusChange = (studentId, status) => {
        setAttendanceRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setAttendanceRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
            studentId: parseInt(studentId), status: data.status, remarks: data.remarks
        }));
        const res = await fetch('/api/mark-attendance', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sectionId: selectedClassId, date: selectedDate, records })
        });
        if (res.ok) {
            setSnackbar({ open: true, message: `Attendance for ${selectedDate} saved successfully.`, severity: 'success' });
            fetchAnalytics();
        } else {
            setSnackbar({ open: true, message: 'Failed to save attendance.', severity: 'error' });
        }
    };

    const handleMarkNoClass = async () => {
        const token = localStorage.getItem('token');
        const records = roster.map(s => ({ studentId: s.id, status: 'No Class', remarks: 'No class scheduled' }));
        const res = await fetch('/api/mark-attendance', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sectionId: selectedClassId, date: selectedDate, records })
        });
        if (res.ok) {
            setSnackbar({ open: true, message: `${selectedDate} marked as No Class.`, severity: 'info' });
        }
    };

    const handleEndClass = async () => {
        setEndingClass(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/class/${selectedClassId}/end-semester`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (res.ok) {
                setEndClassReport(data.report);
            } else {
                setSnackbar({ open: true, message: data.error || 'Failed to generate report.', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Network error.', severity: 'error' });
        } finally {
            setEndingClass(false);
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
                {/* Lifetime Analytics Card */}
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'primary.light', borderRadius: 4, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>
                        <Grid container spacing={4} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <Stack spacing={0.5}>
                                    <Typography variant="overline" fontWeight={800} color="primary" sx={{ letterSpacing: '1px' }}>Lifetime Average</Typography>
                                    <Typography variant="h3" fontWeight={900} color="primary.dark">{analytics.percentage}%</Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Overall Attendance Rate</Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={9}>
                                <Stack direction="row" spacing={3} sx={{ overflowX: 'auto', pb: 1 }}>
                                    {[
                                        { label: 'Total Present', count: analytics.present, color: '#059669' },
                                        { label: 'Total Absent', count: analytics.absent, color: '#DC2626' },
                                        { label: 'Total Late', count: analytics.late, color: '#D97706' },
                                        { label: 'Total Records', count: analytics.total, color: '#64748b' },
                                    ].map(stat => (
                                        <Box key={stat.label} sx={{ minWidth: 150, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
                                            <Typography variant="h5" fontWeight={900} sx={{ color: stat.color }}>{stat.count}</Typography>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Controls */}
                <Grid item xs={12} md={4} lg={3} sx={{ minWidth: 320 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Class & Date</Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Class</InputLabel>
                                    <Select value={selectedClassId} label="Select Class" onChange={(e) => setSelectedClassId(e.target.value)}>
                                        <MenuItem value=""><em>Overall (All Classes)</em></MenuItem>
                                        {classes.map(cls => (
                                            <MenuItem key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.section})
                                                <Chip label={cls.schedule || 'TBA'} size="small" sx={{ ml: 1, fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField fullWidth type="date" label="Date" value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                                {selectedClassId && classSchedule !== 'TBA' && (
                                    <Chip 
                                        label={`Schedule: ${classSchedule}`} 
                                        size="small" 
                                        sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#2563eb' }} 
                                    />
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                    {/* End Semester Button */}
                    {selectedClassId && (
                        <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<StopCircleIcon />}
                            onClick={() => { setConfirmText(''); setEndClassOpen(true); }}
                            sx={{ fontWeight: 700, borderRadius: 3, mt: 2 }}
                        >
                            End Semester
                        </Button>
                    )}
                </Grid>

                {/* Today's Summary */}
                {selectedClassId && (
                    <Grid item xs={12} md={8} lg={9}>
                        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
                            <Box sx={{ mr: 2, textAlign: 'right' }}>
                                <Typography variant="subtitle2" fontWeight={800} color="text.secondary">TODAY'S</Typography>
                                <Typography variant="h6" fontWeight={900}>SUMMARY</Typography>
                            </Box>
                            {[
                                { label: 'Present', count: presentCount, color: '#059669' },
                                { label: 'Absent', count: absentCount, color: '#DC2626' },
                                { label: 'Late', count: lateCount, color: '#D97706' },
                            ].map(stat => (
                                <Card key={stat.label} elevation={0} sx={{
                                    width: 120, height: 120,
                                    border: '1px solid', borderColor: 'divider', borderRadius: 4,
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                }}>
                                    <CardContent sx={{ textAlign: 'center', p: '16px !important' }}>
                                        <Typography variant="h4" fontWeight={900} sx={{ color: stat.color }}>{stat.count}</Typography>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Grid>
                )}

                {/* Attendance Table or No-Class Notice */}
                {selectedClassId && (
                    <Grid item xs={12}>
                        {!dateIsClassDay ? (
                            /* No Class Day Banner */
                            <Paper elevation={0} sx={{ p: 6, border: '1px solid', borderColor: '#fbbf24', borderRadius: 4, bgcolor: '#fffbeb', textAlign: 'center' }}>
                                <EventBusyIcon sx={{ fontSize: 64, color: '#d97706', mb: 2 }} />
                                <Typography variant="h5" fontWeight={900} color="#92400e">No Class Scheduled</Typography>
                                <Typography variant="body1" color="#a16207" fontWeight={600} sx={{ mt: 1 }}>
                                    {selectedDayName} is not a class day for this section.
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                                    This class is scheduled for <strong>{classSchedule}</strong> only.
                                </Typography>
                                <Button 
                                    variant="contained" 
                                    color="warning" 
                                    startIcon={<EventBusyIcon />} 
                                    onClick={handleMarkNoClass}
                                    sx={{ fontWeight: 800, borderRadius: 2 }}
                                >
                                    Confirm No Class for Today
                                </Button>
                            </Paper>
                        ) : (
                            /* Normal Attendance Table */
                            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                                <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <EventNoteIcon sx={{ color: '#2563EB' }} />
                                        <Typography variant="h6" fontWeight={800}>
                                            Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1.5}>
                                        <Button variant="outlined" color="warning" size="small" startIcon={<EventBusyIcon />} 
                                            onClick={handleMarkNoClass} disabled={isCompleted}
                                            sx={{ fontWeight: 700, borderRadius: 2 }}>
                                            No Class
                                        </Button>
                                        <Button variant="contained" color="success" startIcon={<SaveIcon />} 
                                            onClick={handleSubmit} disabled={isCompleted}
                                            sx={{ fontWeight: 700, borderRadius: 2 }}>
                                            Save Attendance
                                        </Button>
                                    </Stack>
                                </Box>

                                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
                                    <TextField
                                        placeholder="Search students..."
                                        size="small"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                    />
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mr: 1 }}>FILTER STATUS:</Typography>
                                        {['All', 'Present', 'Absent', 'Late'].map(status => (
                                            <Chip
                                                key={status}
                                                label={status}
                                                onClick={() => setStatusFilter(status)}
                                                color={statusFilter === status ? "primary" : "default"}
                                                sx={{ fontWeight: 700, borderRadius: 2 }}
                                                variant={statusFilter === status ? "filled" : "outlined"}
                                            />
                                        ))}
                                    </Stack>
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
                                            {filteredRoster.length > 0 ? (
                                                filteredRoster.map((student) => {
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
                                                                    disabled={isCompleted || record.status === 'No Class'}
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
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                        <Typography color="text.secondary" fontWeight={600}>No students found matching your criteria.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}
                    </Grid>
                )}
            </Grid>

            {/* End Semester Confirmation Dialog */}
            <Dialog open={endClassOpen && !endClassReport} onClose={() => setEndClassOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <StopCircleIcon />
                        <span>End Semester</span>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will generate a <strong>final performance report</strong> for all students in <strong>{selectedClass?.name} ({selectedClass?.section})</strong> and notify all enrolled students and administrators.
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}>
                        This action is irreversible. The class will be marked as completed.
                    </Alert>
                    <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mt: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Type "{selectedClass?.section}" to confirm
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={selectedClass?.section}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setEndClassOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleEndClass}
                        disabled={endingClass || confirmText !== selectedClass?.section}
                        sx={{ fontWeight: 700 }}>
                        {endingClass ? 'Generating...' : 'Confirm & End Semester'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Semester Report Dialog */}
            <Dialog open={!!endClassReport} onClose={() => { setEndClassReport(null); setEndClassOpen(false); }} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <SummarizeIcon color="primary" />
                        <Box>
                            <Typography variant="h6" fontWeight={900}>Semester Report</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {endClassReport?.className} — {endClassReport?.sectionCode}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {endClassReport && (
                        <Stack spacing={3}>
                            {/* Summary Stats */}
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                {[
                                    { label: 'Students', value: endClassReport.totalStudents, color: '#2563eb' },
                                    { label: 'Class Average', value: `${endClassReport.classAverage}%`, color: '#059669' },
                                    { label: 'Attendance', value: `${endClassReport.attendanceRate}%`, color: '#7c3aed' },
                                    { label: 'Passing', value: `${endClassReport.passingCount}/${endClassReport.totalStudents}`, color: '#f59e0b' },
                                ].map(s => (
                                    <Card key={s.label} elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', p: 2 }}>
                                        <Typography variant="h5" fontWeight={900} sx={{ color: s.color }}>{s.value}</Typography>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{s.label}</Typography>
                                    </Card>
                                ))}
                            </Stack>

                            <Divider />

                            {/* Student Breakdown */}
                            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                Individual Performance
                            </Typography>
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {Array.isArray(endClassReport.students) && endClassReport.students.map((s, idx) => (
                                    <ListItem key={idx} sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: s.grade >= 75 ? '#dcfce7' : '#fee2e2', color: s.grade >= 75 ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: '0.8rem' }}>
                                                {(s?.name || '').split(' ').map(n => n?.[0] || '').join('').slice(0, 2)}

                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography fontWeight={700}>{s.name}</Typography>}
                                            secondary={`Attendance: ${s.attendanceRate}%`}
                                        />
                                        <Stack alignItems="flex-end">
                                            <Typography variant="h6" fontWeight={900} color={s.grade >= 75 ? '#16a34a' : '#dc2626'}>
                                                {s.grade}%
                                            </Typography>
                                            <Chip
                                                label={s.grade >= 75 ? 'PASSED' : 'FAILED'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800, fontSize: '0.6rem', height: 20,
                                                    bgcolor: s.grade >= 75 ? '#dcfce7' : '#fee2e2',
                                                    color: s.grade >= 75 ? '#16a34a' : '#dc2626'
                                                }}
                                            />
                                        </Stack>
                                    </ListItem>
                                ))}
                            </List>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => { setEndClassReport(null); setEndClassOpen(false); }} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AttendanceManager;
