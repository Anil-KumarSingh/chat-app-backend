const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all registered users except the current logged-in user
// @access  Private
router.get('/', protect, getUsers);

module.exports = router;
