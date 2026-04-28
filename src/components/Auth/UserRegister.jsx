import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert, MenuItem, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

const UserRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) navigate('/dashboard', { replace: true });
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        setError('');
        setSuccess('');
        if (Object.values(formData).some(val => !val.trim())) {
            setError('Please fill in all fields.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess('Account created! Redirecting to login...');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setError(data.error || 'Registration failed.');
            }
        } catch (err) {
            setError('Unable to connect. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Box sx={{
                position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)',
                top: -100, left: -100,
            }} />

            <Paper elevation={24} sx={{
                width: '100%', maxWidth: 440, mx: 2, p: { xs: 4, sm: 5 },
                borderRadius: 4, background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1,
            }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 3, bgcolor: '#16A34A10', mb: 2 }}>
                        <SchoolIcon sx={{ fontSize: 40, color: '#16A34A' }} />
                    </Box>
                    <Typography variant="h4" fontWeight="800" sx={{
                        background: 'linear-gradient(135deg, #2563EB, #16A34A)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        Join EduTrack
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Create your account to start managing your academic journey
                    </Typography>
                </Box>

                <Stack spacing={2.5}>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}
                    <TextField id="register-name" label="Full Name" name="name" fullWidth value={formData.name} onChange={handleChange} />
                    <TextField id="register-email" label="Email Address" name="email" fullWidth value={formData.email} onChange={handleChange} />
                    <TextField id="register-password" label="Password" name="password" type="password" fullWidth value={formData.password} onChange={handleChange} helperText="Minimum 6 characters" />
                    <TextField id="register-role" select label="I am a..." name="role" fullWidth value={formData.role} onChange={handleChange}>
                        <MenuItem value="Student">Student</MenuItem>
                        <MenuItem value="Teacher">Teacher</MenuItem>
                    </TextField>
                    <Button
                        id="register-submit"
                        variant="contained" size="large" fullWidth onClick={handleRegister} disabled={loading}
                        sx={{
                            py: 1.5, bgcolor: '#16A34A', fontWeight: 'bold', fontSize: '1rem',
                            borderRadius: 2, boxShadow: '0 4px 14px rgba(22,163,74,0.4)',
                            '&:hover': { bgcolor: '#15803d' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                    </Button>
                    <Button variant="text" onClick={() => navigate('/')} sx={{ color: 'text.secondary', fontWeight: '600' }}>
                        Already have an account? Sign In
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default UserRegister;
