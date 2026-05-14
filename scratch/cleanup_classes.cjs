const fs = require('fs');
const path = '/home/jilo/Documents/GroupAllianceProject/EduTrack/server/database.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

// Keep only sections 11073 and 11045
db.sections = db.sections.filter(s => s.code_name === '11073' || s.code_name === '11045');

// Get the valid section IDs
const validSectionIds = db.sections.map(s => s.id);

// Keep only enrollments for these sections
db.enrollments = db.enrollments.filter(e => validSectionIds.includes(e.section_id));

fs.writeFileSync(path, JSON.stringify(db, null, 4));
console.log("Reverted to only classes 11073 and 11045.");
