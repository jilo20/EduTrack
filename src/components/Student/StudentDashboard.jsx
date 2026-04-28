import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography, Box, Grid, Card, CardContent, LinearProgress,
    Stack, Paper, Avatar, Divider, Chip, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import StarIcon from '@mui/icons-material/Star';
import AnnouncementCard from '../Common/AnnouncementCard';

const StudentDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch(`/api/analytics/student/${user.id}`);
                const data = await res.json();
                setAnalytics(data);
            } catch (err) { console.error('Student analytics fetch failed', err); }
        };
        fetchDashboardData();
    }, [user.id]);

    const [openHistory, setOpenHistory] = useState(false);

    if (!analytics) return <LinearProgress />;

    const gradeColor = analytics.gwa >= 85 ? '#16A34A' : analytics.gwa >= 75 ? '#2563EB' : '#DC2626';

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" fontWeight="800" color="primary" gutterBottom sx={{ letterSpacing: '-1px' }}>
                    Hello, {user?.name?.split(' ')[0] || 'Student'}! 🚀
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Your personalized academic performance and growth tracker.
                </Typography>
            </Box>

            <AnnouncementCard />

            <Grid container spacing={3}>
                {/* Stats Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${gradeColor}10`, color: gradeColor }}><TrendingUpIcon /></Box>
                                <Typography variant="h6" fontWeight={700}>General Weighted Average</Typography>
                            </Stack>
                            <Typography variant="h2" fontWeight={800} sx={{ color: gradeColor }}>{analytics.gwa}%</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                <Typography variant="h5" fontWeight={700}>{analytics.equivalentGrade}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>({analytics.gwa >= 75 ? 'PASSING' : 'FAILING'})</Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#16A34A10', color: '#16A34A' }}><EventAvailableIcon /></Box>
                                <Typography variant="h6" fontWeight={700}>Attendance Rate</Typography>
                            </Stack>
                            <Typography variant="h2" fontWeight={800} color="#16A34A">{analytics.attendanceStats.percentage}%</Typography>
                            <Box sx={{ mt: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={analytics.attendanceStats.percentage}
                                    sx={{ height: 10, borderRadius: 5, bgcolor: '#16A34A20', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {analytics.attendanceStats.presentCount} days present / {analytics.attendanceStats.total} total
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#7C3AED10', color: '#7C3AED' }}><AssignmentIcon /></Box>
                                <Typography variant="h6" fontWeight={700}>Latest Achievement</Typography>
                            </Stack>
                            {analytics.recentGrades[0] ? (
                                <Box>
                                    <Typography variant="h4" fontWeight={800} color="#7C3AED">{analytics.recentGrades[0].score}%</Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>{analytics.recentGrades[0].title}</Typography>
                                    <Chip label="RECENTLY GRADED" size="small" sx={{ mt: 1, fontWeight: 700, bgcolor: '#7C3AED15', color: '#7C3AED' }} />
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No assessments graded yet.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Performance Trend Chart */}
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 400 }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>Performance Over Time</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={analytics.trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="title" hide />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `${value}%`} />
                                <RechartsTooltip
                                    formatter={(value) => [`${value}%`, 'Score']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#2563EB"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Radar Chart for Strengths */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 400 }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>Category Mastery</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.categoryStrengths}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Mastery"
                                    dataKey="A"
                                    stroke="#7C3AED"
                                    fill="#7C3AED"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Recent Grades List */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 400, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight={800} mb={1.5}>Grade History</Typography>
                        <Stack spacing={2} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                            {analytics.recentGrades.map((grade, idx) => (
                                <Box key={idx} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                        <Typography variant="body2" fontWeight={800} noWrap sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                            {grade.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Recorded recently</Typography>
                                    </Box>
                                    <Typography variant="h6" fontWeight={900} color={grade.score >= 75 ? 'primary' : 'error'} sx={{ flexShrink: 0 }}>
                                        {grade.score}%
                                    </Typography>
                                </Box>
                            ))}
                            {analytics.recentGrades.length === 0 && (
                                <Typography variant="body2" color="text.secondary" align="center" py={4}>No grade history available.</Typography>
                            )}
                        </Stack>
                        <Button fullWidth variant="outlined" size="small" onClick={() => setOpenHistory(true)} sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}>
                            View Full History
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* History Dialog */}
            <Dialog open={openHistory} onClose={() => setOpenHistory(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Academic Achievement History
                    <IconButton onClick={() => setOpenHistory(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {analytics.trendData.slice().reverse().map((grade, idx) => (
                            <Box key={idx} sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={800}>{grade.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">Assessment Record • ID #{grade.id}</Typography>
                                </Box>
                                <Chip label={`${grade.score}%`} color={grade.score >= 75 ? "primary" : "error"} sx={{ fontWeight: 900, borderRadius: 2 }} />
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenHistory(false)} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StudentDashboard;
