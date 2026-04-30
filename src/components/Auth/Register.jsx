import React, { useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert, CircularProgress, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Register = () => {
    const navigate = useNavigate();
    
    // Step 1 State
    const [idNumber, setIdNumber] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [assignedRole, setAssignedRole] = useState('');
    
    // Step 2 State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [registering, setRegistering] = useState(false);
    
    // Global State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVerifyId = async () => {
        setError('');
        if (!idNumber.trim()) {
            setError('Please enter your provided ID number.');
            return;
        }

        setVerifying(true);
        try {
            const response = await fetch('/api/verify-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_number: idNumber }),
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setIsVerified(true);
                setAssignedRole(data.role);
                setSuccess(`ID Verified! You are registering as a ${data.role}.`);
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError(data.error || 'Invalid ID Number.');
            }
        } catch (err) {
            setError('Unable to verify ID. Check your connection.');
        } finally {
            setVerifying(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        setError('');
        
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all account details.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be at least 8 characters and include an uppercase letter, a number, and a special character.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setRegistering(true);
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id_number: idNumber,
                    ...formData 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Account created successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.error || 'Registration failed.');
            }
        } catch (err) {
            setError('Check your connection and try again.');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', position: 'relative', overflow: 'hidden'
        }}>
            <Paper elevation={12} sx={{
                width: '100%', maxWidth: 480, mx: 2, p: { xs: 4, sm: 5 },
                borderRadius: 4, position: 'relative', zIndex: 1,
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
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px'
                    }}>
                        EduTrack
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Create your account to get started
                    </Typography>
                </Box>

                <Stack spacing={2.5}>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

                    {/* Step 1: ID Verification */}
                    <Box sx={{ 
                        opacity: isVerified ? 0.7 : 1, 
                        pointerEvents: isVerified ? 'none' : 'auto',
                        transition: 'opacity 0.3s ease'
                    }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1, ml: 0.5 }}>
                            STEP 1: IDENTITY VERIFICATION
                        </Typography>
                        <TextField
                            label="Your Registration ID Number"
                            variant="outlined"
                            fullWidth
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            disabled={isVerified}
                            InputProps={{
                                startAdornment: <BadgeIcon color="action" sx={{ mr: 1 }} />,
                                endAdornment: isVerified && <CheckCircleOutlineIcon color="success" />
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        {!isVerified && (
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleVerifyId}
                                disabled={verifying || !idNumber}
                                sx={{ mt: 2, py: 1.5, borderRadius: 2, fontWeight: 700 }}
                            >
                                {verifying ? <CircularProgress size={24} color="inherit" /> : 'Verify ID'}
                            </Button>
                        )}
                    </Box>

                    {/* Step 2: Account Details */}
                    {isVerified && (
                        <Fade in={isVerified}>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1, ml: 0.5 }}>
                                    STEP 2: ACCOUNT DETAILS
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Full Name"
                                        name="name"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.name}
                                        onChange={handleChange}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                    <TextField
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.email}
                                        onChange={handleChange}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                    <TextField
                                        label="Create Password"
                                        name="password"
                                        type="password"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.password}
                                        onChange={handleChange}
                                        helperText="Min 8 chars, 1 uppercase, 1 number, 1 special char."
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                    <TextField
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        type="password"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        onClick={handleRegister}
                                        disabled={registering}
                                        sx={{
                                            py: 1.5, bgcolor: '#059669', fontWeight: '800',
                                            borderRadius: 2, boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
                                            '&:hover': { bgcolor: '#047857' }, mt: 1
                                        }}
                                    >
                                        {registering ? <CircularProgress size={24} color="inherit" /> : `Complete ${assignedRole} Registration`}
                                    </Button>
                                </Stack>
                            </Box>
                        </Fade>
                    )}

                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Already have an account?{' '}
                        <Box component="span"
                            onClick={() => navigate('/login')}
                            sx={{ color: '#2563EB', cursor: 'pointer', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Sign In
                        </Box>
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
};

export default Register;
