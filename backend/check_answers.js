const db = require('./config/db');

async function check() {
    try {
        const [subs] = await db.query('SELECT * FROM submissions ORDER BY id DESC LIMIT 1');
        console.log("Latest Submission:", subs[0]);
        
        if (subs[0]) {
            const [answers] = await db.query('SELECT * FROM submission_answers WHERE submission_id = ?', [subs[0].id]);
            console.log("Answers for this submission:");
            console.table(answers);
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
