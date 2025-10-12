const express = require('express');
const router = express.Router()
const { handleLogin, handleSignup, handleCheckUsername, handleOAuthLogin, getUserProfile } = require('../controller/user')
const { authenticateUser } = require('../middlewares/auth')

router.post('/signup', handleSignup);
router.post('/login', handleLogin);
router.get('/check-username', handleCheckUsername);
router.post('/oauth-login', handleOAuthLogin);
router.get('/profile', authenticateUser, getUserProfile);

module.exports = router;