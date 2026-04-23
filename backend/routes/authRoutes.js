const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ─── Helper: Generate JWT ───────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─── @route  POST /api/auth/register ───────────────────────────────
// ─── @desc   Register a new employee ───────────────────────────────
// ─── @access Public ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, employeeId, category, password, confirmPassword } = req.body;

  try {
    // 1. Check all fields
    if (!name || !employeeId || !category || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // 2. Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 3. Check if employee ID already exists
    const existingUser = await User.findOne({ employeeId });
    if (existingUser) {
      return res.status(400).json({ message: 'Employee ID already registered' });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user
    const user = await User.create({
      name,
      employeeId,
      category,
      password: hashedPassword,
    });

    // 6. Return user data + token
    res.status(201).json({
      message: 'Registration successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        category: user.category,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── @route  POST /api/auth/login ──────────────────────────────────
// ─── @desc   Login employee ────────────────────────────────────────
// ─── @access Public ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    // 1. Check fields
    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // 2. Find user by employeeId
    const user = await User.findOne({ employeeId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Employee ID or password' });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Employee ID or password' });
    }

    // 4. Return user data + token
    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        category: user.category,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── @route  GET /api/auth/me ───────────────────────────────────────
// ─── @desc   Get logged-in user profile ────────────────────────────
// ─── @access Private ───────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    id: req.user._id,
    name: req.user.name,
    employeeId: req.user.employeeId,
    category: req.user.category,
  });
});

module.exports = router;