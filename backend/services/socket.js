const { Server } = require('socket.io');
const cookie = require('cookie');
const { getUser } = require('./auth');
const Notification = require('../models/notification');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173','https://ai-mind-rohit.vercel.app'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  global.io = io;

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.uid;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const user = getUser(token);
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.join(`user:${socket.userId}`);

    // Get notifications
    socket.on('get-notifications', async () => {
      try {
        const notifications = await Notification.find({
          $or: [
            { userId: socket.userId },
            { type: 'global' }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(20);

        socket.emit('notifications-list', notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  console.log('Socket.IO initialized');
}

// Send welcome notification to new user only
async function sendWelcomeNotification(userId) {
  try {
    const notification = await Notification.create({
      userId: userId,
      type: 'user',
      title: 'Welcome to AiMind! 🎉',
      message: 'Start chatting with AI and explore amazing features.',
      category: 'info',
      isRead: false,
    });

    // Emit to user if connected
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error sending welcome notification:', error);
    throw error;
  }
}

module.exports = {
  initializeSocket,
  sendWelcomeNotification,
};
