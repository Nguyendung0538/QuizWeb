const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('SELECT id, title, duration FROM exams');
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Title: ${row.title}, Duration: ${row.duration}`);
        });
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
