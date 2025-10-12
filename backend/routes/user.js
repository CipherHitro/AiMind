const express = require('express');
const router = express.Router()
const { handleLogin, handleSignup, handleCheckUsername, handleOAuthLogin, getUserProfile, getUserCredits } = require('../controller/user')
const { authenticateUser } = require('../middlewares/auth')

router.post('/signup', handleSignup);
router.post('/login', handleLogin);
router.get('/check-username', handleCheckUsername);
router.post('/oauth-login', handleOAuthLogin);
router.get('/profile', authenticateUser, getUserProfile);
router.get('/credits', authenticateUser, getUserCredits);

module.exports = router;