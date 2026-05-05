import fs from 'fs';
const content = fs.readFileSync('/home/jilo/Documents/GroupAllianceProject/EduTrack/src/components/Teacher/AttendanceManager.jsx', 'utf8');

const openTags = [];
const tagRegex = /<(\/?[a-zA-Z0-9]+)/g;
let match;

while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1];
    if (tag.startsWith('/')) {
        const closingTag = tag.substring(1);
        const lastOpening = openTags.pop();
        if (lastOpening !== closingTag) {
            console.log(`Mismatch: expected ${lastOpening}, found ${closingTag}`);
        }
    } else {
        // Simple heuristic: ignore self-closing tags if we can detect them easily
        // But the regex doesn't handle /> well.
        // Let's just push and see.
        openTags.push(tag);
    }
}

console.log(`Remaining open tags: ${openTags.join(', ')}`);
