const express = require('express');
const router = express.Router()
const { handleLogin, handleSignup, handleCheckUsername } = require('../controller/user')

router.post('/signup', handleSignup);
router.post('/login', handleLogin);
router.get('/check-username', handleCheckUsername);

module.exports = router;