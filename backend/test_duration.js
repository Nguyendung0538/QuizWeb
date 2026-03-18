const db = require('./config/db');

async function test() {
    try {
        const id = 'TEST_DUR_' + Date.now();
        await db.query(`
            INSERT INTO exams (id, title, type, duration, status, is_permanent) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [id, "Test Duration", "quiz", 45, "active", 1]
        );
        console.log("Inserted exam with duration 45");
        
        const [rows] = await db.query('SELECT duration FROM exams WHERE id = ?', [id]);
        console.log("Fetched duration:", rows[0].duration);
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
