import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Autocomplete, Checkbox, Snackbar, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText,
    Divider, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment, Card, 
    LinearProgress, Grid, Collapse
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CampaignIcon from '@mui/icons-material/Campaign';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SchoolIcon from '@mui/icons-material/School';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const AdminClasses = () => {
    const [classes, setClasses] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [currentRosterIds, setCurrentRosterIds] = useState([]);
    const [enrollOpen, setEnrollOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [rosterOpen, setRosterOpen] = useState(false);
    const [rosterStudents, setRosterStudents] = useState([]);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Report Dialog
    const [reportOpen, setReportOpen] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [expandedStudentId, setExpandedStudentId] = useState(null);
    const [studentDetails, setStudentDetails] = useState({}); 
    const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);

    // Announce Dialog
    const [announceOpen, setAnnounceOpen] = useState(false);
    const [announceTitle, setAnnounceTitle] = useState('');
    const [announceMessage, setAnnounceMessage] = useState('');
    const [announcing, setAnnouncing] = useState(false);

    const fetchClasses = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/sections', {
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
    }, []);

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
        if (studentDetails[student.id]) return; 

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

    const handleDownloadPDF = () => {
        if (!reportData || !selectedClass) return;
        
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setTextColor(124, 58, 237); // Primary Purple
        doc.text('Semester Report (Admin Oversight)', 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139); // Text Secondary
        doc.text(`Class: ${selectedClass.name} - ${selectedClass.section}`, 14, 30);
        doc.text(`Teacher: ${selectedClass.teacher}`, 14, 38);
        doc.text(`Total Students: ${reportData.totalStudents}`, 14, 46);
        doc.text(`Class Average: ${reportData.classAverageEquiv}`, 14, 54);
        doc.text(`Attendance Rate: ${reportData.attendanceRate}%`, 14, 62);
        
        // Table Data
        const tableBody = (reportData.students || []).map(s => [
            s.name,
            `${s.attendanceRate}%`,
            s.grade,
            s.equivalentGrade,
            s.grade >= 75 ? 'PASSED' : 'FAILED'
        ]);
        
        autoTable(doc, {
            startY: 72,
            head: [['Student Name', 'Attendance', 'Grade (%)', 'Equivalent', 'Status']],
            body: tableBody,
            headStyles: { fillColor: [124, 58, 237] }, // Purple for Admin
        });
        
        doc.save(`${selectedClass.name}_${selectedClass.section}_AdminReport.pdf`);
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
                setSnackbar({ open: true, message: `Announcement sent!`, severity: 'success' });
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

    const filteredClasses = classes.filter(cls => {
        const matchesSearch =
            cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cls.teacher.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && cls.status !== 'completed') ||
            (statusFilter === 'completed' && cls.status === 'completed');
        return matchesSearch && matchesStatus;
    });

    return (
        <Box sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Class Management</Typography>
                    <Typography variant="body1" color="text.secondary">Institutional overview of all academic sections.</Typography>
                </Box>
            </Stack>

            <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'white' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Search by class, section, or teacher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
                            sx: { borderRadius: 3, bgcolor: '#f8fafc' }
                        }}
                        sx={{ minWidth: 350 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 3, fontWeight: 600, bgcolor: '#f8fafc' }}>
                            <MenuItem value="all" sx={{ fontWeight: 600 }}>All Status</MenuItem>
                            <MenuItem value="active" sx={{ fontWeight: 600 }}>Active Only</MenuItem>
                            <MenuItem value="completed" sx={{ fontWeight: 600 }}>Completed Only</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip label={`${filteredClasses.length} Classes Found`} size="small" sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#2563eb' }} />
                </Stack>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Course / Program</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Students</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredClasses.map((cls) => {
                            const isCompleted = cls.status === 'completed';
                            return (
                                <TableRow key={cls.id} hover>
                                    <TableCell><Typography fontWeight={700}>{cls.name}</Typography></TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: '#7c3aed' }}>{cls.teacher[0]}</Avatar>
                                            <Typography variant="body2" fontWeight={600}>{cls.teacher}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell><Chip label={cls.section} size="small" variant="outlined" sx={{ fontWeight: 800, borderRadius: 1 }} /></TableCell>
                                    <TableCell>
                                        <Chip 
                                            icon={isCompleted ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} /> : <RadioButtonCheckedIcon sx={{ fontSize: '14px !important' }} />} 
                                            label={isCompleted ? "Completed" : "Active"} 
                                            size="small"
                                            sx={{ 
                                                fontWeight: 800, 
                                                bgcolor: isCompleted ? '#f1f5f9' : '#dcfce7', 
                                                color: isCompleted ? '#64748b' : '#16a34a',
                                                fontSize: '0.7rem' 
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography fontWeight={800}>{cls.studentCount}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Button size="small" startIcon={<SummarizeIcon />} onClick={() => handleViewReport(cls)} sx={{ fontWeight: 700, color: '#7c3aed' }}>Report</Button>
                                            <Button size="small" startIcon={<CampaignIcon />} onClick={() => { setSelectedClass(cls); setAnnounceOpen(true); }} sx={{ fontWeight: 700 }}>Announce</Button>
                                            <IconButton size="small" onClick={() => handleViewRoster(cls)} title="View Roster"><VisibilityIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Reuse Report Dialog from TeacherClasses */}
            <Dialog open={reportOpen} onClose={() => { setReportOpen(false); setReportData(null); }} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <SummarizeIcon color="primary" />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={900}>Semester Report</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {selectedClass?.name} — {selectedClass?.section}
                            </Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            startIcon={<DownloadIcon />} 
                            onClick={handleDownloadPDF}
                            disabled={!reportData || loadingReport}
                            sx={{ fontWeight: 700, bgcolor: '#7c3aed' }}
                        >
                            Export PDF
                        </Button>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {loadingReport ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary" fontWeight={600}>Loading report...</Typography></Box>
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
                                                    <Avatar sx={{ bgcolor: s.grade >= (reportData.passingGrade || 60) ? '#dcfce7' : '#fee2e2', color: s.grade >= (reportData.passingGrade || 60) ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: '0.8rem' }}>
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
                                                            label={s.grade >= (reportData.passingGrade || 60) ? 'PASSED' : 'FAILED'}
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
                                                                                <TableRow key={sidx} hover>
                                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{score.title}</TableCell>
                                                                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{score.score} / {score.perfectScore}</TableCell>
                                                                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#2563eb' }}>{score.percentage}%</TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
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
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}><Button onClick={() => setReportOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            {/* Roster Dialog */}
            <Dialog open={rosterOpen} onClose={() => setRosterOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Class Roster — {selectedClass?.name}</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <List>
                        {rosterStudents.map((student) => (
                            <ListItem key={student.id}>
                                <ListItemAvatar><Avatar>{student.name[0]}</Avatar></ListItemAvatar>
                                <ListItemText primary={student.name} secondary={student.email} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions><Button onClick={() => setRosterOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%', fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminClasses;
