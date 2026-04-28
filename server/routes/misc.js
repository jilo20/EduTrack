import express from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';

const router = express.Router();

router.get('/status', (req, res) => res.json({ message: 'EduTrack API Connected', version: '2.0.0' }));

router.get('/notifications/user/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userNotifications = (db.notifications || []).filter(n => n.user_id === userId);
    res.json(userNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

router.post('/notifications/:id/read', (req, res) => {
    const id = parseInt(req.params.id);
    const updated = db.update('notifications', id, { status: 'read' });
    if (updated) {
        res.json({ message: 'Marked as read' });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

router.post('/notifications/mark-all-read/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'server', 'database.json'), 'utf-8'));
    data.notifications = (data.notifications || []).map(n => 
        n.user_id === userId ? { ...n, status: 'read' } : n
    );
    fs.writeFileSync(path.join(process.cwd(), 'server', 'database.json'), JSON.stringify(data, null, 4));
    res.json({ message: 'Marked all as read' });
});

router.post('/notifications/clear-all/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    // Since we don't have a bulk delete in db.js, we do it manually and save
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'server', 'database.json'), 'utf-8'));
    data.notifications = (data.notifications || []).filter(n => n.user_id !== userId);
    fs.writeFileSync(path.join(process.cwd(), 'server', 'database.json'), JSON.stringify(data, null, 4));
    res.json({ message: 'Cleared all' });
});

router.get('/announcements', (req, res) => {
    const announcements = (db.announcements || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(announcements);
});

router.post('/announcements', (req, res) => {
    const { title, content, priority, schoolId, userId, target } = req.body;
    const newAnnouncement = {
        id: db.getNextId('announcements'),
        school_id: schoolId || 1,
        title,
        content,
        priority: priority || 'normal',
        target: target || 'all',
        date: new Date().toISOString().split('T')[0]
    };
    db.push('announcements', newAnnouncement);
    
    // Create notifications for selected target
    let userFilter = [];
    if (target === 'teachers') userFilter = ['Teacher'];
    else if (target === 'students') userFilter = ['Student'];
    else userFilter = ['Teacher', 'Student'];

    const users = db.users.filter(u => userFilter.includes(u.role));
    users.forEach(u => {
        db.push('notifications', {
            id: db.getNextId('notifications'),
            user_id: u.id,
            title: `Announcement: ${title}`,
            message: content,
            type: 'announcement',
            status: 'unread',
            created_at: new Date().toISOString()
        });
    });

    db.auditLog('BROADCAST_ANNOUNCEMENT', userId || 1, { title, target });
    res.json(newAnnouncement);
});

export default router;
