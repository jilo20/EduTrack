import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Stack,
    Avatar, Chip, IconButton, TextField, InputAdornment, 
    List, ListItem, ListItemText, Divider, Fade, Button
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import AnnouncementCard from '../Common/AnnouncementCard';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalSections: 0, systemAvgGWA: 0 });
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAnalytics = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/analytics/admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.stats) setStats(data.stats);
            if (data.enrollmentStats) setEnrollmentData(data.enrollmentStats);
            if (data.recentActivity) setRecentActivity(data.recentActivity);
        } catch (err) { console.error('Analytics fetch failed', err); }
    };

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setUsers([...(data.admins || []), ...(data.teachers || []), ...(data.students || [])]);
        } catch (err) { console.error('Users fetch failed', err); }
    };


    useEffect(() => {
        fetchAnalytics();
        fetchUsers();
    }, []);

    const filteredUsers = (users || []).filter(u =>
        (u?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );


    const statCards = [
        { label: 'Total Students', value: stats?.totalStudents || 0, icon: <PeopleIcon />, color: '#2563EB' },
        { label: 'Faculty Members', value: stats?.totalTeachers || 0, icon: <SchoolIcon />, color: '#7C3AED' },
        { label: 'Active Classes', value: stats?.totalSections || 0, icon: <SchoolIcon />, color: '#059669' },
        { label: 'System Avg GWA', value: stats?.systemAvgEquiv || '5.00', icon: <TrendingUpIcon />, color: '#F59E0B' },
    ];


    const COLORS = ['#2563EB', '#7C3AED', '#059669', '#F59E0B', '#EF4444', '#EC4899'];

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-1.5px', color: '#1e293b' }}>
                    System Overview
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Monitor institutional performance and system health.
                </Typography>
            </Box>

            <AnnouncementCard />

            <Grid container spacing={3}>
                {statCards.map((stat, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${stat.color}15`, color: stat.color }}>{stat.icon}</Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</Typography>
                                        <Typography variant="h5" fontWeight={900}>{stat.value}</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 450 }}>
                        <Typography variant="h6" fontWeight={800} mb={3}>Enrollment Analytics</Typography>
                        <Box sx={{ width: '100%', overflowX: 'auto', mt: 2, pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 3 } }}>
                            <Box sx={{ width: enrollmentData.length > 10 ? Math.max(800, enrollmentData.length * 50) : '100%' }}>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={enrollmentData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={24}>
                                            {enrollmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 450, display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                            <HistoryIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight={800}>Recent Activity</Typography>
                        </Stack>
                        <List sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            {(recentActivity || []).slice(0, 5).map((log, idx) => (
                                <React.Fragment key={log.id}>
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary={<Box component="div" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{log.actor_name} <Chip label={log.actor_role} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, ml: 1, bgcolor: '#f1f5f9' }} /></Box>}
                                            secondary={<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3, lineHeight: 1.2 }}>{log.details}</Typography>}
                                        />
                                    </ListItem>
                                    {idx < Math.min(recentActivity?.length || 0, 5) - 1 && <Divider sx={{ opacity: 0.6 }} />}
                                </React.Fragment>
                            ))}
                            {(!recentActivity || recentActivity.length === 0) && (
                                <Box sx={{ py: 6, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>No recent activities recorded.</Typography>
                                </Box>
                            )}

                        </List>
                        <Button 
                            fullWidth 
                            variant="text" 
                            onClick={() => navigate('/dashboard/audit-logs')}
                            sx={{ mt: 2, borderRadius: 2, fontWeight: 800, textTransform: 'none', color: 'primary.main', bgcolor: '#f8fafc' }}
                        >
                            View Full System Audit Logs
                        </Button>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={800}>User Directory</Typography>
                            <TextField
                                size="small"
                                placeholder="Search institution directory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                                sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                        </Box>
                        <Box sx={{ overflow: 'hidden' }}>
                            <List sx={{ py: 0 }}>
                                {filteredUsers.slice(0, 8).map((user, idx) => (
                                    <React.Fragment key={user.id}>
                                        <ListItem sx={{ px: 3, py: 2 }}>
                                            <Stack direction="row" spacing={3} alignItems="center" sx={{ width: '100%' }}>
                                                <Avatar sx={{ width: 45, height: 45, bgcolor: user.role === 'Admin' ? '#f59e0b' : user.role === 'Teacher' ? '#7c3aed' : '#2563eb', fontWeight: 900 }}>
                                                    {user?.name?.[0] || 'U'}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" fontWeight={800}>
                                                        {user.name} 
                                                        {user.id_number && (
                                                            <Chip label={user.id_number} size="small" sx={{ ml: 1, height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                                        )}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{user.email}</Typography>
                                                </Box>
                                                <Chip label={user.role} size="small" sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }} />
                                                <IconButton><MoreVertIcon /></IconButton>
                                            </Stack>
                                        </ListItem>
                                        {idx < Math.min(filteredUsers?.length || 0, 8) - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <Box sx={{ py: 10, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>No users found in the directory.</Typography>
                                    </Box>
                                )}

                            </List>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                                <Button 
                                    variant="text" 
                                    onClick={() => navigate('/dashboard/users')}
                                    sx={{ fontWeight: 800, textTransform: 'none', color: 'primary.main' }}
                                >
                                    View All Institutional Users
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;
