const fs = require('fs');
const path = '/home/jilo/Documents/GroupAllianceProject/EduTrack/server/database.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

// Start from highest ID
let maxId = Math.max(...db.sections.map(s => s.id), 0);

for (let i = 1; i <= 50; i++) {
    const newId = ++maxId;
    db.sections.push({
        id: newId,
        school_id: 1,
        teacher_id: (i % 5) + 1, // Cycle through teachers
        grade_id: (i % 6) + 1,
        code_name: `CL-${1000 + i}`,
        course_program: `Program ${String.fromCharCode(65 + (i % 26))}`,
        schedule: i % 2 === 0 ? 'MWF' : 'TTH'
    });

    // Add some random enrollments for these classes
    const studentCount = Math.floor(Math.random() * 30) + 5;
    for (let j = 0; j < studentCount; j++) {
        db.enrollments.push({
            id: db.enrollments.length + 1,
            section_id: newId,
            student_id: (j % 20) + 1 // Cycle through students
        });
    }
}

fs.writeFileSync(path, JSON.stringify(db, null, 4));
console.log("Added 50 mock classes and enrollments.");
