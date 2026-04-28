import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Stack, Paper, Skeleton,
    Tabs, Tab, Badge, Divider, Button, IconButton
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const Announcements = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [announcements, setAnnouncements] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [announcementsRes, notificationsRes] = await Promise.all([
                    fetch('/api/announcements'),
                    fetch(`/api/notifications/user/${user.id}`)
                ]);
                const announcementsData = await announcementsRes.json();
                const notificationsData = await notificationsRes.json();
                setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
                setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
            } catch (err) { console.error('Failed to fetch announcements/notifications', err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [user.id]);

    const handleMarkRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
        } catch (err) { console.error('Failed to mark as read'); }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch(`/api/notifications/mark-all-read/${user.id}`, { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        } catch (err) { console.error('Failed to mark all as read'); }
    };

    const handleClearAll = async () => {
        try {
            await fetch(`/api/notifications/clear-all/${user.id}`, { method: 'POST' });
            setNotifications([]);
        } catch (err) { console.error('Failed to clear all'); }
    };

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    if (loading) {
        return (
            <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
                <Skeleton variant="text" width="30%" height={50} sx={{ mb: 1, borderRadius: 2 }} />
                <Skeleton variant="text" width="50%" height={30} sx={{ mb: 4, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
            </Box>
        );
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const past = new Date(dateStr);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(dateStr);
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" color="primary" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                    Announcements & Notifications 📢
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Stay updated with school announcements and your personal notifications.
                </Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 4, bgcolor: 'rgba(37, 99, 235, 0.05)', border: '1px solid', borderColor: 'rgba(37, 99, 235, 0.2)', boxShadow: 'none' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <CampaignIcon sx={{ color: '#2563EB' }} />
                                <Box>
                                    <Typography variant="h5" fontWeight="800" color="primary.dark">{announcements.length}</Typography>
                                    <Typography variant="caption" fontWeight="700" color="primary.dark">ANNOUNCEMENTS</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 4, bgcolor: 'rgba(245, 158, 11, 0.05)', border: '1px solid', borderColor: 'rgba(245, 158, 11, 0.2)', boxShadow: 'none' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <NotificationsIcon sx={{ color: '#F59E0B' }} />
                                <Box>
                                    <Typography variant="h5" fontWeight="800" color="warning.dark">{unreadCount}</Typography>
                                    <Typography variant="caption" fontWeight="700" color="warning.dark">UNREAD</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 4, bgcolor: 'rgba(22, 163, 74, 0.05)', border: '1px solid', borderColor: 'rgba(22, 163, 74, 0.2)', boxShadow: 'none' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <CheckCircleIcon sx={{ color: '#16A34A' }} />
                                <Box>
                                    <Typography variant="h5" fontWeight="800" color="success.dark">{notifications.length - unreadCount}</Typography>
                                    <Typography variant="caption" fontWeight="700" color="success.dark">READ</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' } }}>
                        <Tab icon={<CampaignIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Announcements" />
                        <Tab icon={
                            <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800, fontSize: '0.65rem' } }}>
                                <NotificationsIcon sx={{ fontSize: 20 }} />
                            </Badge>
                        } iconPosition="start" label="Notifications" />
                    </Tabs>
                    {tab === 1 && notifications.length > 0 && (
                        <Stack direction="row" spacing={1}>
                            {unreadCount > 0 && (
                                <Button size="small" startIcon={<CheckCircleIcon sx={{ fontSize: 18 }} />} onClick={handleMarkAllRead}
                                    sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'none' }}>
                                    Mark all as read
                                </Button>
                            )}
                            <Button size="small" startIcon={<DoneAllIcon />} onClick={handleClearAll}
                                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}>
                                Clear All
                            </Button>
                        </Stack>
                    )}
                </Box>

                {/* Announcements Tab */}
                {tab === 0 && (
                    <Box sx={{ p: 3 }}>
                        {announcements.length > 0 ? (
                            <Stack spacing={2}>
                                {announcements.map(a => (
                                    <Paper key={a.id} elevation={0} sx={{
                                        p: 3, borderRadius: 3,
                                        border: '1px solid', borderColor: 'divider',
                                        borderLeft: `4px solid ${a.priority === 'high' ? '#2563EB' : '#94a3b8'}`,
                                        transition: '0.2s',
                                        '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)' }
                                    }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                                                    <Typography variant="h6" fontWeight={700}>{a.title}</Typography>
                                                    {a.priority === 'high' && (
                                                        <Chip label="Important" size="small" color="error"
                                                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }} />
                                                    )}
                                                </Stack>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{a.content}</Typography>
                                                <Typography variant="caption" color="text.disabled" fontWeight={600}>
                                                    📅 {formatDate(a.date)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                <CampaignIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="h6" color="text.secondary" fontWeight={700}>No announcements yet</Typography>
                                <Typography variant="body2" color="text.secondary">Check back later for updates from your institution.</Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Notifications Tab */}
                {tab === 1 && (
                    <Box sx={{ p: 3 }}>
                        {notifications.length > 0 ? (
                            <Stack spacing={1.5}>
                                {notifications.map(n => (
                                    <Paper key={n.id} elevation={0} sx={{
                                        p: 2.5, borderRadius: 3,
                                        border: '1px solid', borderColor: n.status === 'unread' ? 'primary.light' : 'divider',
                                        bgcolor: n.status === 'unread' ? 'rgba(37, 99, 235, 0.03)' : 'transparent',
                                        transition: '0.2s',
                                        cursor: n.status === 'unread' ? 'pointer' : 'default',
                                        '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)' }
                                    }}
                                    onClick={() => n.status === 'unread' && handleMarkRead(n.id)}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="flex-start">
                                            <Box sx={{ mt: 0.5 }}>
                                                {n.status === 'unread' ? (
                                                    <CircleIcon sx={{ fontSize: 10, color: '#2563EB' }} />
                                                ) : (
                                                    <CheckCircleIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                )}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body1" fontWeight={n.status === 'unread' ? 700 : 500}>
                                                        {n.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled" fontWeight={600}>
                                                        {timeAgo(n.created_at)}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {n.message}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="h6" color="text.secondary" fontWeight={700}>All clear!</Typography>
                                <Typography variant="body2" color="text.secondary">You have no notifications at this time.</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default Announcements;
