const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizePhone = (value) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().replace(/\D/g, '');
  return /^\d{8,15}$/.test(normalized) ? normalized : '';
};

// Helper function to generate a signed JWT token for a user
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const phone = normalizePhone(req.body?.phone);

    // Validate input
    if (!name || !email || !username || !password || !phone) {
      return res.status(400).json({ message: 'Please provide your name, username, email, password, and a valid phone number with country code' });
    }

    if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
      return res.status(400).json({ message: 'Username must be 3 to 24 characters using letters, numbers, dots, or underscores.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    if (await User.exists({ username })) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }
    if (await User.exists({ phone })) {
      return res.status(409).json({ message: 'That phone number is already linked to an account' });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      username,
      phone,
      password: hashedPassword,
    });

    // Respond with user info and JWT token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role || 'user',
      token: generateToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      const message = error.keyPattern?.phone
        ? 'That phone number is already linked to an account'
        : error.keyPattern?.username
          ? 'That username is already taken.'
          : 'An account with this email already exists';
      return res.status(409).json({ message });
    }
    console.error('Registration failed:', error.message);
    return res.status(500).json({ message: 'Could not create your account. Please try again.' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const authenticateUser = async (req, res, expectedRole) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Compare hashed password
    if (!user || !(await bcrypt.compare(password, user.password)) || (user.role || 'user') !== expectedRole) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role || 'user',
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ message: 'Could not sign in. Please try again.' });
  }
};

const loginUser = (req, res) => authenticateUser(req, res, 'user');
const loginAdmin = (req, res) => authenticateUser(req, res, 'admin');

// @desc    List users for the admin overview
// @route   GET /api/admin/users
// @access  Admin
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin user list failed:', error.message);
    res.status(500).json({ message: 'Could not load users.' });
  }
};

module.exports = { registerUser, loginUser, loginAdmin, getAdminUsers };
