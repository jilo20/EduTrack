import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Button, AppBar, Toolbar, Drawer, List, ListItemButton,
    ListItemIcon, ListItemText, Avatar, Stack, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, Badge, Menu, MenuItem, Divider, Chip
} from '@mui/material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

const drawerWidth = 250;

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifAnchor, setNotifAnchor] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/', { replace: true });
    };

    const handleNotifClick = (event) => {
        setNotifAnchor(event.currentTarget);
        fetchNotifData();
    };

    const handleNotifClose = () => {
        setNotifAnchor(null);
    };

    const fetchNotifData = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/notifications/user/${user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data.slice(0, 5));
                setUnreadCount(data.filter(n => n.status === 'unread').length);
            }
        } catch (err) { /* silently fail */ }
    };

    const handleMarkRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            fetchNotifData();
        } catch (err) { /* silently fail */ }
    };

    useEffect(() => {
        if (!user) return;
        fetchNotifData();
        const interval = setInterval(fetchNotifData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const adminMenu = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Broadcast Center', icon: <CampaignIcon />, path: '/dashboard/broadcast' },
        { text: 'Manage Teachers', icon: <SchoolIcon />, path: '/dashboard/teachers' },
        { text: 'Manage Students', icon: <PeopleIcon />, path: '/dashboard/students' },
        { text: 'Audit Logs', icon: <HistoryIcon />, path: '/dashboard/audit-logs' },
    ];

    const teacherMenu = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'My Classes', icon: <SchoolIcon />, path: '/dashboard/classes' },
        { text: 'Grading Hub', icon: <TrendingUpIcon />, path: '/dashboard/performance' },
        { text: 'Attendance', icon: <CheckCircleIcon />, path: '/dashboard/attendance' },
        { text: 'Announcements', icon: <CampaignIcon />, path: '/dashboard/announcements' },
    ];

    const studentMenu = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Academic Performance', icon: <TrendingUpIcon />, path: '/dashboard/performance' },
        { text: 'Assessments', icon: <AssignmentIcon />, path: '/dashboard/assignments' },
        { text: 'Attendance', icon: <EventNoteIcon />, path: '/dashboard/my-attendance' },
        { text: 'Announcements', icon: <CampaignIcon />, path: '/dashboard/announcements' },
    ];

    const menuItems = user?.role === 'Admin' ? adminMenu : (user?.role === 'Teacher' ? teacherMenu : studentMenu);
    const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    const roleColors = { Admin: '#DC2626', Teacher: '#2563EB', Student: '#16A34A' };
    const roleColor = roleColors[user?.role] || '#2563EB';

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: 'white',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h5" component="div" sx={{ fontWeight: '800', letterSpacing: '-0.5px' }}>
                        EduTrack<span style={{ color: '#16A34A' }}>.</span>
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <IconButton onClick={handleNotifClick} sx={{ color: 'text.secondary' }}>
                            <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800, fontSize: '0.6rem', minWidth: 18, height: 18 } }}>
                                <NotificationsNoneIcon />
                            </Badge>
                        </IconButton>

                        <Menu
                            anchorEl={notifAnchor}
                            open={Boolean(notifAnchor)}
                            onClose={handleNotifClose}
                            PaperProps={{
                                sx: { width: 320, maxHeight: 480, borderRadius: 4, mt: 1.5, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid', borderColor: 'divider' }
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={800}>Notifications</Typography>
                                {unreadCount > 0 && (
                                    <Chip label={`${unreadCount} New`} size="small" color="primary" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
                                )}
                            </Box>
                            <Divider />
                            <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <MenuItem 
                                            key={n.id} 
                                            onClick={() => { 
                                                if (n.status === 'unread') handleMarkRead(n.id);
                                                handleNotifClose(); 
                                                navigate('/dashboard/announcements'); 
                                            }}
                                            sx={{ py: 1.5, px: 2, whiteSpace: 'normal', borderBottom: '1px solid', borderColor: 'rgba(0,0,0,0.04)', '&:last-child': { borderBottom: 0 } }}
                                        >
                                            <Box>
                                                <Typography variant="body2" fontWeight={n.status === 'unread' ? 800 : 500} sx={{ mb: 0.5 }}>{n.title}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>{n.message}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))
                                ) : (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>No new notifications</Typography>
                                    </Box>
                                )}
                            </Box>
                            <Divider />
                            <Box sx={{ p: 1 }}>
                                <Button 
                                    fullWidth 
                                    size="small" 
                                    onClick={() => { handleNotifClose(); navigate('/dashboard/announcements'); }}
                                    sx={{ fontWeight: 700, textTransform: 'none' }}
                                >
                                    View All Announcements
                                </Button>
                            </Box>
                        </Menu>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {user?.name || 'Loading...'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: roleColor, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {user?.role}
                            </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: roleColor, width: 38, height: 38, fontSize: '0.85rem', fontWeight: 800 }}>
                            {userInitials}
                        </Avatar>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'white',
                        borderRight: '1px solid',
                        borderColor: 'divider'
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto', mt: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <List sx={{ px: 2, flexGrow: 1 }}>
                        {menuItems.map((item) => (
                            <ListItemButton
                                key={item.text}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: 2, mb: 0.5, py: 1.2,
                                    '&.Mui-selected': {
                                        bgcolor: `${roleColor}10`,
                                        color: roleColor,
                                        '& .MuiListItemIcon-root': { color: roleColor },
                                        '&:hover': { bgcolor: `${roleColor}18` }
                                    },
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                                }}
                                selected={location.pathname === item.path}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? roleColor : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: location.pathname === item.path ? 700 : 500,
                                        color: location.pathname === item.path ? roleColor : 'text.primary'
                                    }}
                                />
                            </ListItemButton>
                        ))}
                    </List>

                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <ListItemButton
                            onClick={() => setLogoutOpen(true)}
                            sx={{
                                borderRadius: 2, color: 'error.main',
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Logout"
                                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                            />
                        </ListItemButton>
                    </Box>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                <Toolbar />
                <Outlet />
            </Box>

            {/* Logout Confirmation Dialog */}
            <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Logout</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to sign out of EduTrack?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setLogoutOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleLogout} sx={{ fontWeight: 700 }}>
                        Sign Out
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DashboardLayout;
