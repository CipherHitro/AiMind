const { Server } = require('socket.io');
const cookie = require('cookie');
const { getUser } = require('./auth');
const Notification = require('../models/notification');
const User = require('../models/user');
const Chat = require('../models/chat');

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

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.join(`user:${socket.userId}`);

    // Join user to their organization rooms
    try {
      const user = await User.findById(socket.userId).populate('organizations.orgId');
      if (user && user.organizations) {
        user.organizations.forEach(org => {
          if (org.orgId && org.orgId._id) {
            const orgRoom = `org:${org.orgId._id}`;
            socket.join(orgRoom);
            console.log(`User ${socket.userId} joined organization room: ${orgRoom}`);
          }
        });
      }
    } catch (error) {
      console.error('Error joining organization rooms:', error);
    }

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

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Auto-unlock all chats locked by this user
      try {
        const lockedChats = await Chat.find({ 
          lockedBy: socket.userId,
          isLocked: true 
        }).populate('organization');

        if (lockedChats.length > 0) {
          // Unlock all chats
          await Chat.updateMany(
            { lockedBy: socket.userId, isLocked: true },
            { 
              $set: { 
                isLocked: false, 
                lockedBy: null, 
                lockedAt: null, 
                lockExpiry: null 
              } 
            }
          );

          // Notify organization members about unlocked chats
          lockedChats.forEach(chat => {
            if (chat.organization) {
              io.to(`org:${chat.organization}`).emit('chat-unlocked', {
                chatId: chat._id,
                reason: 'user-disconnected',
                userId: socket.userId
              });
            }
          });

          console.log(`Auto-unlocked ${lockedChats.length} chats for disconnected user ${socket.userId}`);
        }
      } catch (error) {
        console.error('Error auto-unlocking chats on disconnect:', error);
      }
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
