const express = require('express');
const router = express.Router();
const {
  getUserChats,
  getChat,
  createChat,
  sendMessage,
  deleteChat,
  updateChatTitle
} = require('../controller/chat');
const { authenticateUser } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateUser);

// Get all chats for user's active organization
router.get('/', getUserChats);

// Get single chat with messages
router.get('/:chatId', getChat);

// Create new chat
router.post('/create', createChat);

// Send message in chat
router.post('/:chatId/message', sendMessage);

// Update chat title
router.patch('/:chatId', updateChatTitle);

// Delete chat (soft delete)
router.delete('/:chatId', deleteChat);

module.exports = router;
