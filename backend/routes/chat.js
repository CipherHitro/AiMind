const express = require('express');
const router = express.Router();
const {
  getUserChats,
  getChat,
  createChat,
  sendMessage,
  deleteChat,
  updateChatTitle,
  lockChat,
  unlockChat,
  keepChatLockAlive
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

// Lock chat (when user opens it)
router.post('/:chatId/lock', lockChat);

// Unlock chat (when user closes it)
router.post('/:chatId/unlock', unlockChat);

// Keep lock alive (heartbeat)
router.post('/:chatId/lock/heartbeat', keepChatLockAlive);

// Delete chat (soft delete)
router.delete('/:chatId', deleteChat);

module.exports = router;
