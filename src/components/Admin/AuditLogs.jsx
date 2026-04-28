import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, TextField, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('All');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/audit-logs');
                const data = await res.json();
                setLogs(data);
            } catch (err) { console.error('Audit logs fetch failed'); }
        };
        fetchLogs();
    }, []);

    const actionColors = {
        GRADE_CHANGED: { bg: '#fef3c7', color: '#92400e' },
        GRADE_ENTERED: { bg: '#ecfdf5', color: '#065f46' },
        USER_CREATED: { bg: '#eff6ff', color: '#1e40af' },
        USER_UPDATED: { bg: '#f3e8ff', color: '#6b21a8' },
        USER_DEACTIVATED: { bg: '#fee2e2', color: '#991b1b' },
        ATTENDANCE_MARKED: { bg: '#e0f2fe', color: '#0c4a6e' }
    };

    const actionTypes = ['All', ...new Set(logs.map(l => l.action))];

    const filteredLogs = logs.filter(log => {
        const matchesSearch = (log.actor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.target_user_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterAction === 'All' || log.action === filterAction;
        return matchesSearch && matchesFilter;
    });

    return (
        <Box sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <HistoryIcon sx={{ color: '#2563EB', fontSize: 32 }} />
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                        Audit Trail
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Complete log of all system actions — grade changes, user management, and attendance.
                    </Typography>
                </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3, mb: 3 }}>
                <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by actor, target, or details..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', '& fieldset': { border: 'none' } } }}
                    />
                </Paper>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {actionTypes.map(action => (
                        <Chip
                            key={action}
                            label={action.replace(/_/g, ' ')}
                            onClick={() => setFilterAction(action)}
                            variant={filterAction === action ? 'filled' : 'outlined'}
                            color={filterAction === action ? 'primary' : 'default'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem', borderRadius: 2 }}
                        />
                    ))}
                </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actor</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLogs.map((log) => {
                            const colors = actionColors[log.action] || { bg: '#f1f5f9', color: '#475569' };
                            return (
                                <TableRow key={log.id} hover>
                                    <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Stack>
                                            <Typography variant="body2" fontWeight={700}>{log.actor_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{log.actor_role}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.action.replace(/_/g, ' ')}
                                            size="small"
                                            sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: colors.bg, color: colors.color, borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 350 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{log.details}</Typography>
                                        {log.old_value !== undefined && (
                                            <Typography variant="caption" color="text.secondary">
                                                {log.old_value} → {log.new_value}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontStyle: log.reason ? 'normal' : 'italic', color: log.reason ? 'text.primary' : 'text.disabled', fontSize: '0.8rem' }}>
                                            {log.reason || '—'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredLogs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                    <Typography color="text.secondary" fontWeight={500}>
                                        No audit records found. Actions will appear here automatically.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AuditLogs;
