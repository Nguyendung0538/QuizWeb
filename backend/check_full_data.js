const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('SELECT * FROM submissions ORDER BY id DESC LIMIT 5');
        console.log("Submissions (last 5):");
        console.log(JSON.stringify(rows, null, 2));

        const [answers] = await db.query('SELECT * FROM submission_answers ORDER BY id DESC LIMIT 5');
        console.log("Submission Answers (last 5):");
        console.log(JSON.stringify(answers, null, 2));
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
