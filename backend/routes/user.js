const express = require('express');
const router = express.Router()
const { handleLogin, handleSignup } = require('../controller/user')

router.post('/signup', handleSignup);
router.post('/login', handleLogin);

module.exports = router;