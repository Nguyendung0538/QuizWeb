const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('DESCRIBE submissions');
        console.table(rows);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
