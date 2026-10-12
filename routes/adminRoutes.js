const express = require('express');
const router = express.Router();
const { getAdminUsers } = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.get('/users', protect, requireAdmin, getAdminUsers);

module.exports = router;
