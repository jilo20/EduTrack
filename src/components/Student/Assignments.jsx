import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Chip, List, ListItem, Stack,
    Button, TextField, InputAdornment, Skeleton, Paper, Divider
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';

const Assignments = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [filter, setFilter] = useState('All Status');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await fetch(`/api/student/${user.id}/performance`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    const mapped = data.map(p => ({
                        id: p.id,
                        title: p.title,
                        subject: p.sectionName,
                        type: p.type,
                        status: p.achievedScore !== null ? 'Graded' : 'Pending',
                        score: p.achievedScore,
                        perfectScore: p.perfectScore,
                        percentage: p.achievedScore !== null ? Math.round((p.achievedScore / p.perfectScore) * 100) : null
                    }));
                    setAssignments(mapped);
                }
            } catch (err) { console.error('Assignments fetch failed'); }
            finally { setLoading(false); }
        };
        fetchAssignments();
    }, [user.id]);

    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => {
            const matchesStatus = filter === 'All Status' || a.status === filter;
            const matchesType = typeFilter === 'All Types' || a.type === typeFilter;
            const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesType && matchesSearch;
        });
    }, [assignments, filter, typeFilter, searchQuery]);

    if (loading) {
        return (
            <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
                <Skeleton variant="text" width="30%" height={50} sx={{ mb: 1, borderRadius: 2 }} />
                <Skeleton variant="text" width="50%" height={30} sx={{ mb: 4, borderRadius: 2 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3].map(i => (
                        <Grid item xs={12} key={i}>
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    const gradedCount = assignments.filter(a => a.status === 'Graded').length;
    const pendingCount = assignments.filter(a => a.status === 'Pending').length;

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" color="primary" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                    Assessment Tracker 📝
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Track your exams, quizzes, and projects across all courses.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4, bgcolor: 'rgba(239, 68, 68, 0.05)', color: 'error.dark', border: '1px solid', borderColor: 'rgba(239, 68, 68, 0.2)', boxShadow: 'none' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <WarningIcon />
                                <Box>
                                    <Typography variant="h5" fontWeight="800">{pendingCount} Pending</Typography>
                                    <Typography variant="caption" fontWeight="700">AWAITING GRADES</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4, bgcolor: 'rgba(37, 99, 235, 0.05)', color: 'primary.dark', border: '1px solid', borderColor: 'rgba(37, 99, 235, 0.2)', boxShadow: 'none' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <AssignmentIcon />
                                <Box>
                                    <Typography variant="h5" fontWeight="800">{assignments.length} Total</Typography>
                                    <Typography variant="caption" fontWeight="700">ALL ASSESSMENTS</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4, bgcolor: 'rgba(22, 163, 74, 0.05)', color: 'secondary.dark', border: '1px solid', borderColor: 'rgba(22, 163, 74, 0.2)', boxShadow: 'none' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <CheckCircleIcon />
                                <Box>
                                    <Typography variant="h5" fontWeight="800">{gradedCount} Graded</Typography>
                                    <Typography variant="caption" fontWeight="700">COMPLETED</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>

            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ my: 3 }}>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                        {['All Status', 'Pending', 'Graded'].map(item => (
                            <Chip key={item} label={item} onClick={() => setFilter(item)}
                                color={filter === item ? 'primary' : 'default'} variant={filter === item ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 700, borderRadius: 2 }} />
                        ))}
                    </Stack>
                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                        {['All Types', 'Assignment', 'Quiz', 'Exam', 'Project'].map(item => (
                            <Chip key={item} label={item} onClick={() => setTypeFilter(item)}
                                color={typeFilter === item ? 'secondary' : 'default'} variant={typeFilter === item ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 700, borderRadius: 2 }} />
                        ))}
                    </Stack>
                </Stack>
                <TextField size="small" placeholder="Search assessments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: '100%', md: 300 }, bgcolor: 'white', borderRadius: 2, flexShrink: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="disabled" /></InputAdornment> }} />
            </Stack>

            <Box>
                    {filteredAssignments.length > 0 ? (
                        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0 }}>
                            {filteredAssignments.map(task => (
                                <ListItem key={task.id} sx={{
                                    bgcolor: 'white', borderRadius: 3, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    border: '1px solid', borderColor: 'divider', transition: '0.2s',
                                    '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)' }
                                }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                                            <Typography variant="h6" fontWeight="700">{task.title}</Typography>
                                            <Chip label={task.type} size="small" sx={{
                                                fontWeight: 800, fontSize: '0.65rem',
                                                bgcolor: task.type === 'Quiz' ? '#eff6ff' : task.type === 'Project' ? '#f3e8ff' : '#ecfdf5',
                                                color: task.type === 'Quiz' ? '#2563EB' : task.type === 'Project' ? '#7C3AED' : '#059669'
                                            }} />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" mb={1}>{task.subject}</Typography>
                                        {task.score !== null && (
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Typography variant="body2" fontWeight={700}>
                                                    Score: {task.score}/{task.perfectScore} ({task.percentage}%)
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Box>
                                    <Chip label={task.status} color={task.status === 'Graded' ? 'success' : 'warning'} sx={{ fontWeight: 800, px: 2 }} />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider', bgcolor: 'transparent', boxShadow: 'none' }}>
                            <AssignmentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" fontWeight={700}>No assessments found</Typography>
                            <Typography variant="body2" color="text.secondary">Try a different filter or check back later.</Typography>
                        </Paper>
                    )}
                </Box>
        </Box>
    );
};

export default Assignments;
