import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, Chip, IconButton, Button, Stack, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                if (data?.students) setStudents(data.students);
            } catch (err) { console.error('Student fetch failed'); }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ p: 4 }}>
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
                        {filteredStudents.map((student) => (
                            <TableRow key={student.id} hover>
                                <TableCell>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: '#16A34A10', color: '#16A34A', fontWeight: 700 }}>{student.name[0].toUpperCase()}</Avatar>
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
                                    <IconButton size="small"><MoreVertIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredStudents.length === 0 && (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                <Typography color="text.secondary" fontWeight={500}>No students found.</Typography>
                            </TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default StudentManagement;
