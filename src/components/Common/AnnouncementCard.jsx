import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stack, Button, Chip, Skeleton, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CampaignIcon from '@mui/icons-material/Campaign';

const AnnouncementCard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch('/api/announcements');
                const data = await res.json();
                
                // Filter based on role
                const filtered = (data || []).filter(a => {
                    if (!user || user.role === 'Admin') return true;
                    const target = a.target || 'all'; // Default to 'all' for old data
                    if (target === 'all') return true;
                    if (user.role === 'Teacher' && target === 'teachers') return true;
                    if (user.role === 'Student' && target === 'students') return true;
                    return false;
                });

                setAnnouncements(filtered);
            } catch (err) { console.error('Failed to fetch announcements', err); }
            finally { setLoading(false); }
        };
        fetchAnnouncements();
    }, [user?.role]);

    if (loading) return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4, mb: 3 }} />;

    if (announcements.length === 0) return null;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 2.5, 
                mb: 3, 
                border: '1px solid', 
                borderColor: 'primary.light', 
                borderRadius: 4, 
                bgcolor: 'rgba(37, 99, 235, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3
            }}
        >
            <Stack direction="row" spacing={2.5} alignItems="flex-start" sx={{ flex: 1 }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'primary.main', color: '#fff', display: 'flex', mt: 0.5 }}>
                    <CampaignIcon />
                </Box>
                <Stack spacing={1.5} sx={{ flex: 1 }}>
                    {announcements.slice(0, 2).map((a, idx) => (
                        <Box key={a.id}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.2}>
                                <Typography variant="subtitle2" fontWeight={800} color="primary.dark">
                                    {a.title}
                                </Typography>
                                {a.priority === 'high' && (
                                    <Chip label="High Priority" size="small" color="error" sx={{ fontWeight: 800, height: 18, fontSize: '0.6rem' }} />
                                )}
                                <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ ml: 1 }}>
                                    • {formatDate(a.date)}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                maxWidth: '90%'
                            }}>
                                {a.content}
                            </Typography>
                            {idx === 0 && announcements.length > 1 && <Divider sx={{ mt: 1.5, opacity: 0.6 }} />}
                        </Box>
                    ))}
                </Stack>
            </Stack>
            <Button 
                variant="contained" 
                size="small" 
                onClick={() => navigate('/dashboard/announcements')}
                sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', px: 3, py: 1, whiteSpace: 'nowrap' }}
            >
                View All
            </Button>
        </Paper>
    );
};

export default AnnouncementCard;
