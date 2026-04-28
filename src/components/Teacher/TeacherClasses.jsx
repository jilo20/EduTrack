import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Autocomplete, Checkbox, Snackbar, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText,
    Divider, IconButton, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const TeacherClasses = () => {
    const teacher = JSON.parse(localStorage.getItem('user'));
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

    const fetchClasses = async () => {
        const res = await fetch(`/api/teacher/${teacher.id}/classes`);
        const data = await res.json();
        setClasses(data);
    };

    useEffect(() => {
        fetchClasses();
        const fetchStudents = async () => {
            const res = await fetch('/api/students');
            const data = await res.json();
            setAllStudents(data);
        };
        fetchStudents();
    }, [teacher.id]);

    const handleOpenEnroll = async (cls) => {
        setSelectedClass(cls);
        const res = await fetch(`/api/class/${cls.id}/roster`);
        const data = await res.json();
        setCurrentRosterIds(data.students.map(s => s.id));
        setEnrollOpen(true);
    };

    const handleEnroll = async () => {
        await fetch('/api/enroll-students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch('/api/create-class', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newClass, teacherId: teacher.id })
        });
        if (res.ok) {
            setCreateOpen(false);
            setNewClass({ name: '', section: '', description: '', schedule: 'TBA' });
            setSnackbar({ open: true, message: 'Class created successfully!', severity: 'success' });
            fetchClasses();
        }
    };

    const availableStudents = allStudents.filter(s => !currentRosterIds.includes(s.id));

    const handleViewRoster = async (cls) => {
        setSelectedClass(cls);
        try {
            const res = await fetch(`/api/class/${cls.id}/roster`);
            const data = await res.json();
            setRosterStudents(data.students || []);
            setRosterOpen(true);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to load roster.', severity: 'error' });
        }
    };

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

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Course Program</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Section Code</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Schedule</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Enrolled</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classes.map((cls) => (
                            <TableRow key={cls.id} hover>
                                <TableCell><Typography fontWeight={700} color="primary">{cls.name}</Typography></TableCell>
                                <TableCell><Chip label={cls.section} size="small" variant="outlined" sx={{ fontWeight: 800, borderRadius: 1 }} /></TableCell>
                                <TableCell>
                                    <Chip label={cls.schedule || 'TBA'} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }} />
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                        <PeopleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        <Typography fontWeight={800}>{cls.studentCount}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenEnroll(cls)} sx={{ fontWeight: 700 }}>
                                            Add Students
                                        </Button>
                                        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleViewRoster(cls)} sx={{ fontWeight: 700 }}>Roster</Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        {classes.length === 0 && (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                <Typography color="text.secondary">No classes yet. Create one to get started.</Typography>
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
                                                {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
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
                            <Typography variant="caption" color="text.secondary">Use "Add Students" to enroll students into this class.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setRosterOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
                    <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => { setRosterOpen(false); handleOpenEnroll(selectedClass); }}
                        sx={{ bgcolor: '#2563EB', fontWeight: 700 }}>
                        Add More Students
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
