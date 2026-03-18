const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/db');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Không có quyền truy cập.' });
  }
};

// @route   POST /api/submissions
// @desc    Student submits an exam (Auto-grade)
// @access  Private (Students usually)
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { examId, exam_id, answers, timeSpent, time_spent } = req.body; 
    const targetExamId = examId || exam_id;
    const targetTimeSpent = timeSpent || time_spent || 0;
    const userId = req.user.id;

    // 1. Get Exam Details to verify it exists and is open
    const [exams] = await connection.query('SELECT * FROM exams WHERE id = ?', [targetExamId]);
    if (exams.length === 0) return res.status(404).json({ message: 'Kỳ thi không tồn tại' });
    
    // 2. Get Correct Answers from DB
    const [questions] = await connection.query('SELECT id, correct_option FROM questions WHERE exam_id = ?', [targetExamId]);
    
    if (questions.length === 0) return res.status(400).json({ message: 'Kỳ thi chưa có câu hỏi' });

    // 3. Calculate Score
    let correctAnswersCount = 0;
    const totalQuestions = questions.length;
    
    // Create a map of correct answers for quick lookup
    const correctAnswersMap = {};
    questions.forEach(q => {
        correctAnswersMap[q.id] = q.correct_option;
    });

    // Check student answers
    answers.forEach(ans => {
        const qId = ans.questionId || ans.question_id;
        const sOpt = (ans.selectedOption !== undefined) ? ans.selectedOption : ans.selected_option;
        
        if (correctAnswersMap[qId] !== undefined) {
            if (correctAnswersMap[qId] === sOpt) {
                correctAnswersCount++;
            }
        }
    });

    const score = (correctAnswersCount / totalQuestions) * 10;

    // 4. Save Submission
    await connection.beginTransaction();

    const [submissionResult] = await connection.query(
        `INSERT INTO submissions (user_id, exam_id, score, time_spent, correct_answers, total_questions) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, targetExamId, score, targetTimeSpent, correctAnswersCount, totalQuestions]
    );

    const submissionId = submissionResult.insertId;

    // Optional: Save individual answers
    if (answers && answers.length > 0) {
        for (let ans of answers) {
             const qId = ans.questionId || ans.question_id;
             const sOpt = (ans.selectedOption !== undefined) ? ans.selectedOption : ans.selected_option;
             await connection.query(
                 'INSERT INTO submission_answers (submission_id, question_id, selected_option) VALUES (?, ?, ?)',
                 [submissionId, qId, sOpt]
             );
        }
    }

    await connection.commit();

    res.status(201).json({ 
        message: 'Nộp bài thành công',
        submissionId: submissionId,
        result: {
            score: score.toFixed(1),
            correctAnswers: correctAnswersCount,
            totalQuestions: totalQuestions
        }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi nộp bài:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi chấm điểm' });
  } finally {
    connection.release();
  }
});


// @route   GET /api/submissions/history
// @desc    Get current user's submission history
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
      const [history] = await db.query(
         `SELECT s.*, e.title as exam_title 
          FROM submissions s 
          JOIN exams e ON s.exam_id = e.id 
          WHERE s.user_id = ? 
          ORDER BY s.submitted_at DESC`,
         [req.user.id]
      );
      res.json(history);
    } catch (error) {
      console.error('Lỗi lấy lịch sử:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

// @route   GET /api/submissions/all
// @desc    Get all submissions for admin (Student Results tracking)
// @access  Private (Admin only)
router.get('/all', auth, adminAuth, async (req, res) => {
    try {
      const [records] = await db.query(
         `SELECT s.*, e.title as exam_title, u.name as student_name, u.email as student_email
          FROM submissions s 
          JOIN exams e ON s.exam_id = e.id 
          JOIN users u ON s.user_id = u.id
          ORDER BY s.submitted_at DESC`
      );
      res.json(records);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu kết quả:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});


// @route   GET /api/submissions/statistics
// @desc    Get aggregated stats for dashboard
// @access  Private (Admin only)
router.get('/statistics', auth, adminAuth, async (req, res) => {
    try {
        // Quick stats gathering
        const [[{total_students}]] = await db.query('SELECT COUNT(*) as total_students FROM users WHERE role="student"');
        const [[{total_exams}]] = await db.query('SELECT COUNT(*) as total_exams FROM exams');
        const [[{total_submissions}]] = await db.query('SELECT COUNT(*) as total_submissions FROM submissions');
        
        let average_score = 0;
        if(total_submissions > 0) {
           const [[{avg_score}]] = await db.query('SELECT AVG(score) as avg_score FROM submissions');
           average_score = parseFloat(avg_score).toFixed(1);
        }

        res.json({
            overview: {
                total_students,
                total_exams,
                total_submissions,
                average_score
            }
            // More complex chart data can be added here
        });

    } catch (error) {
      console.error('Lỗi lấy thống kê:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});


// @route   GET /api/submissions/:id
// @desc    Get a single submission details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const submissionId = req.params.id;
        const [submissions] = await db.query(
            `SELECT s.*, e.title as exam_title 
             FROM submissions s 
             JOIN exams e ON s.exam_id = e.id 
             WHERE s.id = ?`, [submissionId]
        );
        if (submissions.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy kết quả nộp bài' });
        }
        
        const submission = submissions[0];

        // Ensure user is admin OR the owner of the submission
        if (req.user.role !== 'admin' && req.user.id !== submission.user_id) {
            return res.status(403).json({ message: 'Không có quyền truy cập.' });
        }

        // Get the detailed answers
        const [answers] = await db.query(
            `SELECT sa.question_id, sa.selected_option, q.text as question_text, 
                    q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
             FROM submission_answers sa
             LEFT JOIN questions q ON sa.question_id = q.id
             WHERE sa.submission_id = ?`, [submissionId]
        );

        res.json({
            ...submission,
            answers
        });

    } catch (error) {
        console.error('Lỗi lấy chi tiết bài thi:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

// @route   GET /api/submissions/student/:id
// @desc    Get a specific student's submission history
// @access  Private
router.get('/student/:id', auth, async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Ensure user is admin OR querying their own history
        if (req.user.role !== 'admin' && req.user.id != studentId) {
            return res.status(403).json({ message: 'Không có quyền truy cập.' });
        }

        const [history] = await db.query(
            `SELECT s.*, e.title as exam_title 
             FROM submissions s 
             JOIN exams e ON s.exam_id = e.id 
             WHERE s.user_id = ? 
             ORDER BY s.submitted_at DESC`,
            [studentId]
        );
        res.json(history);
    } catch (error) {
        console.error('Lỗi lấy lịch sử sinh viên:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

module.exports = router;
