import React, { useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import bg from '../../assets/bglogin.png';
import loginhero from '../../assets/loginhero.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        schoolName: '',
        adminName: '',
        email: '',
        password: '',
        courseProgram: '',
        yearLevel: '',
        offerCode: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        setError('');
        setSuccess('');

        // Validation: courseProgram is optional, others required
        const { courseProgram, ...requiredFields } = formData;
        if (Object.values(requiredFields).some(val => !val.trim())) {
            setError('Please fill in all required fields (Year Level and Offer Code are mandatory)');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/register-school', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`School Registered! Your portal is at /${formData.schoolName.toLowerCase().replace(/\s+/g, '-')}/login`);
                setTimeout(() => {
                    navigate(`/${formData.schoolName.toLowerCase().replace(/\s+/g, '-')}/login`);
                }, 3000);
            } else {
                setError(data.error || 'Registration failed.');
            }
        } catch (err) {
            setError('Check your connection and try again.');
        }
    };

    return (
        <Box width={'100vw'} sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <Paper elevation={10} sx={{
                width: '70%', height: '95vh', borderRadius: 5, mt: 3, mb: 3,
                overflow: 'hidden', display: 'flex', minWidth: '600px',
            }}>
                <Box sx={{
                    height: '100%', width: '100%', p: 6,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="700" color="#2563EB" gutterBottom>
                            EduTrack
                        </Typography>
                        <Typography variant="h5" fontWeight="600" color="text.primary">
                            Register your School
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create a professional multi-tenant hub for your students and teachers
                        </Typography>
                    </Box>

                    <Stack spacing={2} sx={{ maxWidth: '600px', mx: 'auto', width: '100%' }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}
                        
                        <TextField
                            label="School Name"
                            name="schoolName"
                            variant="outlined"
                            fullWidth
                            size="small"
                            value={formData.schoolName}
                            onChange={handleChange}
                        />
                        
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Admin Full Name"
                                name="adminName"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={formData.adminName}
                                onChange={handleChange}
                            />
                            <TextField
                                label="Contact Email"
                                name="email"
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Stack>

                        <TextField
                            label="Setup Admin Password"
                            name="password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            size="small"
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <Box sx={{ pt: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
                                INITIAL CLASS SETUP
                            </Typography>
                            <TextField
                                label="Course / Program (Optional)"
                                name="courseProgram"
                                variant="outlined"
                                fullWidth
                                size="small"
                                placeholder="e.g. BS in Information Technology"
                                value={formData.courseProgram}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Grade / Year Level"
                                    name="yearLevel"
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    placeholder="e.g. 1st Year"
                                    value={formData.yearLevel}
                                    onChange={handleChange}
                                />
                                <TextField
                                    label="Section / Offer Code"
                                    name="offerCode"
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    placeholder="e.g. IT101A"
                                    value={formData.offerCode}
                                    onChange={handleChange}
                                />
                            </Stack>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handleRegister}
                            sx={{
                                py: 1.5, mt: 1, bgcolor: '#2563EB', fontWeight: 'bold',
                                '&:hover': { bgcolor: '#1d4ed8' }
                            }}
                        >
                            Create My School
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
};

export default Register;
