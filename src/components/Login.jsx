import React from 'react';
import { Box, Container, Paper, Typography, Stack, TextField, Button } from '@mui/material';
import bg from '../assets/bglogin.png';
import loginhero from '../assets/loginhero.png';

const Login = () => {
  return (
    <Box
      width={'100vw'}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
      }}>

      <Paper
        elevation={10}
        sx={{
          width: '70%',
          height: '70vh',
          borderRadius: 5,
          mt: 10,
          overflow: 'hidden',
          display: 'flex',
          minWidth: '600px',
        }}>

        <Box
          sx={{
            height: '100%',
            width: '50%',
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="700" color="primary" gutterBottom>
              EduTrack
            </Typography>
            <Typography variant="h5" fontWeight="600" color="text.primary">
              Welcome back!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login to access your dashboard
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              placeholder="e.g. jilo@example.com"
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
            />
            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{
                py: 1.5,
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
              }}
            >
              Sign In
            </Button>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Don't have an account?{' '}
              <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 'bold' }}>
                Join now
              </Box>
            </Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            height: '100%',
            width: '50%',
            position: 'relative',
          }}>
          <Box
            sx={{
              bgcolor: 'primary.main',
              height: '100%',
              width: '80%',
              position: 'absolute',
              zIndex: 1,
              right: 0,
            }}
          />
          <Box
            sx={{
              backgroundImage: `url(${loginhero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              width: '100%',
              position: 'absolute',
              zIndex: 3,
              right: 0,
            }}
          />
        </Box>
      </Paper>

      <Box
        sx={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '100vh',
          width: '100%',
          position: 'absolute',
          zIndex: -2,
          opacity: '0.1',
        }}
      />
    </Box>
  );
};

export default Login;
