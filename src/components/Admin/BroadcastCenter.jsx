import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Stack, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, List, ListItem,
    ListItemText, Chip, Divider, Snackbar, Alert
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';

const BroadcastCenter = () => {
    const [broadcastData, setBroadcastData] = useState({ title: '', content: '', priority: 'normal', target: 'all' });
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [allAnnouncements, setAllAnnouncements] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) { return null; }
    })();


    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/announcements', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAllAnnouncements(Array.isArray(data) ? data : []);
            }
        } catch (err) { console.error('Announcements fetch failed', err); }

    };

    const handleBroadcastSubmit = async () => {
        if (!broadcastData.title || !broadcastData.content) {
            setSnackbar({ open: true, message: 'Please fill in all fields', severity: 'error' });
            return;
        }

        setIsBroadcasting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/announcements/create', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...broadcastData, userId: user?.id || 1 })
            });

            if (res.ok) {
                setSnackbar({ open: true, message: 'Announcement broadcasted successfully!', severity: 'success' });
                setBroadcastData({ title: '', content: '', priority: 'normal', target: 'all' });
                fetchAnnouncements();
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to broadcast announcement', severity: 'error' });
        } finally {
            setIsBroadcasting(false);
        }
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px' }}>
                    Broadcast Center
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage institutional communications and school-wide announcements.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
                            <CampaignIcon color="primary" />
                            <Typography variant="h6" fontWeight={800}>New Broadcast</Typography>
                        </Stack>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label="Title"
                                value={broadcastData.title}
                                onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Message"
                                value={broadcastData.content}
                                onChange={(e) => setBroadcastData({ ...broadcastData, content: e.target.value })}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Target Audience</InputLabel>
                                <Select
                                    value={broadcastData.target}
                                    label="Target Audience"
                                    onChange={(e) => setBroadcastData({ ...broadcastData, target: e.target.value })}
                                >
                                    <MenuItem value="all">Everyone (Teachers & Students)</MenuItem>
                                    <MenuItem value="teachers">Teachers Only</MenuItem>
                                    <MenuItem value="students">Students Only</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={broadcastData.priority}
                                    label="Priority"
                                    onChange={(e) => setBroadcastData({ ...broadcastData, priority: e.target.value })}
                                >
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="high">High Priority</MenuItem>
                                </Select>
                            </FormControl>
                            <Button 
                                variant="contained" 
                                fullWidth 
                                onClick={handleBroadcastSubmit}
                                disabled={isBroadcasting}
                                sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
                            >
                                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Now'}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight={800}>Broadcast History</Typography>
                        </Box>
                        <List>
                            {(allAnnouncements || []).map((a, idx) => (

                                <React.Fragment key={a.id}>
                                    <ListItem sx={{ py: 2.5, px: 3 }}>
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography fontWeight={800}>{a.title}</Typography>
                                                    <Chip 
                                                        label={a.target === 'all' ? 'Everyone' : a.target} 
                                                        size="small" 
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'capitalize' }} 
                                                    />
                                                    {a.priority === 'high' && <Chip label="High" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />}
                                                </Stack>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>{a.content}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{a.date}</Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {idx < allAnnouncements.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
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

export default BroadcastCenter;
