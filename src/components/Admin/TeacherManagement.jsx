import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, Chip, IconButton, Button, Stack, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

const TeacherManagement = () => {
    const [teachers, setTeachers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                if (data?.teachers) setTeachers(data.teachers);
            } catch (err) { console.error('Faculty fetch failed'); }
        };
        fetchTeachers();
    }, []);

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Faculty Directory</Typography>
                    <Typography variant="body1" color="text.secondary">Manage and oversee your teaching staff</Typography>
                </Box>
                <Button variant="contained" startIcon={<MailOutlineIcon />} sx={{ bgcolor: '#2563EB', fontWeight: 700, borderRadius: 2 }}>
                    Broadcast to Faculty
                </Button>
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
                                        <Avatar sx={{ bgcolor: '#2563EB10', color: '#2563EB', fontWeight: 700 }}>{teacher.name[0].toUpperCase()}</Avatar>
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
                                    <IconButton size="small"><MoreVertIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredTeachers.length === 0 && (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                <Typography color="text.secondary" fontWeight={500}>No faculty members found.</Typography>
                            </TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default TeacherManagement;
