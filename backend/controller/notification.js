const Notification = require('../models/notification');

// Get notifications for current user
async function getUserNotifications(req, res) {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      $or: [
        { userId: userId },
        { type: 'global' }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// Mark notification as read
async function markAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        $or: [
          { userId: userId },
          { type: 'global' }
        ]
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { userId: userId },
          { type: 'global' }
        ],
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

// Delete notification
async function deleteNotification(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userId // Users can only delete their own notifications
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}

// Get unread count
async function getUnreadCount(req, res) {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      $or: [
        { userId: userId },
        { type: 'global' }
      ],
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};

// Mark notification as read
async function markAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const user = req.user;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        $or: [
          { userId: user._id },
          { type: 'global' },
          { organizationId: user.activeOrganization },
        ],
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Error updating notification' });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    const user = req.user;

    const result = await Notification.updateMany(
      {
        $or: [
          { userId: user._id },
          { type: 'global' },
          { organizationId: user.activeOrganization },
        ],
        isRead: false,
      },
      { isRead: true }
    );

    return res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Error updating notifications' });
  }
}

// Delete notification
async function deleteNotification(req, res) {
  try {
    const { notificationId } = req.params;
    const user = req.user;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: user._id, // Only allow deleting user's own notifications
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Error deleting notification' });
  }
}

// Create notification (admin only or system)
async function createNotification(req, res) {
  try {
    const { userId, organizationId, type, title, message, category, priority, actionUrl, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notification = await Notification.create({
      userId: userId || null,
      organizationId: organizationId || null,
      type: type || 'user',
      title,
      message,
      category: category || 'info',
      priority: priority || 'normal',
      actionUrl,
      metadata: metadata || {},
    });

    // Emit socket event (will be handled by socket.io)
    if (global.io) {
      if (type === 'global') {
        global.io.emit('notification', notification);
      } else if (userId) {
        global.io.to(`user:${userId}`).emit('notification', notification);
      } else if (organizationId) {
        global.io.to(`org:${organizationId}`).emit('notification', notification);
      }
    }

    return res.status(201).json({
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ message: 'Error creating notification' });
  }
}

// Get unread count
async function getUnreadCount(req, res) {
  try {
    const user = req.user;

    const count = await Notification.countDocuments({
      $or: [
        { userId: user._id },
        { type: 'global' },
        { organizationId: user.activeOrganization },
      ],
      isRead: false,
    });

    return res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ message: 'Error getting unread count' });
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount,
};
