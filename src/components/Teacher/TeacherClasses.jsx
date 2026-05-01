import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Autocomplete, Checkbox, Snackbar, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText,
    Divider, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment, Card, CardContent,
    Drawer, ListSubheader, LinearProgress, Grid, Collapse,
    FormControlLabel, FormGroup
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

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
    const [newClass, setNewClass] = useState({ 
        name: '', section: '', description: '', schedule: 'TBA',
        assessmentCategories: ['Written Works', 'Performance Tasks', 'Major Exams'],
        weights: {
            'Written Works': 30,
            'Performance Tasks': 30,
            'Major Exams': 40
        },
        passingGrade: 75,
        days: [],
        time: ''
    });
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
    const [expandedStudentId, setExpandedStudentId] = useState(null);
    const [studentDetails, setStudentDetails] = useState({}); // Cache for student details
    const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);

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
            const res = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAllStudents(Array.isArray(data) ? data : []);
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
        const totalWeight = Object.values(newClass.weights).reduce((a, b) => a + b, 0);
        if (totalWeight !== 100) {
            setSnackbar({ open: true, message: `Total weight must be 100% (currently ${totalWeight}%).`, severity: 'error' });
            return;
        }

        console.log("Creating class with data:", newClass);

        const token = localStorage.getItem('token');
        
        // Convert weights to decimal (e.g. 30 -> 0.3)
        const decimalWeights = {};
        Object.entries(newClass.weights).forEach(([k, v]) => {
            decimalWeights[k] = v / 100;
        });

        const res = await fetch('/api/create-class', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                ...newClass, 
                schedule: newClass.days.length > 0 
                    ? `${newClass.days.join(', ')} ${newClass.time ? `(${newClass.time})` : ''}` 
                    : 'TBA',
                weights: decimalWeights,
                teacherId: teacher.id 
            })
        });

        if (res.ok) {
            setCreateOpen(false);
            setNewClass({ 
                name: '', section: '', description: '', schedule: 'TBA',
                assessmentCategories: ['Written Works', 'Performance Tasks', 'Major Exams'],
                weights: {
                    'Written Works': 30,
                    'Performance Tasks': 30,
                    'Major Exams': 40
                },
                passingGrade: 75,
                days: [],
                time: ''
            });
            setSnackbar({ open: true, message: 'Class created successfully!', severity: 'success' });
            fetchClasses();
        } else {
            const errorData = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setSnackbar({ open: true, message: 'Session expired. Please log in again.', severity: 'error' });
            } else {
                setSnackbar({ open: true, message: errorData.error || 'Failed to create class.', severity: 'error' });
            }
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

    const handleToggleExpand = async (student) => {
        if (expandedStudentId === student.id) {
            setExpandedStudentId(null);
            return;
        }

        setExpandedStudentId(student.id);
        if (studentDetails[student.id]) return; // Already have data

        setLoadingStudentDetail(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/class/${selectedClass.id}/student/${student.id}/report`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudentDetails(prev => ({ ...prev, [student.id]: data }));
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to load student detail.', severity: 'error' });
        } finally {
            setLoadingStudentDetail(false);
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
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                                Class Days
                            </Typography>
                            <FormGroup row>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <FormControlLabel
                                        key={day}
                                        control={
                                            <Checkbox 
                                                checked={newClass.days.includes(day)}
                                                onChange={(e) => {
                                                    const updatedDays = e.target.checked 
                                                        ? [...newClass.days, day]
                                                        : newClass.days.filter(d => d !== day);
                                                    setNewClass({ ...newClass, days: updatedDays });
                                                }}
                                            />
                                        }
                                        label={<Typography variant="body2">{day}</Typography>}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                        <TextField 
                            fullWidth 
                            label="Class Time" 
                            placeholder="e.g. 9:00 AM - 10:30 AM" 
                            value={newClass.time} 
                            onChange={(e) => setNewClass({ ...newClass, time: e.target.value })} 
                        />
                        <TextField fullWidth type="number" label="Passing Grade (%)" value={newClass.passingGrade} onChange={(e) => setNewClass({ ...newClass, passingGrade: e.target.value })} 
                            helperText="Define the threshold for a passing mark (e.g. 60 or 75)" />
                        
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                                1. Select Categories to Include
                            </Typography>
                            <FormGroup row>
                                {[
                                    { id: 'Written Works', label: 'Written Works' },
                                    { id: 'Performance Tasks', label: 'Performance Tasks' },
                                    { id: 'Major Exams', label: 'Major Examinations' },
                                    { id: 'Projects', label: 'Projects & Portfolio' },
                                    { id: 'Other', label: 'Other Assessments' }
                                ].map(cat => (
                                    <FormControlLabel
                                        key={cat.id}
                                        control={
                                            <Checkbox 
                                                checked={newClass.assessmentCategories.includes(cat.id)}
                                                onChange={(e) => {
                                                    const updatedCategories = e.target.checked 
                                                        ? [...newClass.assessmentCategories, cat.id]
                                                        : newClass.assessmentCategories.filter(id => id !== cat.id);
                                                    
                                                    // Update weights: assign 0 to new, remove old
                                                    const updatedWeights = { ...newClass.weights };
                                                    if (e.target.checked) updatedWeights[cat.id] = 0;
                                                    else delete updatedWeights[cat.id];

                                                    setNewClass({ 
                                                        ...newClass, 
                                                        assessmentCategories: updatedCategories,
                                                        weights: updatedWeights
                                                    });
                                                }}
                                            />
                                        }
                                        label={<Typography variant="body2">{cat.label}</Typography>}
                                    />
                                ))}
                            </FormGroup>
                        </Box>

                        {newClass.assessmentCategories.length > 0 && (
                            <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                                    2. Set Category Weights
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Assign a percentage to each category. The total must be exactly 100%.
                                </Typography>
                                <Grid container spacing={2} alignItems="center">
                                    {newClass.assessmentCategories.map(catId => (
                                        <Grid item xs={6} key={catId}>
                                            <TextField
                                                label={catId}
                                                type="number"
                                                size="small"
                                                fullWidth
                                                value={newClass.weights[catId] || ''}
                                                onChange={(e) => {
                                                    setNewClass({
                                                        ...newClass,
                                                        weights: { ...newClass.weights, [catId]: parseInt(e.target.value) || 0 }
                                                    });
                                                }}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight={700} color={
                                        Object.values(newClass.weights).reduce((a, b) => a + b, 0) === 100 ? 'success.main' : 'error.main'
                                    }>
                                        Total Weight: {Object.values(newClass.weights).reduce((a, b) => a + b, 0)}%
                                    </Typography>
                                    {Object.values(newClass.weights).reduce((a, b) => a + b, 0) !== 100 && (
                                        <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                                            {Object.values(newClass.weights).reduce((a, b) => a + b, 0) < 100 
                                                ? `Missing ${100 - Object.values(newClass.weights).reduce((a, b) => a + b, 0)}%` 
                                                : `Exceeds by ${Object.values(newClass.weights).reduce((a, b) => a + b, 0) - 100}%`}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )}
                        <TextField label="Description (optional)" fullWidth multiline rows={2} placeholder="e.g. Covers image segmentation, noise filtering, and edge detection"
                            value={newClass.description} onChange={(e) => setNewClass({ ...newClass, description: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCreateOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCreateClass} 
                        disabled={
                            !newClass.name.trim() || 
                            !newClass.section.trim() || 
                            Object.values(newClass.weights).reduce((a, b) => a + b, 0) !== 100
                        }
                        sx={{ 
                            bgcolor: '#2563EB', 
                            fontWeight: 700,
                            '&:disabled': {
                                bgcolor: '#e2e8f0',
                                color: '#94a3b8'
                            }
                        }}
                    >
                        Create Class
                    </Button>
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
                                    { label: 'Class Average', value: reportData.classAverageEquiv, color: '#059669' },
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
                            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                                {(reportData.students || []).map((s, idx) => {
                                    const isExpanded = expandedStudentId === s.id;
                                    const details = studentDetails[s.id];

                                    return (
                                        <React.Fragment key={s.id || idx}>
                                            <ListItem button onClick={() => handleToggleExpand(s)}
                                                sx={{ 
                                                    borderBottom: '1px solid', borderColor: 'divider', py: 1.5,
                                                    bgcolor: isExpanded ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                                                    '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.08)' },
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: s.grade >= 75 ? '#dcfce7' : '#fee2e2', color: s.grade >= 75 ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: '0.8rem' }}>
                                                        {(s?.name || '').split(' ').map(n => n?.[0] || '').join('').slice(0, 2)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={<Typography fontWeight={700}>{s.name}</Typography>}
                                                    secondary={`Attendance: ${s.attendanceRate}%`}
                                                />
                                                <Stack direction="row" spacing={3} alignItems="center">
                                                    <Stack alignItems="flex-end">
                                                        <Typography variant="h6" fontWeight={900} color={s.grade >= 75 ? '#16a34a' : '#dc2626'}>
                                                            {s.equivalentGrade}
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
                                                    {isExpanded ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
                                                </Stack>
                                            </ListItem>

                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                    {loadingStudentDetail && !details ? (
                                                        <Box sx={{ py: 2, textAlign: 'center' }}>
                                                            <Typography variant="body2" fontWeight={700} color="text.secondary">Fetching details...</Typography>
                                                            <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
                                                        </Box>
                                                    ) : details ? (
                                                        <Stack spacing={3}>
                                                            {/* Detailed Breakdown */}
                                                            <Grid container spacing={2}>
                                                                {Object.entries(details.performance.categoryBreakdown).map(([cat, data]) => (
                                                                    <Grid item xs={12} sm={4} key={cat}>
                                                                        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
                                                                            <Typography variant="caption" fontWeight={800} color="text.secondary">{cat.toUpperCase()}</Typography>
                                                                            <Typography variant="h5" fontWeight={900} color="primary">{data.equivalentGrade}</Typography>
                                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Avg: {data.average}% · Weight: {data.weight}%</Typography>
                                                                        </Paper>
                                                                    </Grid>
                                                                ))}
                                                            </Grid>

                                                            {/* Assessment List */}
                                                            <Box>
                                                                <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>ASSESSMENT BREAKDOWN</Typography>
                                                                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
                                                                    <Table size="small">
                                                                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>TITLE</TableCell>
                                                                                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }} align="center">SCORE</TableCell>
                                                                                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }} align="right">PERCENT</TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {Object.values(details.performance.categoryBreakdown).flatMap(cat => cat.scores).map((score, sidx) => (
                                                                                <TableRow key={sidx}>
                                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{score.title}</TableCell>
                                                                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{score.score}/{score.perfectScore}</TableCell>
                                                                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'primary.main' }}>{score.percentage}%</TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </Paper>
                                                            </Box>

                                                            {/* Attendance Log */}
                                                            <Box>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                                    <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ letterSpacing: 1 }}>ATTENDANCE HISTORY</Typography>
                                                                    <Stack direction="row" spacing={1.5}>
                                                                        <Typography variant="caption" fontWeight={800} color="#16a34a">P: {details.attendance.counts.present}</Typography>
                                                                        <Typography variant="caption" fontWeight={800} color="#dc2626">A: {details.attendance.counts.absent}</Typography>
                                                                        <Typography variant="caption" fontWeight={800} color="#d97706">L: {details.attendance.counts.late}</Typography>
                                                                    </Stack>
                                                                </Stack>
                                                                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
                                                                    <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                                                                        <Table size="small" stickyHeader>
                                                                            <TableHead>
                                                                                <TableRow>
                                                                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#f8fafc' }}>DATE</TableCell>
                                                                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#f8fafc' }}>STATUS</TableCell>
                                                                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#f8fafc' }}>REMARKS</TableCell>
                                                                                </TableRow>
                                                                            </TableHead>
                                                                            <TableBody>
                                                                                {details.attendance.records.map((r, ridx) => (
                                                                                    <TableRow key={ridx} hover>
                                                                                        <TableCell sx={{ fontSize: '0.75rem', py: 1, fontWeight: 600 }}>
                                                                                            {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                                        </TableCell>
                                                                                        <TableCell sx={{ py: 1 }}>
                                                                                            <Chip label={r.status} size="small" sx={{ 
                                                                                                fontWeight: 800, fontSize: '0.6rem', height: 18,
                                                                                                bgcolor: r.status === 'Present' ? '#dcfce7' : r.status === 'Absent' ? '#fee2e2' : '#fef3c7',
                                                                                                color: r.status === 'Present' ? '#16a34a' : r.status === 'Absent' ? '#dc2626' : '#d97706'
                                                                                            }} />
                                                                                        </TableCell>
                                                                                        <TableCell sx={{ fontSize: '0.7rem', color: 'text.secondary', py: 1, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                            {r.remarks || '—'}
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </Box>
                                                                </Paper>
                                                            </Box>
                                                        </Stack>
                                                    ) : null}
                                                </Box>
                                            </Collapse>
                                        </React.Fragment>
                                    );
                                })}
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
