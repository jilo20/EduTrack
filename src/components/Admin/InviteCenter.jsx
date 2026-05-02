import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Stack,
    Button, Avatar, Chip, IconButton, Snackbar, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem, Fade, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, Divider, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const InviteCenter = () => {
    const [invites, setInvites] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [inviteRole, setInviteRole] = useState('Student');
    const [generatedId, setGeneratedId] = useState(null);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    
    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchInvites = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/invites', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInvites(Array.isArray(data) ? data : []);
            }
        } catch (err) { console.error('Invites fetch failed', err); }
    };


    useEffect(() => {
        fetchInvites();
    }, []);

    const handleGenerateInvite = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/invite', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: inviteRole })
            });
            const data = await res.json();
            
            if (res.ok) {
                setGeneratedId(data.invite.id_number);
                setSnackbar({ open: true, message: 'Invite ID generated successfully.', severity: 'success' });
                fetchInvites();
            } else {
                setSnackbar({ open: true, message: data.error || 'Failed to generate invite.', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Network error.', severity: 'error' });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSnackbar({ open: true, message: 'Copied to clipboard!', severity: 'info' });
    };

    const handleOpenDetail = (invite) => {
        setSelectedInvite(invite);
        setDetailOpen(true);
    };

    const filteredInvites = (invites || []).filter(invite => {
        const matchesSearch = 
            (invite?.id_number || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
            (invite?.used_by_email && invite.used_by_email.toLowerCase().includes((searchQuery || '').toLowerCase()));
        
        const matchesStatus = 
            statusFilter === 'all' || 
            (statusFilter === 'used' && invite?.is_used) || 
            (statusFilter === 'unused' && !invite?.is_used);
            
        const matchesRole = 
            roleFilter === 'all' || invite?.role === roleFilter;

        return matchesSearch && matchesStatus && matchesRole;
    });


    return (
        <Box sx={{ p: 0, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Grid container spacing={4}>
                {/* LEFT: Generation Panel */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={3}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 3, bgcolor: 'white' }}>
                            <Typography variant="h6" fontWeight={900} gutterBottom sx={{ color: '#1e293b' }}>Generate New Key</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>Create an authorization code for institutional access.</Typography>
                            <Stack spacing={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>Select Role</InputLabel>
                                    <Select value={inviteRole} label="Select Role" onChange={(e) => setInviteRole(e.target.value)} sx={{ borderRadius: 2.5, fontWeight: 600 }}>
                                        <MenuItem value="Student" sx={{ fontWeight: 600 }}>Student Access</MenuItem>
                                        <MenuItem value="Teacher" sx={{ fontWeight: 600 }}>Faculty / Teacher</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button 
                                    variant="contained" 
                                    fullWidth 
                                    startIcon={<BadgeIcon />}
                                    onClick={handleGenerateInvite}
                                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2.5, boxShadow: '0 8px 20px -6px rgba(37,99,235,0.4)' }}
                                >
                                    Generate Code
                                </Button>
                            </Stack>
                        </Card>

                        {generatedId && (
                            <Fade in={Boolean(generatedId)}>
                                <Card elevation={0} sx={{ border: '1px solid', borderColor: '#3b82f6', borderRadius: 4, p: 3, bgcolor: '#eff6ff', textAlign: 'center' }}>
                                    <Typography variant="caption" fontWeight={900} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>Active Key Generated</Typography>
                                    <Typography variant="h3" fontWeight={900} sx={{ my: 1.5, fontFamily: 'monospace', letterSpacing: 4, color: '#1e3a8a' }}>{generatedId}</Typography>
                                    <Button 
                                        variant="outlined" 
                                        size="small"
                                        startIcon={<ContentCopyIcon />}
                                        onClick={() => copyToClipboard(generatedId)}
                                        sx={{ borderRadius: 2, fontWeight: 700, bgcolor: 'white' }}
                                    >
                                        Copy Code
                                    </Button>
                                </Card>
                            </Fade>
                        )}
                    </Stack>
                </Grid>

                {/* RIGHT: History & Filtering */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'white', overflow: 'hidden' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#ffffff' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="h6" fontWeight={900} sx={{ color: '#1e293b' }}>History & Authorization Log</Typography>
                                <Stack direction="row" spacing={1}>
                                    <Chip label={`${filteredInvites.length} Results`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#64748b' }} />
                                </Stack>
                            </Stack>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField 
                                        fullWidth 
                                        size="small"
                                        placeholder="Search by ID or email..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        InputProps={{ 
                                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
                                            sx: { borderRadius: 3, bgcolor: '#f8fafc' }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <FormControl fullWidth size="small">
                                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 3, bgcolor: '#f8fafc', fontWeight: 600 }}>
                                            <MenuItem value="all" sx={{ fontWeight: 600 }}>All Statuses</MenuItem>
                                            <MenuItem value="unused" sx={{ fontWeight: 600 }}>Available</MenuItem>
                                            <MenuItem value="used" sx={{ fontWeight: 600 }}>Used</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <FormControl fullWidth size="small">
                                        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ borderRadius: 3, bgcolor: '#f8fafc', fontWeight: 600 }}>
                                            <MenuItem value="all" sx={{ fontWeight: 600 }}>All Roles</MenuItem>
                                            <MenuItem value="Student" sx={{ fontWeight: 600 }}>Students</MenuItem>
                                            <MenuItem value="Teacher" sx={{ fontWeight: 600 }}>Teachers</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>

                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>ID Number</TableCell>
                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Registered To</TableCell>
                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Created</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredInvites.map((invite) => (
                                        <TableRow key={invite.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={900} sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>{invite.id_number}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={invite.role} 
                                                    size="small" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        fontSize: '0.7rem',
                                                        bgcolor: invite.role === 'Teacher' ? '#ede9fe' : '#e0f2fe',
                                                        color: invite.role === 'Teacher' ? '#7c3aed' : '#0369a1'
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={invite.is_used ? 'USED' : 'AVAILABLE'} 
                                                    size="small"
                                                    sx={{ 
                                                        fontWeight: 900, 
                                                        fontSize: '0.65rem',
                                                        px: 1,
                                                        bgcolor: invite.is_used ? '#f1f5f9' : '#dcfce7',
                                                        color: invite.is_used ? '#64748b' : '#15803d'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontWeight={700} sx={{ color: invite.is_used ? '#1e293b' : '#94a3b8' }}>
                                                    {invite.used_by_email || '— Pending —'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(invite.created_at).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <IconButton size="small" onClick={() => copyToClipboard(invite.id_number)}>
                                                        <ContentCopyIcon fontSize="small" sx={{ color: '#64748b' }} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleOpenDetail(invite)}>
                                                        <MoreVertIcon fontSize="small" sx={{ color: '#64748b' }} />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredInvites.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={600}>No invites match your current filters.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>

            {/* Invite Detail Dialog */}
            <Dialog 
                open={detailOpen} 
                onClose={() => setDetailOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', position: 'relative' }}>
                        <IconButton 
                            onClick={() => setDetailOpen(false)}
                            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                        <Stack spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            <Avatar sx={{ width: 64, height: 64, bgcolor: '#64748b', mb: 1 }}>
                                <BadgeIcon sx={{ fontSize: '2rem' }} />
                            </Avatar>
                            <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>{selectedInvite?.id_number}</Typography>
                            <Chip 
                                label={selectedInvite?.is_used ? 'Registered Key' : 'Active Authorization Key'} 
                                size="small" 
                                sx={{ fontWeight: 800, bgcolor: selectedInvite?.is_used ? '#f1f5f9' : '#eff6ff', color: selectedInvite?.is_used ? '#64748b' : '#2563eb' }} 
                            />
                        </Stack>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Key Properties</Typography>
                            <List sx={{ mt: 1 }}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><SchoolIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800}>{selectedInvite?.role}</Typography>} 
                                        secondary="Assigned Access Role" 
                                    />
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><EventAvailableIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800}>{new Date(selectedInvite?.created_at).toLocaleString()}</Typography>} 
                                        secondary="Generation Timestamp" 
                                    />
                                </ListItem>
                            </List>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Usage Audit</Typography>
                            <List sx={{ mt: 1 }}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}><EmailIcon sx={{ color: selectedInvite?.is_used ? '#16a34a' : '#64748b' }} /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={800} color={selectedInvite?.is_used ? 'text.primary' : 'text.secondary'}>{selectedInvite?.used_by_email || 'Not yet redeemed'}</Typography>} 
                                        secondary="Registered Account" 
                                    />
                                </ListItem>
                                {selectedInvite?.is_used && (
                                    <ListItem sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}><HistoryIcon sx={{ color: '#16a34a' }} /></ListItemIcon>
                                        <ListItemText 
                                            primary={<Typography variant="body2" fontWeight={800}>Redeemed Successfully</Typography>} 
                                            secondary="This key is no longer valid for new registrations." 
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Box>
                    </Stack>
                </DialogContent>
                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button fullWidth variant="outlined" onClick={() => setDetailOpen(false)} sx={{ fontWeight: 800, borderRadius: 2 }}>
                        Close Information
                    </Button>
                </Box>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 3, fontWeight: 700, width: '100%', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default InviteCenter;
