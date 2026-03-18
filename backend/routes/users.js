const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
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

// @route   GET /api/users
// @desc    Get all students
// @access  Private (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, status, created_at FROM users WHERE role = "student" ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sinh viên:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   POST /api/users
// @desc    Admin creates a new student
// @access  Private (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });
    }

    // Check existing email
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email này đã tồn tại trong hệ thống' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );

    res.status(201).json({
      message: 'Thêm sinh viên thành công',
      user: { id: result.insertId, name, email, role: 'student', status: 'active' }
    });

  } catch (error) {
    console.error('Lỗi khi thêm sinh viên:', error);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Lock or Unlock user account
// @access  Private (Admin only)
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'locked'
    const studentId = req.params.id;

    if (status !== 'active' && status !== 'locked') {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    await db.query('UPDATE users SET status = ? WHERE id = ? AND role = "student"', [status, studentId]);
    res.json({ message: `Cập nhật trạng thái thành ${status}` });

  } catch (error) {
    console.error('Lỗi khi khóa tài khoản:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   POST /api/users/:id/reset-password
// @desc    Reset student password to default (123456)
// @access  Private (Admin only)
router.post('/:id/reset-password', auth, adminAuth, async (req, res) => {
  try {
    const studentId = req.params.id;
    const defaultPassword = '123456';
    
    // Hash default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE id = ? AND role = "student"', [hashedPassword, studentId]);
    res.json({ message: 'Mật khẩu đã được khôi phục về mặc định.' });

  } catch (error) {
    console.error('Lỗi khi đặt lại mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a student permanently
// @access  Private (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const studentId = req.params.id;
    // Database schema uses ON DELETE CASCADE, so submissions will delete automatically
    await db.query('DELETE FROM users WHERE id = ? AND role = "student"', [studentId]);
    res.json({ message: 'Xóa sinh viên thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa sinh viên:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
