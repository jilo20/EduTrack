import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Stack,
    Button, Avatar, Chip, IconButton, Menu, MenuItem,
    TextField, InputAdornment, Snackbar, Alert,
    List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import AnnouncementCard from '../Common/AnnouncementCard';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalSections: 0, systemAvgGWA: 0 });
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics/admin');
                const data = await res.json();
                setStats(data.stats);
                setEnrollmentData(data.enrollmentStats);
                setRecentActivity(data.recentActivity);
            } catch (err) { console.error('Analytics fetch failed'); }
        };

        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                setUsers([...(data.admins || []), ...(data.teachers || []), ...(data.students || [])]);
            } catch (err) { console.error('Users fetch failed'); }
        };

        fetchAnalytics();
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statCards = [
        { label: 'Total Students', value: stats.totalStudents, icon: <PeopleIcon />, color: '#2563EB' },
        { label: 'Faculty Members', value: stats.totalTeachers, icon: <SchoolIcon />, color: '#7C3AED' },
        { label: 'Active Sections', value: stats.totalSections, icon: <SchoolIcon />, color: '#059669' },
        { label: 'System Avg GWA', value: `${stats.systemAvgGWA}%`, icon: <TrendingUpIcon />, color: '#F59E0B' },
    ];

    const COLORS = ['#2563EB', '#7C3AED', '#059669', '#F59E0B', '#EF4444', '#EC4899'];

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px' }}>
                    System Administration
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Overall institutional health and system-wide analytics.
                </Typography>
            </Box>

            <AnnouncementCard />

            <Grid container spacing={3}>
                {/* Stats Cards */}
                {statCards.map((stat, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${stat.color}15`, color: stat.color }}>{stat.icon}</Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</Typography>
                                        <Typography variant="h5" fontWeight={800}>{stat.value}</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* Enrollment Chart */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 400 }}>
                        <Typography variant="h6" fontWeight={800} mb={3}>Enrollment by Section</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={enrollmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {enrollmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Recent Activity */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 400, display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                            <HistoryIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight={800}>Recent Activity</Typography>
                        </Stack>
                        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                            {recentActivity.map((log, idx) => (
                                <React.Fragment key={log.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={700}>
                                                    {log.actor_name} <Typography component="span" variant="caption" color="text.secondary" fontWeight={500}>({log.actor_role})</Typography>
                                                </Typography>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" color="text.primary" sx={{ display: 'block', mt: 0.5 }}>{log.details}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.action.replace(/_/g, ' ')}</Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {idx < recentActivity.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                            {recentActivity.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <Typography variant="body2" color="text.secondary">No recent logs found.</Typography>
                                </Box>
                            )}
                        </List>
                        <Button fullWidth size="small" sx={{ mt: 2, fontWeight: 700 }}>View All Logs</Button>
                    </Paper>
                </Grid>

                {/* User List Table */}
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={800}>User Directory</Typography>
                            <TextField
                                size="small"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                                sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Box>
                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            <List sx={{ py: 0 }}>
                                {filteredUsers.map((user, idx) => (
                                    <React.Fragment key={user.id}>
                                        <ListItem sx={{ px: 3, py: 2 }}>
                                            <Stack direction="row" spacing={3} alignItems="center" sx={{ width: '100%' }}>
                                                <Avatar sx={{ bgcolor: user.role === 'Admin' ? '#F59E0B' : user.role === 'Teacher' ? '#7C3AED' : '#2563EB', fontWeight: 800 }}>
                                                    {user.name[0]}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" fontWeight={700}>{user.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                                                </Box>
                                                <Chip label={user.role} size="small" sx={{ fontWeight: 800, borderRadius: 1.5 }} />
                                                <Chip
                                                    label={user.status || 'active'}
                                                    size="small"
                                                    color={user.status === 'inactive' ? 'error' : 'success'}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                                                />
                                                <IconButton size="small"><MoreVertIcon /></IconButton>
                                            </Stack>
                                        </ListItem>
                                        {idx < filteredUsers.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 700 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminDashboard;
