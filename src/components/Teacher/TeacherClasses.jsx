import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Autocomplete, Checkbox, Snackbar, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText,
    Divider, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment, Card, CardContent
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CampaignIcon from '@mui/icons-material/Campaign';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const TeacherClasses = () => {
    const teacher = (() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) { return null; }
    })();
    const [classes, setClasses] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [currentRosterIds, setCurrentRosterIds] = useState([]);
    const [enrollOpen, setEnrollOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [newClass, setNewClass] = useState({ name: '', section: '', description: '', schedule: 'TBA' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [rosterOpen, setRosterOpen] = useState(false);
    const [rosterStudents, setRosterStudents] = useState([]);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [scheduleFilter, setScheduleFilter] = useState('all');

    // Report Dialog
    const [reportOpen, setReportOpen] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // Announce Dialog
    const [announceOpen, setAnnounceOpen] = useState(false);
    const [announceTitle, setAnnounceTitle] = useState('');
    const [announceMessage, setAnnounceMessage] = useState('');
    const [announcing, setAnnouncing] = useState(false);

    const fetchClasses = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/teacher/${teacher.id}/classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setClasses(Array.isArray(data) ? data : []);
        }

    };

    useEffect(() => {
        fetchClasses();
        const fetchStudents = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
            const data = await res.json();
            setAllStudents(Array.isArray(data.students) ? data.students : []);
        }

        };
        fetchStudents();
    }, [teacher.id]);

    const handleOpenEnroll = async (cls) => {
        const token = localStorage.getItem('token');
        setSelectedClass(cls);
        const res = await fetch(`/api/class/${cls.id}/roster`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setCurrentRosterIds((data.students || []).map(s => s.id));
            setEnrollOpen(true);
        }

    };

    const handleEnroll = async () => {
        const token = localStorage.getItem('token');
        await fetch('/api/enroll-students', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sectionId: selectedClass.id, studentIds: selectedStudents.map(s => s.id) })
        });
        setEnrollOpen(false);
        setSelectedStudents([]);
        setSnackbar({ open: true, message: `${selectedStudents.length} student(s) enrolled.`, severity: 'success' });
        fetchClasses();
    };

    const handleCreateClass = async () => {
        if (!newClass.name.trim() || !newClass.section.trim()) {
            setSnackbar({ open: true, message: 'Please fill in all fields.', severity: 'error' });
            return;
        }
        const token = localStorage.getItem('token');
        const res = await fetch('/api/create-class', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...newClass, teacherId: teacher.id })
        });
        if (res.ok) {
            setCreateOpen(false);
            setNewClass({ name: '', section: '', description: '', schedule: 'TBA' });
            setSnackbar({ open: true, message: 'Class created successfully!', severity: 'success' });
            fetchClasses();
        }
    };

    const handleViewRoster = async (cls) => {
        setSelectedClass(cls);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/class/${cls.id}/roster`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRosterStudents(data.students || []);
                setRosterOpen(true);
            }



        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to load roster.', severity: 'error' });
        }
    };

    const handleViewReport = async (cls) => {
        const token = localStorage.getItem('token');
        setSelectedClass(cls);
        setLoadingReport(true);
        setReportOpen(true);
        try {
            const res = await fetch(`/api/class/${cls.id}/report`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to load report.', severity: 'error' });
            setReportOpen(false);
        } finally {
            setLoadingReport(false);
        }
    };

    const availableStudents = allStudents.filter(s => !currentRosterIds.includes(s.id));

    const handleAnnounce = async () => {
        if (!announceTitle.trim() || !announceMessage.trim()) {
            setSnackbar({ open: true, message: 'Title and message are required.', severity: 'error' });
            return;
        }
        const token = localStorage.getItem('token');
        setAnnouncing(true);
        try {
            const res = await fetch('/api/class-announcement', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sectionId: selectedClass.id,
                    title: announceTitle,
                    message: announceMessage
                })
            });
            if (res.ok) {
                setAnnounceOpen(false);
                setAnnounceTitle('');
                setAnnounceMessage('');
                setSnackbar({ open: true, message: `Announcement sent to ${selectedClass.section}!`, severity: 'success' });
            } else {
                const data = await res.json();
                setSnackbar({ open: true, message: data.error || 'Failed to send.', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Network error.', severity: 'error' });
        } finally {
            setAnnouncing(false);
        }
    };

    // Filtering logic
    const filteredClasses = classes.filter(cls => {
        const matchesSearch =
            cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cls.section.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && cls.status !== 'completed') ||
            (statusFilter === 'completed' && cls.status === 'completed');
        const matchesSchedule =
            scheduleFilter === 'all' || cls.schedule === scheduleFilter;
        return matchesSearch && matchesStatus && matchesSchedule;
    });

    const activeCount = classes.filter(c => c.status !== 'completed').length;
    const completedCount = classes.filter(c => c.status === 'completed').length;

    return (
        <Box sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>My Classes</Typography>
                    <Typography variant="body1" color="text.secondary">Manage your classroom sections and rosters.</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
                    sx={{ bgcolor: '#2563EB', fontWeight: 700, borderRadius: 2 }}>
                    New Class
                </Button>
            </Stack>

            {/* Search & Filters Bar */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'white' }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                    <TextField
                        size="small"
                        placeholder="Search by name or section..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
                            sx: { borderRadius: 3, bgcolor: '#f8fafc' }
                        }}
                        sx={{ minWidth: 260 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 3, fontWeight: 600, bgcolor: '#f8fafc' }}>
                            <MenuItem value="all" sx={{ fontWeight: 600 }}>All Status</MenuItem>
                            <MenuItem value="active" sx={{ fontWeight: 600 }}>Active</MenuItem>
                            <MenuItem value="completed" sx={{ fontWeight: 600 }}>Completed</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)} sx={{ borderRadius: 3, fontWeight: 600, bgcolor: '#f8fafc' }}>
                            <MenuItem value="all" sx={{ fontWeight: 600 }}>All Schedules</MenuItem>
                            <MenuItem value="MWF" sx={{ fontWeight: 600 }}>MWF</MenuItem>
                            <MenuItem value="TTH" sx={{ fontWeight: 600 }}>TTH</MenuItem>
                            <MenuItem value="Sat" sx={{ fontWeight: 600 }}>Saturday</MenuItem>
                            <MenuItem value="Daily" sx={{ fontWeight: 600 }}>Daily</MenuItem>
                            <MenuItem value="TBA" sx={{ fontWeight: 600 }}>TBA</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }} />
                    <Stack direction="row" spacing={1}>
                        <Chip label={`${activeCount} Active`} size="small" icon={<RadioButtonCheckedIcon sx={{ fontSize: '14px !important' }} />} sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#16a34a' }} />
                        <Chip label={`${completedCount} Completed`} size="small" icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#64748b' }} />
                        <Chip label={`${filteredClasses.length} Shown`} size="small" sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#2563eb' }} />
                    </Stack>
                </Stack>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Course Program</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Section Code</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Schedule</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Enrolled</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredClasses.map((cls) => {
                            const isCompleted = cls.status === 'completed';
                            return (
                                <TableRow key={cls.id} hover sx={{ opacity: isCompleted ? 0.75 : 1 }}>
                                    <TableCell><Typography fontWeight={700} color={isCompleted ? 'text.secondary' : 'primary'}>{cls.name}</Typography></TableCell>
                                    <TableCell><Chip label={cls.section} size="small" variant="outlined" sx={{ fontWeight: 800, borderRadius: 1 }} /></TableCell>
                                    <TableCell>
                                        <Chip label={cls.schedule} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }} />
                                    </TableCell>
                                    <TableCell>
                                        {isCompleted ? (
                                            <Chip icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />} label="Completed" size="small"
                                                sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#64748b', fontSize: '0.7rem' }} />
                                        ) : (
                                            <Chip icon={<RadioButtonCheckedIcon sx={{ fontSize: '14px !important' }} />} label="Active" size="small"
                                                sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#16a34a', fontSize: '0.7rem' }} />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                            <PeopleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            <Typography fontWeight={800}>{cls.studentCount}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            {isCompleted ? (
                                                <Button size="small" variant="outlined" startIcon={<SummarizeIcon />}
                                                    onClick={() => handleViewReport(cls)}
                                                    sx={{ fontWeight: 700, borderColor: '#7c3aed', color: '#7c3aed' }}>
                                                    Report
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button size="small" startIcon={<CampaignIcon />}
                                                        onClick={() => { setSelectedClass(cls); setAnnounceTitle(''); setAnnounceMessage(''); setAnnounceOpen(true); }}
                                                        sx={{ fontWeight: 700, color: '#7c3aed' }}>
                                                        Announce
                                                    </Button>
                                                    <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenEnroll(cls)} sx={{ fontWeight: 700 }}>
                                                        Add Students
                                                    </Button>
                                                </>
                                            )}
                                            <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleViewRoster(cls)} sx={{ fontWeight: 700 }}>Roster</Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredClasses.length === 0 && (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                <Typography color="text.secondary">No classes match your filters.</Typography>
                            </TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Class Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Create New Class</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Course / Program Name" fullWidth placeholder="e.g. Graphics and Computing Visual"
                            value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} />
                        <TextField label="Section / Offer Code" fullWidth placeholder="e.g. 11073"
                            value={newClass.section} onChange={(e) => setNewClass({ ...newClass, section: e.target.value })} />
                        <FormControl fullWidth>
                            <InputLabel>Weekday Schedule</InputLabel>
                            <Select value={newClass.schedule} label="Weekday Schedule" onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}>
                                <MenuItem value="MWF">MWF (Mon, Wed, Fri)</MenuItem>
                                <MenuItem value="TTH">TTH (Tue, Thu)</MenuItem>
                                <MenuItem value="Sat">Saturday</MenuItem>
                                <MenuItem value="Daily">Daily</MenuItem>
                                <MenuItem value="TBA">To Be Announced</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="Description (optional)" fullWidth multiline rows={2} placeholder="e.g. Covers image segmentation, noise filtering, and edge detection"
                            value={newClass.description} onChange={(e) => setNewClass({ ...newClass, description: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCreateOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateClass} sx={{ bgcolor: '#2563EB', fontWeight: 700 }}>Create Class</Button>
                </DialogActions>
            </Dialog>

            {/* Enroll Students Dialog */}
            <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Enroll Students into {selectedClass?.name}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Autocomplete multiple options={availableStudents} disableCloseOnSelect
                            getOptionLabel={(option) => `${option.name} (${option.email})`}
                            value={selectedStudents} onChange={(event, newValue) => setSelectedStudents(newValue)}
                            renderOption={(props, option, { selected }) => (
                                <li {...props}>
                                    <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                                    <Box>
                                        <Typography variant="body1" fontWeight={600}>{option.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                                    </Box>
                                </li>
                            )}
                            renderInput={(params) => <TextField {...params} label="Search Students" placeholder="Start typing..." />}
                            noOptionsText="No available students found."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEnrollOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" disabled={selectedStudents.length === 0} onClick={handleEnroll} sx={{ bgcolor: '#2563EB', fontWeight: 700 }}>
                        Enroll {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Roster Dialog */}
            <Dialog open={rosterOpen} onClose={() => setRosterOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Class Roster — {selectedClass?.name}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Section {selectedClass?.section} · {rosterStudents.length} student{rosterStudents.length !== 1 ? 's' : ''} enrolled
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {rosterStudents.length > 0 ? (
                        <List sx={{ py: 0 }}>
                            {rosterStudents.map((student, idx) => (
                                <React.Fragment key={student.id}>
                                    <ListItem sx={{ px: 3, py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: '#2563EB15', color: '#2563EB', fontWeight: 800, fontSize: '0.85rem' }}>
                                                {(student?.name || '').split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2)}

                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography fontWeight={700}>{student.name}</Typography>}
                                            secondary={
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <EmailIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                                    <Typography variant="caption" color="text.secondary">{student.email}</Typography>
                                                </Stack>
                                            }
                                        />
                                        <Chip label={student.status || 'active'} size="small" sx={{
                                            fontWeight: 700, textTransform: 'capitalize',
                                            bgcolor: student.status === 'inactive' ? '#fee2e2' : '#ecfdf5',
                                            color: student.status === 'inactive' ? '#991b1b' : '#059669'
                                        }} />
                                    </ListItem>
                                    {idx < rosterStudents.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary" fontWeight={600}>No students enrolled yet.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setRosterOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
                    {selectedClass?.status !== 'completed' && (
                        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => { setRosterOpen(false); handleOpenEnroll(selectedClass); }}
                            sx={{ bgcolor: '#2563EB', fontWeight: 700 }}>
                            Add More Students
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Semester Report Dialog */}
            <Dialog open={reportOpen} onClose={() => { setReportOpen(false); setReportData(null); }} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <SummarizeIcon color="primary" />
                        <Box>
                            <Typography variant="h6" fontWeight={900}>Semester Report</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {selectedClass?.name} — {selectedClass?.section}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {loadingReport ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary" fontWeight={600}>Loading report...</Typography>
                        </Box>
                    ) : reportData ? (
                        <Stack spacing={3}>
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                {[
                                    { label: 'Students', value: reportData.totalStudents, color: '#2563eb' },
                                    { label: 'Class Average', value: `${reportData.classAverage}%`, color: '#059669' },
                                    { label: 'Attendance', value: `${reportData.attendanceRate}%`, color: '#7c3aed' },
                                    { label: 'Passing', value: `${reportData.passingCount}/${reportData.totalStudents}`, color: '#f59e0b' },
                                ].map(s => (
                                    <Card key={s.label} elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', p: 2 }}>
                                        <Typography variant="h5" fontWeight={900} sx={{ color: s.color }}>{s.value}</Typography>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{s.label}</Typography>
                                    </Card>
                                ))}
                            </Stack>
                            <Divider />
                            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                Individual Performance
                            </Typography>
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {(reportData.students || []).map((s, idx) => (
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
                    ) : (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary" fontWeight={600}>No report data available.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => { setReportOpen(false); setReportData(null); }} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Announce to Class Dialog */}
            <Dialog open={announceOpen} onClose={() => setAnnounceOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CampaignIcon sx={{ color: '#7c3aed' }} />
                    Announce to {selectedClass?.section}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        This will send a notification to all <strong>{selectedClass?.studentCount}</strong> student{selectedClass?.studentCount !== 1 ? 's' : ''} enrolled in <strong>{selectedClass?.name}</strong>.
                    </Typography>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Announcement Title"
                            fullWidth
                            placeholder="e.g. Midterm Exam Reminder"
                            value={announceTitle}
                            onChange={(e) => setAnnounceTitle(e.target.value)}
                        />
                        <TextField
                            label="Message"
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="e.g. Please review chapters 3-5 before the exam on Friday..."
                            value={announceMessage}
                            onChange={(e) => setAnnounceMessage(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setAnnounceOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAnnounce}
                        disabled={announcing || !announceTitle.trim() || !announceMessage.trim()}
                        startIcon={<CampaignIcon />}
                        sx={{ fontWeight: 700, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                    >
                        {announcing ? 'Sending...' : 'Send Announcement'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default TeacherClasses;
