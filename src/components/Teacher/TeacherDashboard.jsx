import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Stack,
    LinearProgress, Divider, List, ListItem, ListItemText,
    ListItemAvatar, Avatar, Chip, Tooltip, Alert, AlertTitle,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningIcon from '@mui/icons-material/Warning';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AnnouncementCard from '../Common/AnnouncementCard';

const TeacherDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [analytics, setAnalytics] = useState(null);
    const [performanceData, setPerformanceData] = useState([]);
    const [assessmentStats, setAssessmentStats] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [selectedHonorRollSection, setSelectedHonorRollSection] = useState('all');

    // Dialog states
    const [openHonorRoll, setOpenHonorRoll] = useState(false);
    const [openGradingProgress, setOpenGradingProgress] = useState(false);
    const [openAtRisk, setOpenAtRisk] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchDashboardData = async () => {
            try {
                // Legacy analytics for existing stats cards
                const res1 = await fetch(`/api/teacher/${user.id}/analytics`);
                const data1 = await res1.json();
                setAnalytics(data1);

                // New rich analytics
                const res2 = await fetch(`/api/analytics/teacher/${user.id}`);
                const data2 = await res2.json();
                setPerformanceData((data2.classPerformance || []).map(p => ({ ...p, full: 100 })));
                setAssessmentStats(data2.assessmentStats);
                setAtRiskStudents(data2.atRisk);
                setCategoryData(data2.categoryPerformance);
            } catch (err) { console.error('Dashboard data fetch failed', err); }
        };
        fetchDashboardData();
    }, [user?.id]);

    if (!user || !analytics) return <LinearProgress />;

    const stats = [
        { label: 'Total Students', value: analytics.totalStudents, icon: <PeopleIcon />, color: '#2563EB' },
        { label: 'Active Classes', value: analytics.totalClasses, icon: <SchoolIcon />, color: '#7C3AED' },
        { label: 'Avg. Performance', value: `${analytics.averagePerformance}%`, icon: <TrendingUpIcon />, color: '#059669' },
    ];

    const COLORS = ['#2563EB', '#7C3AED', '#059669', '#F59E0B', '#EF4444'];

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px' }}>
                    Instructor Insights
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Real-time monitoring of classroom performance and student engagement.
                </Typography>
            </Box>

            <AnnouncementCard />

            <Grid container spacing={3}>
                {/* Top Stats */}
                {stats.map((stat, idx) => (
                    <Grid size={{ xs: 12, md: 4 }} key={idx}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${stat.color}15`, color: stat.color }}>{stat.icon}</Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</Typography>
                                        <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* At-Risk Students Alert */}
                {atRiskStudents.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ p: 3, bgcolor: '#FEF2F2', border: '1px solid', borderColor: '#FCA5A5', borderRadius: 4, position: 'relative' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#EF4444', color: '#fff', display: 'flex' }}>
                                        <WarningIcon fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color="#991B1B">Action Required</Typography>
                                        <Typography variant="caption" color="#B91C1C" fontWeight={700}>The following students are performing below the 75% passing threshold</Typography>
                                    </Box>
                                </Stack>
                                <Button size="small" variant="contained" color="error" onClick={() => setOpenAtRisk(true)} sx={{ fontWeight: 800, borderRadius: 2 }}>
                                    Manage All ({atRiskStudents.length})
                                </Button>
                            </Stack>

                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#FCA5A5', borderRadius: 3 } }}>
                                {atRiskStudents.map((s, idx) => (
                                    <Card key={idx} elevation={0} sx={{ minWidth: 240, border: '1px solid', borderColor: '#FCA5A5', borderRadius: 3, bgcolor: '#fff' }}>
                                        <CardContent sx={{ p: 3, '&:last-child': { pb: 2 } }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar sx={{ bgcolor: '#FEE2E2', color: '#EF4444', fontWeight: 800 }}>{s.name[0]}</Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={800}>{s.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">{s.section}</Typography>
                                                </Box>
                                                <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
                                                    <Typography variant="h6" fontWeight={900} color="#EF4444">{s.grade}%</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                )}

                {/* Class Performance Comparison */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 5, height: 380, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" fontWeight={800}>Section Achievement</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Average cumulative grade per class section</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={performanceData} 
                                    layout="vertical" 
                                    margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                                    barCategoryGap="20%"
                                >
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={120}
                                        tick={{ fill: '#1e293b', fontSize: 13, fontWeight: 800 }} 
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    {/* Background Bar (Track) */}
                                    <Bar dataKey="full" fill="#f1f5f9" radius={[0, 6, 6, 0]} barSize={24} isAnimationActive={false} />
                                    {/* Actual Performance Bar */}
                                    <Bar 
                                        dataKey="average" 
                                        radius={[0, 6, 6, 0]} 
                                        barSize={24}
                                    >
                                        {performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.average >= 75 ? '#2563EB' : '#EF4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                        <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2563EB' }} />
                                <Typography variant="caption" fontWeight={700}>On Track (≥75%)</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EF4444' }} />
                                <Typography variant="caption" fontWeight={700}>Needs Support ({'<' }75%)</Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Class Mastery Radar Chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 400, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" fontWeight={800}>Class Mastery</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Overall strength per assessment category</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, width: '100%', mt: -2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Class Average"
                                        dataKey="average"
                                        stroke="#2563EB"
                                        fill="#2563EB"
                                        fillOpacity={0.6}
                                    />
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </Box>
                        <Box sx={{ mt: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Visualizing curriculum focus and group performance.</Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Grading Progress */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" mb={3}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <AssessmentIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight={800}>Grading Progress</Typography>
                            </Stack>
                            <Button size="small" startIcon={<OpenInFullIcon fontSize="small" />} onClick={() => setOpenGradingProgress(true)} sx={{ fontWeight: 700 }}>
                                View All
                            </Button>
                        </Stack>
                        <Stack spacing={3} sx={{ flexGrow: 1, maxHeight: 220, overflow: 'hidden' }}>
                            {assessmentStats.slice(0, 3).map((stat, idx) => {
                                const percent = Math.round((stat.graded / stat.total) * 100) || 0;
                                return (
                                    <Box key={idx}>
                                        <Stack direction="row" justifyContent="space-between" mb={1}>
                                            <Typography variant="body2" fontWeight={700}>{stat.name}</Typography>
                                            <Typography variant="caption" fontWeight={800} color="text.secondary">{stat.graded} / {stat.total} Records</Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={percent}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: percent === 100 ? '#059669' : '#2563EB' } }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Honor Roll (Keeping existing feature) */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
                            <Box>
                                <Typography variant="h6" fontWeight={800}>Honor Roll</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>Top performers</Typography>
                            </Box>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                    value={selectedHonorRollSection}
                                    onChange={(e) => setSelectedHonorRollSection(e.target.value)}
                                    sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.75rem', height: 32 }}
                                >
                                    <MenuItem value="all" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>All Sections</MenuItem>
                                    {(analytics.sections || []).map(s => (
                                        <MenuItem key={s.id} value={s.id} sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                        <List sx={{ px: 0, flexGrow: 1, maxHeight: 220, overflow: 'hidden' }}>
                            {analytics.topStudents
                                .filter(s => selectedHonorRollSection === 'all' || s.section_id === selectedHonorRollSection)
                                .slice(0, 3)
                                .map((student, idx) => (
                                    <ListItem key={idx} sx={{ px: 0, py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: idx === 0 ? '#FBBF24' : '#F1F5F9', color: idx === 0 ? '#fff' : '#475569', fontWeight: 800 }}>{idx + 1}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography fontWeight={800}>{student.name}</Typography>}
                                            secondary={`${student.section_name || 'General'} • ${student.average}%`}
                                        />
                                        <Chip label={`${student.average}%`} size="small" color={student.average > 90 ? "success" : "primary"}
                                            variant={idx === 0 ? "filled" : "outlined"} sx={{ fontWeight: 800 }} />
                                    </ListItem>
                                ))}
                        </List>
                        <Button fullWidth variant="outlined" size="small" onClick={() => setOpenHonorRoll(true)} sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}>
                            View Full Honor Roll
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* Honor Roll Dialog */}
            <Dialog open={openHonorRoll} onClose={() => setOpenHonorRoll(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Institutional Honor Roll
                    <IconButton onClick={() => setOpenHonorRoll(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                        <Typography variant="body2" color="text.secondary" fontWeight={700}>Filtering: {selectedHonorRollSection === 'all' ? 'All Sections' : analytics.sections.find(s => s.id === selectedHonorRollSection)?.name}</Typography>
                        <EmojiEventsIcon sx={{ color: '#FBBF24' }} />
                    </Stack>
                    <List>
                        {analytics.topStudents
                            .filter(s => selectedHonorRollSection === 'all' || s.section_id === selectedHonorRollSection)
                            .map((student, idx) => (
                                <ListItem key={idx} sx={{ py: 2 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: idx === 0 ? '#FBBF24' : idx < 3 ? '#FDE68A' : '#F1F5F9', color: idx === 0 ? '#fff' : '#475569', fontWeight: 800 }}>{idx + 1}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={<Typography fontWeight={800}>{student.name}</Typography>} secondary={`${student.section_name} • Performance Grade`} />
                                    <Stack alignItems="flex-end">
                                        <Typography variant="h6" fontWeight={900} color="primary">{student.average}%</Typography>
                                        <Chip label="Outstanding" size="small" color="success" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 800 }} />
                                    </Stack>
                                </ListItem>
                            ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenHonorRoll(false)} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Grading Progress Dialog */}
            <Dialog open={openGradingProgress} onClose={() => setOpenGradingProgress(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Full Assessment Completion Status
                    <IconButton onClick={() => setOpenGradingProgress(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={4} sx={{ py: 1 }}>
                        {assessmentStats.map((stat, idx) => {
                            const percent = Math.round((stat.graded / stat.total) * 100) || 0;
                            return (
                                <Box key={idx}>
                                    <Stack direction="row" justifyContent="space-between" mb={1.5}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={800}>{stat.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{stat.fullName}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="h6" fontWeight={800} color="primary">{percent}%</Typography>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary">{stat.graded} / {stat.total} Graded</Typography>
                                        </Box>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percent}
                                        sx={{ height: 12, borderRadius: 6, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: percent === 100 ? '#059669' : '#2563EB', borderRadius: 6 } }}
                                    />
                                </Box>
                            );
                        })}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenGradingProgress(false)} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* At-Risk Students Dialog */}
            <Dialog open={openAtRisk} onClose={() => setOpenAtRisk(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#DC2626' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <WarningIcon />
                        <Typography variant="inherit">At-Risk Students Detail</Typography>
                    </Stack>
                    <IconButton onClick={() => setOpenAtRisk(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <List>
                        {atRiskStudents.map((s, idx) => (
                            <ListItem key={idx} sx={{ py: 2 }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: '#fee2e2', color: '#DC2626' }}>{s.name[0]}</Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={<Typography fontWeight={800}>{s.name}</Typography>}
                                    secondary={`Enrolled in ${s.section}`}
                                />
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h6" fontWeight={900} color="error">{s.grade}%</Typography>
                                    <Typography variant="caption" fontWeight={700} color="error">CRITICAL</Typography>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenAtRisk(false)} sx={{ fontWeight: 700 }}>Close</Button>
                    <Button variant="contained" color="error" sx={{ fontWeight: 700 }}>Notify All</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherDashboard;
