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


// @route   GET /api/exams
// @desc    Get all exams (Admin sees all, Students see active/upcoming)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = `
      SELECT e.id, e.title, e.type, e.duration, e.start_time, e.end_time, e.status, e.is_permanent, e.created_at,
             COUNT(q.id) as questionsCount
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;
    
    // If student, maybe only show active/upcoming. 
    // But for now, let's return all and let frontend filter or add WHERE clause later if needed.
    if (req.user.role === 'student') {
        // Just an example of filtering for students
        // query = 'SELECT ... WHERE status IN ("active", "upcoming") ...'
    }

    const [exams] = await db.query(query);
    res.json(exams);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách kỳ thi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   GET /api/exams/:id
// @desc    Get single exam details AND questions
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const examId = req.params.id;
    
    // 1. Get Exam Info
    const [exams] = await db.query('SELECT * FROM exams WHERE id = ?', [examId]);
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kỳ thi' });
    }
    const exam = exams[0];

    // 2. Get Questions
    const [questions] = await db.query('SELECT * FROM questions WHERE exam_id = ?', [examId]);
    
    // IMPORTANT Security: If the user is a STUDENT, REMOVE the correct_option before sending to frontend!
    if (req.user.role === 'student') {
        questions.forEach(q => {
            delete q.correct_option;
        });
    }

    res.json({
        ...exam,
        questions: questions
    });

  } catch (error) {
    console.error('Lỗi khi lấy chi tiết kỳ thi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   GET /api/exams/:id/start
// @desc    Alias for getting exam details to start an exam
// @access  Private
router.get('/:id/start', auth, async (req, res) => {
  try {
    const examId = req.params.id;
    
    // 1. Get Exam Info
    const [exams] = await db.query('SELECT * FROM exams WHERE id = ?', [examId]);
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kỳ thi' });
    }
    const exam = exams[0];

    // 2. Get Questions (Security: REMOVE correct_option for students)
    const [questions] = await db.query('SELECT id, exam_id, text, option_a, option_b, option_c, option_d FROM questions WHERE exam_id = ?', [examId]);
    
    res.json({
        ...exam,
        questions: questions
    });

  } catch (error) {
    console.error('Lỗi khi bắt đầu kỳ thi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   POST /api/exams
// @desc    Create a new exam with questions
// @access  Private (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id, title, type, duration, startTime, endTime, status, questions, isPermanent } = req.body;

    // Start a transaction since we are inserting into multiple tables
    await connection.beginTransaction();

    // 1. Insert Exam
    await connection.query(
      `INSERT INTO exams (id, title, type, duration, start_time, end_time, status, is_permanent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, type, parseInt(duration), startTime || null, endTime || null, status || 'closed', isPermanent || false]
    );

    // 2. Insert Questions if any
    if (questions && questions.length > 0) {
        for (let q of questions) {
            await connection.query(
                `INSERT INTO questions (exam_id, text, option_a, option_b, option_c, option_d, correct_option) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, q.text, q.options[0], q.options[1], q.options[2], q.options[3], q.correctOption]
            );
        }
    }

    await connection.commit();
    res.status(201).json({ message: 'Tạo kỳ thi thành công' });

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi tạo kỳ thi:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi lưu kỳ thi' });
  } finally {
    connection.release();
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete an exam
// @access  Private (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const examId = req.params.id;
    await db.query('DELETE FROM exams WHERE id = ?', [examId]);
    res.json({ message: 'Đã xóa kỳ thi thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa kỳ thi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
