import fs from 'fs';
import path from 'path';

const dbPath = './server/database.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Starting data migration...');

// 1. Process Users
const year = new Date().getFullYear();
const usedIds = new Set();

db.users.forEach(user => {
    if (user.role === 'Admin') return;

    let idNum = user.id_number || '';
    
    if (idNum.includes('-')) {
        idNum = idNum.replace('-', '');
    }

    if (!idNum) {
        // Generate a new one if missing
        let newId;
        do {
            const random = Math.floor(100000 + Math.random() * 900000);
            newId = `${year}${random}`;
        } while (usedIds.has(newId));
        idNum = newId;
    }

    user.id_number = idNum;
    usedIds.add(idNum);
});

// 2. Sync Registered IDs
// We'll rebuild this list based on current users to show "Mock History"
db.registered_ids = [];
let nextInviteId = 1;

db.users.forEach(user => {
    if (user.role === 'Admin') return;

    db.registered_ids.push({
        id: nextInviteId++,
        id_number: user.id_number,
        role: user.role,
        is_used: true,
        used_by_email: user.email,
        created_at: new Date(Date.now() - Math.random() * 1000000000).toISOString(), // Random past date
        created_by: 1
    });
});

// Add a few unused ones for variety
for (let i = 0; i < 5; i++) {
    let newId;
    do {
        const random = Math.floor(100000 + Math.random() * 900000);
        newId = `${year}${random}`;
    } while (usedIds.has(newId));
    
    db.registered_ids.push({
        id: nextInviteId++,
        id_number: newId,
        role: Math.random() > 0.2 ? 'Student' : 'Teacher',
        is_used: false,
        used_by_email: null,
        created_at: new Date().toISOString(),
        created_by: 1
    });
    usedIds.add(newId);
}

// 3. Clean up Audit Logs (optional but nice)
db.audit_logs.forEach(log => {
    if (log.details && log.details.includes('2026-')) {
        log.details = log.details.replace('2026-', '2026');
    }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
console.log('Migration complete. Database updated.');
