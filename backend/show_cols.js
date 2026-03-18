const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('SHOW COLUMNS FROM submissions');
        rows.forEach(row => console.log(row.Field));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
