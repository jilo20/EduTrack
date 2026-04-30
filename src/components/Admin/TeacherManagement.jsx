import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, TextField, InputAdornment, Chip, IconButton, 
    Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
    List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const TeacherManagement = () => {
    const [teachers, setTeachers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, currentStatus: '' });

    const fetchTeachers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.teachers) setTeachers(Array.isArray(data.teachers) ? data.teachers : []);
            }
        } catch (err) { console.error('Faculty fetch failed', err); }
    };


    const handleToggleStatus = async (userId) => {
        const token = localStorage.getItem('token');
        const user = (teachers || []).find(u => u.id === userId);
        if (!user) return;
        const newStatus = user.status === 'inactive' ? 'active' : 'inactive';

        
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchTeachers();
                setDetailOpen(false);
                setDeleteConfirm({ open: false, id: null, currentStatus: '' });
            }
        } catch (err) { console.error('Failed to update status'); }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const filteredTeachers = (teachers || []).filter(t =>
        t && (
            (t.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
            (t.email || '').toLowerCase().includes((searchQuery || '').toLowerCase())
        )
    );



    const handleOpenDetail = (teacher) => {
        setSelectedTeacher(teacher);
        setDetailOpen(true);
    };

    return (
        <Box sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Faculty Directory</Typography>
                    <Typography variant="body1" color="text.secondary">Manage and oversee your teaching staff</Typography>
                </Box>
            </Stack>

            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <TextField fullWidth placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', '& fieldset': { border: 'none' } } }}
                />
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Instructor</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Contact Email</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTeachers.map((teacher) => (
                            <TableRow key={teacher.id} hover>
                                <TableCell>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: '#2563EB10', color: '#2563EB', fontWeight: 700 }}>{teacher?.name?.[0]?.toUpperCase() || 'T'}</Avatar>

                                        <Typography fontWeight={600}>{teacher.name}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ color: 'text.secondary' }}>{teacher.email}</TableCell>
                                <TableCell>
                                    <Chip label={teacher.status || 'active'} size="small" sx={{
                                        fontWeight: 700, textTransform: 'capitalize',
                                        bgcolor: teacher.status === 'inactive' ? '#fee2e2' : '#ecfdf5',
                                        color: teacher.status === 'inactive' ? '#991b1b' : '#059669'
                                    }} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenDetail(teacher)}><MoreVertIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Teacher Detail Dialog */}
            <Dialog 
                open={detailOpen} 
                onClose={() => setDetailOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', position: 'relative' }}>
                        <IconButton 
                            onClick={() => setDetailOpen(false)}
                            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                        <Stack spacing={2} alignItems="center" sx={{ mt: 1 }}>
                            <Avatar sx={{ width: 80, height: 80, bgcolor: '#2563EB', fontSize: '2rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                                {selectedTeacher?.name?.[0]?.toUpperCase() || 'T'}

                            </Avatar>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" fontWeight={900}>{selectedTeacher?.name}</Typography>
                                <Chip label="Faculty Member" size="small" sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1', mt: 0.5 }} />
                            </Box>
                        </Stack>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Professional Profile</Typography>
                            <List sx={{ mt: 1 }}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><BadgeIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800}>{selectedTeacher?.id_number || 'N/A'}</Typography>} 
                                        secondary="Employee ID Number" 
                                    />
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><EmailIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800}>{selectedTeacher?.email}</Typography>} 
                                        secondary="Work Email Address" 
                                    />
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><EventAvailableIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800}>{selectedTeacher?.created_at ? new Date(selectedTeacher.created_at).toLocaleDateString() : 'N/A'}</Typography>} 
                                        secondary="Date Registered" 
                                    />
                                </ListItem>
                            </List>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Assigned Classes</Typography>
                            <Box sx={{ mt: 2 }}>
                                {selectedTeacher?.sections?.length > 0 ? (
                                    <Stack spacing={1}>
                                        {(selectedTeacher?.sections || []).map((section, idx) => (
                                            <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', bgcolor: '#f8fafc' }}>
                                                <SchoolIcon sx={{ mr: 1.5, color: '#2563EB', fontSize: '1.2rem' }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight={800}>{section?.name || section}</Typography>
                                                    <Typography variant="caption" color="text.secondary">Primary Instructor</Typography>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Stack>

                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No active assignments.</Typography>
                                )}
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => setDeleteConfirm({ open: true, id: selectedTeacher?.id, currentStatus: selectedTeacher?.status || 'active' })}
                        sx={{ fontWeight: 800, borderRadius: 2, flex: 1 }}
                    >
                        {selectedTeacher?.status === 'inactive' ? 'Activate Account' : 'Deactivate Account'}
                    </Button>
                    <Button variant="contained" onClick={() => setDetailOpen(false)} sx={{ fontWeight: 800, borderRadius: 2, flex: 1 }}>
                        Close Faculty Profile
                    </Button>
                </Box>
            </Dialog>

            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Status Change</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to change the status of this user?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setDeleteConfirm({ open: false, id: null })} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={() => handleToggleStatus(deleteConfirm.id)} sx={{ fontWeight: 700, borderRadius: 2 }}>Confirm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherManagement;
