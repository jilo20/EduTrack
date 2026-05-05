import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Fab, Paper, Typography, TextField, IconButton,
    Avatar, CircularProgress, Collapse
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const Chatbot = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your EduTrack AI Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const roleColor = user?.role === 'Student' ? '#16A34A' : '#2563EB';

    const formatMessage = (text) => {
        if (!text) return null;
        // Strip out the raw FETCH command so it doesn't look ugly if rendered
        const cleanText = text.replace(/\[FETCH:\s*(.+?)\]/g, '');
        if (!cleanText.trim()) return <em>Fetching data...</em>;

        const parts = cleanText.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const callBackendAI = async (apiMessages) => {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        const data = await response.json();
        console.log("Raw Backend Data:", data);
        return data.content ? data : { role: 'assistant', content: 'Sorry, I received an invalid response.', rawData: data };
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input.trim() };
        let currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            let isDone = false;

            while (!isDone) {
                // Backend injects the system prompt automatically
                const assistantMessage = await callBackendAI(currentMessages);

                currentMessages = [...currentMessages, assistantMessage];
                setMessages(currentMessages);

                const content = assistantMessage.content || '';
                const fetchMatch = content.match(/\[FETCH:\s*(.+?)\]/);

                if (fetchMatch) {
                    const url = fetchMatch[1].trim();
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                        const data = await res.json();
                        console.log(`Fetched Data from ${url}:`, data);
                        const toolMessage = { role: 'user', content: `[SYSTEM AUTO-REPLY - DATA FROM ${url}]: ${JSON.stringify(data)}. Please answer my original question now using this data.` };
                        currentMessages = [...currentMessages, toolMessage];
                        setMessages(currentMessages);
                    } catch (err) {
                        const toolMessage = { role: 'user', content: `[SYSTEM AUTO-REPLY - ERROR FETCHING ${url}]: ${err.message}. Please tell the user you couldn't access the data.` };
                        currentMessages = [...currentMessages, toolMessage];
                        setMessages(currentMessages);
                    }
                } else {
                    isDone = true;
                }
            }

        } catch (error) {
            console.error('Chatbot Error:', error);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to my servers right now.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <Fab
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    bgcolor: roleColor,
                    color: 'white',
                    '&:hover': { bgcolor: roleColor, filter: 'brightness(0.9)' },
                    zIndex: 1000,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}
            >
                {isOpen ? <CloseIcon /> : <SmartToyIcon />}
            </Fab>

            <Collapse in={isOpen} timeout="auto" unmountOnExit sx={{ position: 'fixed', bottom: 90, right: 24, zIndex: 1000 }}>
                <Paper
                    elevation={6}
                    sx={{
                        width: 350,
                        height: 500,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.2)'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ bgcolor: roleColor, color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                            <SmartToyIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                                EduTrack Assistant
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Always here to help
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ ml: 'auto', color: 'white' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {messages.filter(msg => msg.role !== 'system' && !msg.content.startsWith('[SYSTEM AUTO-REPLY')).map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    alignItems: 'flex-end',
                                    gap: 1
                                }}
                            >
                                <Avatar sx={{ width: 28, height: 28, bgcolor: msg.role === 'user' ? roleColor : 'white', color: msg.role === 'user' ? 'white' : roleColor, border: msg.role !== 'user' ? '1px solid #e2e8f0' : 'none' }}>
                                    {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 18 }} /> : <SmartToyIcon sx={{ fontSize: 18 }} />}
                                </Avatar>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '75%',
                                        bgcolor: msg.role === 'user' ? roleColor : 'white',
                                        color: msg.role === 'user' ? 'white' : 'text.primary',
                                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        border: msg.role !== 'user' ? '1px solid #e2e8f0' : 'none',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                                        {formatMessage(msg.content)}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'white', color: roleColor, border: '1px solid #e2e8f0' }}>
                                    <SmartToyIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px 16px 16px 4px' }}>
                                    <CircularProgress size={16} sx={{ color: roleColor }} />
                                </Paper>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{ p: 1.5, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Ask me anything..."
                            variant="outlined"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: '#f1f5f9',
                                    '& fieldset': { border: 'none' },
                                }
                            }}
                        />
                        <IconButton
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            sx={{
                                bgcolor: input.trim() && !isLoading ? roleColor : '#e2e8f0',
                                color: 'white',
                                '&:hover': { bgcolor: roleColor, filter: 'brightness(0.9)' },
                                '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#cbd5e1' }
                            }}
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Paper>
            </Collapse>
        </>
    );
};

export default Chatbot;
