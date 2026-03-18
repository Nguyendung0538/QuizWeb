async function run() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@ptit.edu.vn', password: 'password' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        console.log("Fetching /api/exams...");
        const examsRes = await fetch('http://localhost:8080/api/exams', {
            headers: { 'x-auth-token': token }
        });
        const examsList = await examsRes.json();
        
        if (examsList.length > 0) {
            const firstId = examsList[0].id;
            console.log(`Testing /api/exams/${firstId}/start...`);
            const startRes = await fetch(`http://localhost:8080/api/exams/${firstId}/start`, {
                headers: { 'x-auth-token': token }
            });
            const startData = await startRes.json();
            // Test Submission
            console.log("Testing /api/submissions...");
            const subPostRes = await fetch('http://localhost:8080/api/submissions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                },
                body: JSON.stringify({
                    examId: firstId,
                    timeSpent: 300,
                    answers: [
                        { questionId: startData.questions[0].id, selectedOption: 1 }
                    ]
                })
            });
            const subPostData = await subPostRes.json();
            console.log(`Submission status: ${subPostRes.status}`);
            console.log(`Submission ID: ${subPostData.submissionId}`);
        } else {
            console.log("No exams found");
        }
    } catch(e) {
        console.error("Test failed:", e);
    }
}
run();
