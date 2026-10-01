const express = require('express');
const router = express.Router();
const { registerOwner, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerOwner);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
