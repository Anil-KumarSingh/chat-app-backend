const express = require('express');
const router = express.Router();
const { getConversations, searchPeople, addContact, updateMyPhone } = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.get('/search', protect, searchPeople);
router.post('/contacts', protect, addContact);
router.patch('/me/phone', protect, updateMyPhone);

module.exports = router;
