import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
                    <Paper elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center', maxWidth: 480 }}>
                        <ErrorOutlineIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
                        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
                            Something went wrong
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            An unexpected error occurred. You can try refreshing the page or logging in again.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button variant="outlined" onClick={this.handleReset} sx={{ fontWeight: 700, borderRadius: 2 }}>
                                Try Again
                            </Button>
                            <Button variant="contained" color="error" onClick={this.handleLogout} sx={{ fontWeight: 700, borderRadius: 2 }}>
                                Back to Login
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
