import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Fade } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';
import TeacherManagement from './TeacherManagement';
import StudentManagement from './StudentManagement';
import InviteCenter from './InviteCenter';

const UserManager = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ p: 4, pb: 0, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-1.5px', color: '#1e293b', mb: 1 }}>
                    User Management
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 3 }}>
                    Oversee all institutional accounts, faculty access, and registration keys.
                </Typography>
                
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ 
                        '& .MuiTab-root': { 
                            fontWeight: 700, 
                            textTransform: 'none', 
                            fontSize: '1rem',
                            minWidth: 160,
                            minHeight: 60,
                            color: '#64748b',
                            '&.Mui-selected': {
                                color: '#2563eb',
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '3px 3px 0 0',
                            bgcolor: '#2563eb'
                        }
                    }}
                >
                    <Tab icon={<PeopleIcon sx={{ mb: 0.5 }} />} iconPosition="start" label="Manage Students" />
                    <Tab icon={<SchoolIcon sx={{ mb: 0.5 }} />} iconPosition="start" label="Manage Teachers" />
                    <Tab icon={<BadgeIcon sx={{ mb: 0.5 }} />} iconPosition="start" label="Registration Invites" />
                </Tabs>
            </Box>

            <Box sx={{ p: 4 }}>
                {tabValue === 0 && (
                    <Fade in={tabValue === 0}>
                        <Box><StudentManagement /></Box>
                    </Fade>
                )}
                {tabValue === 1 && (
                    <Fade in={tabValue === 1}>
                        <Box><TeacherManagement /></Box>
                    </Fade>
                )}
                {tabValue === 2 && (
                    <Fade in={tabValue === 2}>
                        <Box><InviteCenter /></Box>
                    </Fade>
                )}
            </Box>
        </Box>
    );
};

export default UserManager;
