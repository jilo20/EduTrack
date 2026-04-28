import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import studentsRouter from './routes/students.js';
import miscRouter from './routes/misc.js';
import analyticsRouter from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Restrict CORS to dev server
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.method !== 'GET' || res.statusCode >= 400) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});

// Simple rate limiter (in-memory)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (record && now - record.windowStart < RATE_LIMIT_WINDOW) {
        record.count++;
        if (record.count > RATE_LIMIT_MAX) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
    } else {
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
    }
    next();
});

// Main API Routes
app.use('/api', authRouter);
app.use('/api/student', studentsRouter);
app.use('/api', miscRouter);
app.use('/api/analytics', analyticsRouter);

app.listen(PORT, () => {
    console.log(`EduTrack API running on http://localhost:${PORT}`);
});
