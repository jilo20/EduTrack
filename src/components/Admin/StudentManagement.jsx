import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, TextField, InputAdornment, Chip, IconButton, 
    Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
    List, ListItem, ListItemText, ListItemIcon, Snackbar, Alert, CircularProgress
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CloseIcon from '@mui/icons-material/Close';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, currentStatus: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchStudents = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.students) setStudents(Array.isArray(data.students) ? data.students : []);
            }
        } catch (err) { 
            console.error('Student fetch failed', err);
        } finally {
            setLoading(false);
        }
    };


    const handleToggleStatus = async (userId) => {
        const token = localStorage.getItem('token');
        const user = (students || []).find(u => u.id === userId);
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
                fetchStudents();
                setDetailOpen(false);
                setDeleteConfirm({ open: false, id: null, currentStatus: '' });
                setSnackbar({ open: true, message: `Account successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}.`, severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'Failed to update account status.', severity: 'error' });
            }
        } catch (err) { 
            setSnackbar({ open: true, message: 'A network error occurred.', severity: 'error' });
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const filteredStudents = (students || []).filter(s =>
        s && (
            (s.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
            (s.email || '').toLowerCase().includes((searchQuery || '').toLowerCase())
        )
    );



    const handleOpenDetail = (student) => {
        setSelectedStudent(student);
        setDetailOpen(true);
    };

    return (
        <Box sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Student Body</Typography>
                    <Typography variant="body1" color="text.secondary">View and manage all registered students</Typography>
                </Box>
                <Button variant="contained" startIcon={<GroupAddIcon />} sx={{ bgcolor: '#16A34A', fontWeight: 700, borderRadius: 2 }}>
                    Generate Student Report
                </Button>
            </Stack>

            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <TextField fullWidth placeholder="Search by student name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', '& fieldset': { border: 'none' } } }}
                />
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={40} thickness={4} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 700 }}>
                                        Retrieving student registry...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: '#16A34A10', color: '#16A34A', fontWeight: 700 }}>{student?.name?.[0]?.toUpperCase() || 'S'}</Avatar>

                                            <Typography fontWeight={600}>{student.name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{student.email}</TableCell>
                                    <TableCell>
                                        <Chip label={student.status || 'active'} size="small" sx={{
                                            fontWeight: 700, textTransform: 'capitalize',
                                            bgcolor: student.status === 'inactive' ? '#fee2e2' : '#ecfdf5',
                                            color: student.status === 'inactive' ? '#991b1b' : '#059669'
                                        }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpenDetail(student)}><MoreVertIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <Typography color="text.secondary" fontWeight={500}>No students found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Student Detail Dialog */}
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
                            <Avatar sx={{ width: 80, height: 80, bgcolor: '#16A34A', fontSize: '2rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                                {selectedStudent?.name?.[0]?.toUpperCase() || 'S'}
                            </Avatar>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" fontWeight={900}>{selectedStudent?.name}</Typography>
                                <Chip label="Student Account" size="small" sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#16a34a', mt: 0.5 }} />
                            </Box>
                        </Stack>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Account Information</Typography>
                            <List sx={{ mt: 1 }}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><BadgeIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800}>{selectedStudent?.id_number || 'N/A'}</Typography>} 
                                        secondary="Institutional ID Number" 
                                    />
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><EmailIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800}>{selectedStudent?.email}</Typography>} 
                                        secondary="Primary Email Address" 
                                    />
                                </ListItem>
                            </List>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Current Enrolled Classes</Typography>
                            <Box sx={{ mt: 2 }}>
                                {selectedStudent?.sections?.length > 0 ? (
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {(selectedStudent?.sections || []).map((section, idx) => (
                                            <Chip 
                                                key={idx} 
                                                label={section?.name || section} 
                                                icon={<SchoolIcon sx={{ fontSize: '1rem !important' }} />}
                                                sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} 
                                            />
                                        ))}
                                    </Stack>

                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No active classes found.</Typography>
                                )}
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => setDeleteConfirm({ open: true, id: selectedStudent?.id, currentStatus: selectedStudent?.status || 'active' })}
                        sx={{ fontWeight: 800, borderRadius: 2, flex: 1 }}
                    >
                        {selectedStudent?.status === 'inactive' ? 'Activate Account' : 'Deactivate Account'}
                    </Button>
                    <Button variant="contained" onClick={() => setDetailOpen(false)} sx={{ fontWeight: 800, borderRadius: 2, flex: 1 }}>
                        Close Profile
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

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', fontWeight: 700, borderRadius: 3 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StudentManagement;
