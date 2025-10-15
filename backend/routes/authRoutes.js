const express = require('express');
const { login, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/change-password', auth, changePassword);

module.exports = router;