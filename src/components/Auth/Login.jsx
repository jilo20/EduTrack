import React, { useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) navigate('/dashboard', { replace: true });
    }, [navigate]);

    const handleSignIn = async () => {
        setError('');
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('token', data.token);
                navigate('/dashboard', { replace: true });
            } else {
                setError(data.error || 'Login failed.');
            }
        } catch (err) {
            setError('Unable to connect to the server. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSignIn();
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
            {/* Decorative background elements */}
            <Box sx={{
                position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                top: -100, right: -100,
            }} />
            <Box sx={{
                position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)',
                bottom: -50, left: -50,
            }} />

            <Paper elevation={24} sx={{
                width: '100%',
                maxWidth: 440,
                mx: 2,
                p: { xs: 4, sm: 5 },
                borderRadius: 4,
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 1,
            }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        display: 'inline-flex', p: 1.5, borderRadius: 3,
                        bgcolor: '#2563EB10', mb: 2
                    }}>
                        <SchoolIcon sx={{ fontSize: 40, color: '#2563EB' }} />
                    </Box>
                    <Typography variant="h4" fontWeight="800" sx={{
                        background: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        EduTrack
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Student Performance Management System
                    </Typography>
                </Box>

                <Stack spacing={2.5}>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                    <TextField
                        id="login-email"
                        label="Email Address"
                        variant="outlined"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyPress}
                        autoComplete="email"
                    />
                    <TextField
                        id="login-password"
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyPress}
                        autoComplete="current-password"
                    />
                    <Button
                        id="login-submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleSignIn}
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            bgcolor: '#2563EB',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            borderRadius: 2,
                            boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                            '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 6px 20px rgba(37,99,235,0.5)' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Don't have an account?{' '}
                        <Box component="span"
                            onClick={() => navigate('/register')}
                            sx={{ color: '#2563EB', cursor: 'pointer', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Sign Up
                        </Box>
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
};

export default Login;
