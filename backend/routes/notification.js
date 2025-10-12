const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require('../controller/notification');

// All routes require authentication
router.get('/', authenticateUser, getUserNotifications);
router.get('/unread-count', authenticateUser, getUnreadCount);
router.patch('/:notificationId/read', authenticateUser, markAsRead);
router.patch('/mark-all-read', authenticateUser, markAllAsRead);
router.delete('/:notificationId', authenticateUser, deleteNotification);

module.exports = router;
