import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Autocomplete, Checkbox, Snackbar, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText,
    Divider, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment, Card, 
    LinearProgress, Grid, Collapse, Menu
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
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
    const [exportAnchorEl, setExportAnchorEl] = useState(null);

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
        
        const doc = new jsPDF('landscape');
        
        // Brand Header (Purple for Admin)
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, 297, 30, 'F');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('EDUTRACK ADMIN OVERSIGHT REPORT', 14, 18);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Class: ${selectedClass.name} — ${selectedClass.section}  |  Teacher: ${selectedClass.teacher}`, 14, 25);
        
        // 1. Attendance Matrix
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('I. ATTENDANCE MATRIX', 14, 40);
        
        const attDates = reportData.attendanceDates || [];
        const attBody = (reportData.students || []).map(s => [
            s.name,
            ...attDates.map(d => (reportData.attendanceMatrix?.[s.id]?.[d] || '-').charAt(0))
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Student Name', ...attDates.map(d => d.split('-').slice(1).join('/'))]],
            body: attBody,
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237], fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
            columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
            margin: { left: 14, right: 14 }
        });

        // 2. Grades Matrix
        const nextY = doc.lastAutoTable.finalY + 15;
        if (nextY > 180) doc.addPage();
        
        doc.setFontSize(14);
        doc.text('II. ASSESSMENT SCORES', 14, doc.lastAutoTable.finalY + 15);
        
        const assesses = reportData.assessments || [];
        const scoreBody = (reportData.students || []).map(s => [
            s.name,
            ...assesses.map(a => reportData.scoresMatrix?.[s.id]?.[a.id] ?? '-')
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Student Name', ...assesses.map(a => `${a.title} (${a.perfectScore})`)]],
            body: scoreBody,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
            columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
            margin: { left: 14, right: 14 }
        });

        // 3. Final Summary
        doc.addPage();
        doc.setFontSize(14);
        doc.text('III. FINAL SUMMARY & GWA', 14, 20);

        const summaryBody = (reportData.students || []).map(s => [
            s.name,
            `${s.attendanceRate}%`,
            `${s.grade}%`,
            s.equivalentGrade,
            s.grade >= (reportData.passingGrade || 60) ? 'PASSED' : 'FAILED'
        ]);

        autoTable(doc, {
            startY: 25,
            head: [['Student Name', 'Attendance', 'Grade (%)', 'Equivalent', 'Status']],
            body: summaryBody,
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237] },
            styles: { halign: 'center' },
            columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    data.cell.styles.textColor = data.cell.raw === 'PASSED' ? [22, 163, 74] : [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Generated by EduTrack © ${new Date().getFullYear()} — Admin Oversight Copy`, 14, 200);
            doc.text(`Page ${i} of ${pageCount}`, 280, 200, { align: 'right' });
        }
        
        doc.save(`${selectedClass.name}_Admin_Full_Report.pdf`);
    };

    const handleDownloadCSV = () => {
        if (!reportData || !selectedClass) return;
        
        let csvRows = [];
        
        // 1. Attendance Table
        csvRows.push(['I. ATTENDANCE REPORT']);
        const attDates = reportData.attendanceDates || [];
        csvRows.push(['Student Name', ...attDates]);
        (reportData.students || []).forEach(s => {
            const row = [s.name];
            attDates.forEach(d => {
                const status = reportData.attendanceMatrix?.[s.id]?.[d] || '-';
                row.push(status.charAt(0) || '-');
            });
            csvRows.push(row);
        });
        csvRows.push([]); 
        
        // 2. Grades Table
        csvRows.push(['II. ASSESSMENT SCORES']);
        const assesses = reportData.assessments || [];
        csvRows.push(['Student Name', ...assesses.map(a => `${a.title} (${a.perfectScore})`)]);
        (reportData.students || []).forEach(s => {
            const row = [s.name];
            assesses.forEach(a => {
                const score = reportData.scoresMatrix?.[s.id]?.[a.id];
                row.push(score ?? '-');
            });
            csvRows.push(row);
        });
        csvRows.push([]);

        // 3. Summary Table
        csvRows.push(['III. FINAL SUMMARY']);
        csvRows.push(['Student Name', 'Attendance %', 'Final Grade %', 'Equivalent', 'Status']);
        (reportData.students || []).forEach(s => {
            csvRows.push([
                s.name,
                `${s.attendanceRate}%`,
                `${s.grade}%`,
                s.equivalentGrade,
                s.grade >= (reportData.passingGrade || 60) ? 'PASSED' : 'FAILED'
            ]);
        });

        const csvContent = csvRows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedClass.name}_Admin_Full_Report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            {/* Semester Report Dialog */}
            <Dialog open={reportOpen} onClose={() => { setReportOpen(false); setReportData(null); }} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <SummarizeIcon sx={{ color: '#7c3aed' }} />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={900}>Semester Report</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {selectedClass?.name} — {selectedClass?.section}
                            </Typography>
                        </Box>
                        <Box>
                            <Button 
                                variant="contained" 
                                startIcon={<DownloadIcon />} 
                                endIcon={<KeyboardArrowDownIcon />}
                                onClick={(e) => setExportAnchorEl(e.currentTarget)}
                                disabled={!reportData || loadingReport}
                                sx={{ fontWeight: 700, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                            >
                                Export Report
                            </Button>
                            <Menu
                                anchorEl={exportAnchorEl}
                                open={Boolean(exportAnchorEl)}
                                onClose={() => setExportAnchorEl(null)}
                                PaperProps={{ sx: { borderRadius: 2, minWidth: 150, mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
                            >
                                <MenuItem onClick={() => { handleDownloadPDF(); setExportAnchorEl(null); }} sx={{ fontWeight: 600 }}>Export as PDF</MenuItem>
                                <MenuItem onClick={() => { handleDownloadCSV(); setExportAnchorEl(null); }} sx={{ fontWeight: 600 }}>Export as CSV</MenuItem>
                            </Menu>
                        </Box>
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
                                                    bgcolor: isExpanded ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
                                                    '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.08)' },
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
                                                        <Typography variant="h6" fontWeight={900} color={s.grade >= (reportData.passingGrade || 60) ? '#16a34a' : '#dc2626'}>
                                                            {s.equivalentGrade}
                                                        </Typography>
                                                        <Chip
                                                            label={s.grade >= (reportData.passingGrade || 60) ? 'PASSED' : 'FAILED'}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800, fontSize: '0.6rem', height: 20,
                                                                bgcolor: s.grade >= (reportData.passingGrade || 60) ? '#dcfce7' : '#fee2e2',
                                                                color: s.grade >= (reportData.passingGrade || 60) ? '#16a34a' : '#dc2626'
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
                                                            <LinearProgress sx={{ mt: 1, borderRadius: 1, bgcolor: '#ede9fe', '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }} />
                                                        </Box>
                                                    ) : details ? (
                                                        <Stack spacing={3}>
                                                            <Grid container spacing={2}>
                                                                {Object.entries(details.performance.categoryBreakdown).map(([cat, data]) => (
                                                                    <Grid item xs={12} sm={4} key={cat}>
                                                                        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
                                                                            <Typography variant="caption" fontWeight={800} color="text.secondary">{cat.toUpperCase()}</Typography>
                                                                            <Typography variant="h5" fontWeight={900} color="#7c3aed">{data.equivalentGrade}</Typography>
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
                                                                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#7c3aed' }}>{score.percentage}%</TableCell>
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
                                                                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                                                        <Table size="small" stickyHeader>
                                                                            <TableHead>
                                                                                <TableRow>
                                                                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#f1f5f9' }}>DATE</TableCell>
                                                                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#f1f5f9' }}>STATUS</TableCell>
                                                                                </TableRow>
                                                                            </TableHead>
                                                                            <TableBody>
                                                                                {details.attendance.records.map((r, ridx) => (
                                                                                    <TableRow key={ridx} hover>
                                                                                        <TableCell sx={{ fontSize: '0.75rem', py: 1, fontWeight: 600 }}>{r.date}</TableCell>
                                                                                        <TableCell sx={{ py: 1 }}>
                                                                                            <Chip label={r.status} size="small" sx={{ 
                                                                                                fontWeight: 800, fontSize: '0.6rem', height: 18,
                                                                                                bgcolor: r.status === 'Present' ? '#dcfce7' : r.status === 'Absent' ? '#fee2e2' : '#fef3c7',
                                                                                                color: r.status === 'Present' ? '#16a34a' : r.status === 'Absent' ? '#dc2626' : '#d97706'
                                                                                            }} />
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
                        <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary" fontWeight={600}>No report data available.</Typography></Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => { setReportOpen(false); setReportData(null); }} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Enroll Students Dialog */}
            <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Enroll Students — {selectedClass?.name}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select students to enroll in this section. Students already enrolled are hidden.
                    </Typography>
                    <Autocomplete
                        multiple
                        options={availableStudents}
                        disableCloseOnSelect
                        getOptionLabel={(option) => option.name}
                        value={selectedStudents}
                        onChange={(_, newValue) => setSelectedStudents(newValue)}
                        renderOption={(props, option, { selected }) => (
                            <li {...props}>
                                <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                                {option.name} ({option.email})
                            </li>
                        )}
                        renderInput={(params) => <TextField {...params} label="Select Students" placeholder="Search students..." />}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEnrollOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleEnroll} disabled={selectedStudents.length === 0} sx={{ fontWeight: 700, bgcolor: '#7c3aed' }}>
                        Enroll Selected
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Announce Dialog */}
            <Dialog open={announceOpen} onClose={() => setAnnounceOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CampaignIcon sx={{ color: '#7c3aed' }} />
                    Announce to Class
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Title" fullWidth value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} />
                        <TextField label="Message" fullWidth multiline rows={4} value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAnnounceOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAnnounce} disabled={announcing || !announceTitle.trim()} sx={{ fontWeight: 700, bgcolor: '#7c3aed' }}>
                        {announcing ? 'Sending...' : 'Send Announcement'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Roster Dialog */}
            <Dialog open={rosterOpen} onClose={() => setRosterOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Class Roster — {selectedClass?.name}</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <List>
                        {rosterStudents.map((student) => (
                            <ListItem key={student.id}>
                                <ListItemAvatar><Avatar sx={{ bgcolor: '#7c3aed' }}>{student.name[0]}</Avatar></ListItemAvatar>
                                <ListItemText primary={student.name} secondary={student.email} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions><Button onClick={() => setRosterOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminClasses;

