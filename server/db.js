import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

const DEFAULT_DB = {
    schools: [],
    users: [{ id: 1, school_id: 1, email: 'admin@edutrack.com', password: 'admin', role: 'Admin', name: 'System Admin' }],
    grades: [],
    sections: [],
    enrollments: [],
    assessments: [],
    scores: [],
    subjects: [],
    attendance: [],
    audit_logs: [],
    announcements: [],
    notifications: [],
    performance_records: []
};

// Initialize if missing
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 4));
}

const loadDB = () => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        // Dynamic repair of missing keys
        Object.keys(DEFAULT_DB).forEach(key => {
            if (!data[key]) data[key] = [];
        });
        return data;
    } catch (e) {
        return DEFAULT_DB;
    }
};

const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4));

// Simple password hashing for demo (SHA-256 based)
export const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password + 'edutrack_salt_2026').digest('hex');
};

export const comparePassword = (plaintext, hashed) => {
    // Support both hashed and legacy plaintext passwords
    if (hashed.length === 64) {
        return hashPassword(plaintext) === hashed;
    }
    // Fallback: plaintext comparison for legacy data
    return plaintext === hashed;
};

// Simple token generation (base64 encoded JSON with expiry)
export const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        exp: Date.now() + (30 * 60 * 1000) // 30 minutes
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const verifyToken = (token) => {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        if (payload.exp < Date.now()) return null;
        return payload;
    } catch (e) {
        return null;
    }
};

export const db = {
    get schools() { return loadDB().schools || []; },
    get users() { return loadDB().users || []; },
    get grades() { return loadDB().grades || []; },
    get sections() { return loadDB().sections || []; },
    get enrollments() { return loadDB().enrollments || []; },
    get assessments() { return loadDB().assessments || []; },
    get scores() { return loadDB().scores || []; },
    get subjects() { return loadDB().subjects || []; },
    get attendance() { return loadDB().attendance || []; },
    get audit_logs() { return loadDB().audit_logs || []; },
    get announcements() { return loadDB().announcements || []; },
    get notifications() { return loadDB().notifications || []; },

    push: (table, item) => {
        const data = loadDB();
        if (!data[table]) data[table] = [];
        data[table].push(item);
        saveDB(data);
        return item;
    },
    update: (table, id, updates) => {
        const data = loadDB();
        const idx = (data[table] || []).findIndex(i => i.id === id);
        if (idx !== -1) {
            data[table][idx] = { ...data[table][idx], ...updates };
            saveDB(data);
            return data[table][idx];
        }
        return null;
    },
    deleteRecord: (table, id) => {
        const data = loadDB();
        const idx = (data[table] || []).findIndex(i => i.id === id);
        if (idx !== -1) {
            const removed = data[table].splice(idx, 1);
            saveDB(data);
            return removed[0];
        }
        return null;
    },
    upsertScore: (assessmentId, studentId, score) => {
        const data = loadDB();
        if (!data.scores) data.scores = [];
        const idx = data.scores.findIndex(s => s.assessment_id === assessmentId && s.student_id === studentId);
        if (idx !== -1) {
            const oldScore = data.scores[idx].score;
            data.scores[idx].score = score;
            data.scores[idx].status = 'Graded';
            saveDB(data);
            return { oldScore, isUpdate: true };
        } else {
            data.scores.push({
                id: data.scores.length + 1,
                assessment_id: assessmentId,
                student_id: studentId,
                score,
                status: 'Graded'
            });
            saveDB(data);
            return { oldScore: null, isUpdate: false };
        }
    },
    auditLog: (action, userId, details = {}) => {
        const data = loadDB();
        if (!data.audit_logs) data.audit_logs = [];
        const user = (data.users || []).find(u => u.id === userId);
        const entry = {
            id: data.audit_logs.length + 1,
            timestamp: new Date().toISOString(),
            action,
            actor_id: userId,
            actor_name: user?.name || 'Unknown',
            actor_role: user?.role || 'Unknown',
            ...details
        };
        data.audit_logs.push(entry);
        saveDB(data);
        return entry;
    },
    getNextId: (table) => {
        const data = loadDB();
        const items = data[table] || [];
        return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    }
};
