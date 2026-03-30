import React from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Avatar,
    Paper,
    Stack,
    Divider,
    IconButton
} from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const drawerWidth = 240;

const DashboardLayout = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            width: '100vw',
            height: '100vh',
            bgcolor: '#edfaffff'
        }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    height: '10vh',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar sx={{ minHeight: '10vh' }}>
                    <Typography variant="h4" component="div" sx={{ flexGrow: 1, fontWeight: '700' }}>
                        EduTrack
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant='permanent'
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar sx={{ minHeight: '10vh', mb: 4 }} />
                <List>
                    <ListItemButton>
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px`, mt: '10vh' }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;
