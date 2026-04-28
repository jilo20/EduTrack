import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, LinearProgress, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Skeleton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';

const Attendance = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await fetch(`/api/student/${user.id}/attendance`);
                const result = await res.json();
                setData(result);
            } catch (err) { console.error('Attendance fetch failed'); }
            finally { setLoading(false); }
        };
        fetchAttendance();
    }, [user.id]);

    if (loading) {
        return (
            <Box sx={{ p: 4 }}>
                <Skeleton variant="text" width="40%" height={60} sx={{ mb: 4 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography color="text.secondary">Unable to load attendance data.</Typography>
            </Box>
        );
    }

    const { records, total, presentCount, absentCount, lateCount, percentage } = data;

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" color="primary" gutterBottom>
                    Attendance Report 📊
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Your complete attendance record across all sections.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: 4, height: 200, border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent sx={{ textAlign: 'center', py: 5 }}>
                            <Typography variant="h2" fontWeight="900" color="secondary.main">
                                {percentage}%
                            </Typography>
                            <Typography variant="h6" fontWeight="700">Overall Attendance</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {percentage >= 85 ? 'Meeting the minimum 85% requirement. Keep it up!' : 'Below the 85% minimum. Please attend more classes.'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: 4, height: 200, border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="700" mb={3}>Quick Stats</Typography>
                            <Stack spacing={3}>
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2" fontWeight="700">Compliance Progress</Typography>
                                        <Typography variant="body2" fontWeight="700">{percentage}% / 85%</Typography>
                                    </Stack>
                                    <LinearProgress variant="determinate" value={percentage}
                                        sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(22, 163, 74, 0.1)' }} />
                                </Box>
                                <Stack direction="row" spacing={2}>
                                    <Chip icon={<CheckCircleIcon />} label={`${presentCount} Present`} color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                                    <Chip icon={<WarningIcon />} label={`${lateCount} Late`} color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                                    <Chip icon={<CancelIcon />} label={`${absentCount} Absent`} color="error" variant="outlined" sx={{ fontWeight: 700 }} />
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(37, 99, 235, 0.05)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Remarks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {records.map((row, i) => (
                                    <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.status} size="small"
                                                color={row.status === 'Present' ? 'success' : row.status === 'Late' ? 'warning' : 'error'}
                                                sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontStyle: row.remarks ? 'normal' : 'italic' }}>
                                            {row.remarks || 'Standard presence recorded'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {records.length === 0 && (
                                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">No attendance records found.</Typography>
                                    </TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Attendance;
