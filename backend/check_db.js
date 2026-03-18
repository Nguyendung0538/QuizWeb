const db = require('./config/db');

async function check() {
    try {
        const [exams] = await db.query('SELECT id, title, status, start_time, end_time FROM exams');
        console.log("Current Exams in DB:");
        console.log(JSON.stringify(exams, null, 2));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
