import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, LinearProgress, Stack, Divider,
    TextField, Select, MenuItem, FormControl, InputLabel, InputAdornment
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalculateIcon from '@mui/icons-material/Calculate';
import SearchIcon from '@mui/icons-material/Search';

const AcademicPerformance = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [performance, setPerformance] = useState([]);
    const [gwaData, setGwaData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('all');

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const res = await fetch(`/api/student/${user.id}/performance`);
                const data = await res.json();
                if (Array.isArray(data)) setPerformance(data);
            } catch (err) { console.error('Performance fetch failed'); }
        };
        const fetchGWA = async () => {
            try {
                const res = await fetch(`/api/student/${user.id}/gwa`);
                const data = await res.json();
                setGwaData(data);
            } catch (err) { console.error('GWA fetch failed'); }
        };
        fetchPerformance();
        fetchGWA();
    }, [user.id]);
    const gradeColor = (gwaData?.gwa || 0) >= 85 ? '#16A34A' : (gwaData?.gwa || 0) >= 75 ? '#2563EB' : '#DC2626';

    const filteredSections = (gwaData?.sectionGrades || []).filter(s => 
        filterClass === 'all' || s.sectionId === filterClass
    );

    const filteredPerformance = performance.filter(p => {
        const matchesClass = filterClass === 'all' || p.section_id === filterClass;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.sectionName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesClass && matchesSearch;
    });

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                    My Academic Performance
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Comprehensive GWA breakdown and assessment history.
                </Typography>
            </Box>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontWeight: 600 }}>Filter by Class</InputLabel>
                            <Select
                                value={filterClass}
                                label="Filter by Class"
                                onChange={(e) => setFilterClass(e.target.value)}
                                sx={{ borderRadius: 2, fontWeight: 700 }}
                            >
                                <MenuItem value="all" sx={{ fontWeight: 700 }}>All Enrolled Classes</MenuItem>
                                {(gwaData?.sectionGrades || []).map(s => (
                                    <MenuItem key={s.sectionId} value={s.sectionId} sx={{ fontWeight: 700 }}>
                                        {s.sectionName} ({s.sectionCode})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search assessments by name or section..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                sx: { borderRadius: 2 }
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                {/* GWA Summary Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 5, height: '100%' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${gradeColor}10`, color: gradeColor }}>
                                    <TrendingUpIcon />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>Overall GWA</Typography>
                            </Stack>
                            <Typography variant="h2" fontWeight={900} sx={{ color: gradeColor }}>
                                {gwaData?.gwa || 0}%
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 1 }}>
                                <Typography variant="h5" fontWeight={800}>
                                    {gwaData?.equivalentGrade || '—'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    ({gwaData?.gradeDescription || 'N/A'})
                                </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={gwaData?.gwa || 0}
                                sx={{
                                    height: 10, borderRadius: 5, mt: 3, bgcolor: `${gradeColor}20`,
                                    '& .MuiLinearProgress-bar': { bgcolor: gradeColor }
                                }} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* GWA Formula & Category Breakdown */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 5, height: '100%' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                <CalculateIcon sx={{ color: '#2563EB' }} />
                                <Typography variant="h6" fontWeight={800}>GWA Breakdown</Typography>
                            </Stack>

                            {filteredSections.map((section, idx) => (
                                <Box key={idx} sx={{ mb: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle1" fontWeight={800} color="primary">
                                            {section.sectionName}
                                            <Chip label={section.sectionCode} size="small" sx={{ ml: 1, fontWeight: 700, fontSize: '0.65rem' }} />
                                        </Typography>
                                        <Chip label={`${section.sectionGrade}%`} color={section.sectionGrade >= 85 ? 'success' : 'primary'} sx={{ fontWeight: 800 }} />
                                    </Stack>

                                    {/* Category averages */}
                                    <Stack spacing={1.5}>
                                        {Object.entries(section.categoryBreakdown).map(([type, data]) => (
                                            <Box key={type}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {type} <Typography component="span" variant="caption" color="text.secondary">({data.weight}% weight)</Typography>
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={800}>{data.average}%</Typography>
                                                </Stack>
                                                <LinearProgress variant="determinate" value={data.average}
                                                    sx={{
                                                        height: 6, borderRadius: 3, mt: 0.5,
                                                        bgcolor: '#e2e8f0',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: type === 'Quiz' ? '#2563EB' : type === 'Project' ? '#7C3AED' : '#059669'
                                                        }
                                                    }} />
                                            </Box>
                                        ))}
                                    </Stack>

                                    {idx < (gwaData?.sectionGrades?.length || 0) - 1 && <Divider sx={{ mt: 2 }} />}
                                </Box>
                            ))}

                        </CardContent>
                    </Card>
                </Grid>
                {/* Assessment History Table */}
                <Grid size={{ xs: 12 }}>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 5, p: 2 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Assessment</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Score</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPerformance.map((p) => (
                                    <TableRow key={p.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{p.title}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{p.sectionName}</TableCell>
                                        <TableCell>
                                            <Chip label={p.type} size="small" sx={{
                                                fontWeight: 700, borderRadius: 1,
                                                bgcolor: p.type === 'Quiz' ? '#eff6ff' : p.type === 'Project' ? '#f3e8ff' : '#ecfdf5',
                                                color: p.type === 'Quiz' ? '#2563EB' : p.type === 'Project' ? '#7C3AED' : '#059669'
                                            }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight={800}>
                                                {p.achievedScore !== null ? `${p.achievedScore} / ${p.perfectScore}` : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {p.achievedScore !== null ? (
                                                <Chip icon={<CheckCircleOutlineIcon />} label="GRADED" color="success" variant="filled"
                                                    size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary" fontWeight={700}>PENDING</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {performance.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary" fontWeight={500}>
                                            No assessments found. They'll appear here once your instructor creates them.
                                        </Typography>
                                    </TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AcademicPerformance;
