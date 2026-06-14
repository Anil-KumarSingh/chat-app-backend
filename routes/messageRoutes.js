const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/messages/:userId
// @desc    Get chat history between logged-in user and :userId
router.get('/:userId', protect, getMessages);

// @route   POST /api/messages
// @desc    Save a new chat message
router.post('/', protect, sendMessage);

module.exports = router;
