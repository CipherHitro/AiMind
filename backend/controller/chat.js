const Chat = require('../models/chat');
const User = require('../models/user');
const Organization = require('../models/organization');
const { getAiResponse } = require('../utils/getAiResponse');
const { generateChatTitle } = require('../utils/generateChatTitle');

// Constants
const CREDITS_PER_MESSAGE = 2;

// Get all chats for user's active organization
async function getUserChats(req, res) {
  try {
    const user = req.user;
    console.log('in get user')
    // Get user's active organization
    if (!user.activeOrganization) {
      return res.status(400).json({ message: 'No active organization set' });
    }

    // Verify user is a member of the active organization
    const userOrg = user.organizations.find(
      org => org.orgId.toString() === user.activeOrganization.toString()
    );

    if (!userOrg) {
      return res.status(403).json({ message: 'You are not a member of this organization' });
    }

    // Get all chats for this organization and user
    const chats = await Chat.find({
      organizationId: user.activeOrganization,
      // userId: user._id,
      isArchived: false
    })
      .sort({ updatedAt: -1 })
      .select('title messages createdAt updatedAt');
      console.log("user id " , user._id)
    console.log("chats ",chats)
    // Format response with last message preview
    const formattedChats = chats.map(chat => ({
      _id: chat._id,
      title: chat.title,
      lastMessage: chat.messages.length > 0 
        ? chat.messages[chat.messages.length - 1].content.substring(0, 50) + '...'
        : 'No messages yet',
      messageCount: chat.messages.length,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    }));

    return res.status(200).json({ 
      chats: formattedChats,
      organizationId: user.activeOrganization
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({ message: 'Error fetching chats' });
  }
}

// Get single chat with all messages
async function getChat(req, res) {
  try {
    const { chatId } = req.params;
    const user = req.user;

    const chat = await Chat.findOne({
      _id: chatId,
      // userId: user._id
    }).populate('lockedBy', 'username fullName');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify chat belongs to user's active organization
    if (chat.organizationId.toString() !== user.activeOrganization.toString()) {
      return res.status(403).json({ message: 'This chat belongs to a different organization' });
    }

    // Check if chat is locked by another user
    let isLockedByOther = false;
    let lockInfo = null;
    
    if (chat.isLocked && chat.lockedBy && chat.lockedBy._id.toString() !== user._id.toString()) {
      // Check if lock has expired (auto-unlock after 5 minutes of inactivity)
      const lockExpiryTime = new Date(chat.lockedAt.getTime() + 5 * 60 * 1000);
      if (new Date() > lockExpiryTime) {
        // Lock expired, auto-unlock
        chat.isLocked = false;
        chat.lockedBy = null;
        chat.lockedAt = null;
        chat.lockExpiry = null;
        await chat.save();
      } else {
        // Chat is locked by another user - allow viewing but mark as locked
        isLockedByOther = true;
        lockInfo = {
          username: chat.lockedBy.username,
          fullName: chat.lockedBy.fullName
        };
      }
    }

    // Always return chat data (users can view locked chats)
    return res.status(200).json({ 
      chat,
      isLocked: chat.isLocked,
      lockedByMe: chat.lockedBy && chat.lockedBy._id.toString() === user._id.toString(),
      isLockedByOther,
      lockedBy: lockInfo
    });

  } catch (error) {
    console.error('Error fetching chat:', error);
    return res.status(500).json({ message: 'Error fetching chat' });
  }
}

// Create new chat
async function createChat(req, res) {
  try {
    const { title } = req.body;
    const user = req.user;

    if (!user.activeOrganization) {
      return res.status(400).json({ message: 'No active organization set' });
    }

    // Verify user is a member of the active organization
    const userOrg = user.organizations.find(
      org => org.orgId.toString() === user.activeOrganization.toString()
    );

    if (!userOrg) {
      return res.status(403).json({ message: 'You are not a member of this organization' });
    }

    // Create welcome message with suggested prompts
    const welcomeMessage = {
      role: 'system',
      content: 'Welcome to AiMind\n\nStart a conversation with your AI assistant. Ask me anything, and I\'ll help you with information, creative tasks, coding, and more.',
      timestamp: new Date()
    };

    const chat = await Chat.create({
      title: title || 'New Chat',
      organizationId: user.activeOrganization,
      userId: user._id,
      messages: [welcomeMessage],
    });

    return res.status(201).json({ 
      message: 'Chat created successfully',
      chat: {
        _id: chat._id,
        title: chat.title,
        lastMessage: 'Welcome to AiMind!',
        messageCount: 1,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return res.status(500).json({ message: 'Error creating chat' });
  }
}

// Send message in chat
async function sendMessage(req, res) {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user has enough credits (2 credits per message)
    if (user.credits < CREDITS_PER_MESSAGE) {
      return res.status(403).json({ 
        message: 'Insufficient credits. You need at least 2 credits to send a message.',
        credits: user.credits,
        requiredCredits: CREDITS_PER_MESSAGE
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      userId: user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify chat belongs to user's active organization
    if (chat.organizationId.toString() !== user.activeOrganization.toString()) {
      return res.status(403).json({ message: 'This chat belongs to a different organization' });
    }

    // Remove system welcome message if this is the first user message
    const hasUserMessages = chat.messages.some(msg => msg.role === 'user');
    const isFirstMessage = !hasUserMessages;
    
    if (isFirstMessage) {
      // This is the first user message, remove system messages
      chat.messages = chat.messages.filter(msg => msg.role !== 'system');
      
      // Auto-generate chat title based on first message
      try {
        const generatedTitle = await generateChatTitle(message.trim());
        chat.title = generatedTitle;
        console.log(`Auto-generated chat title: "${generatedTitle}"`);
      } catch (error) {
        console.error('Error generating chat title:', error);
        // If title generation fails, use first few words of message
        const fallbackTitle = message.trim().split(' ').slice(0, 4).join(' ');
        chat.title = fallbackTitle.length > 50 ? fallbackTitle.substring(0, 47) + '...' : fallbackTitle;
      }
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    });

    // Get AI response
    const aiResponse = await getAiResponse(chat.messages);
    
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update the updatedAt timestamp
    chat.updatedAt = new Date();

    await chat.save();

    // Deduct credits from user after successful message send
    user.credits -= CREDITS_PER_MESSAGE;
    await user.save();

    console.log(`Credits deducted. User: ${user.email}, Remaining credits: ${user.credits}`);

    return res.status(200).json({ 
      message: 'Message sent successfully',
      chatTitle: chat.title, // Include the updated title in response
      credits: user.credits, // Include updated credits in response
      userMessage: {
        role: 'user',
        content: message.trim(),
        timestamp: chat.messages[chat.messages.length - 2].timestamp
      },
      aiMessage: {
        role: 'assistant',
        content: aiResponse,
        timestamp: chat.messages[chat.messages.length - 1].timestamp
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Error sending message' });
  }
}

// Delete chat
async function deleteChat(req, res) {
  try {
    const { chatId } = req.params;
    const user = req.user;
    const chat = await Chat.findOneAndDelete({
      _id: chatId,
      userId: user._id
    });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Soft delete - mark as archived
    // chat.deleteOne = true;
    // await chat.save();

    return res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return res.status(500).json({ message: 'Error deleting chat' });
  }
}

// Update chat title
async function updateChatTitle(req, res) {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const user = req.user;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      userId: user._id
    });
    console.log("chatfind : ", chat)
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.title = title.trim();
    await chat.save();

    return res.status(200).json({ 
      message: 'Chat title updated successfully',
      title: chat.title
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    return res.status(500).json({ message: 'Error updating chat title' });
  }
}

// Lock a chat when user opens it
async function lockChat(req, res) {
  try {
    const { chatId } = req.params;
    const user = req.user;

    const chat = await Chat.findOne({
      _id: chatId,
      organizationId: user.activeOrganization
    }).populate('lockedBy', 'username fullName');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if already locked by another user
    if (chat.isLocked && chat.lockedBy && chat.lockedBy._id.toString() !== user._id.toString()) {
      // Check if lock has expired
      const lockExpiryTime = new Date(chat.lockedAt.getTime() + 5 * 60 * 1000);
      if (new Date() <= lockExpiryTime) {
        return res.status(423).json({ 
          message: `This chat is currently being used by ${chat.lockedBy.username || chat.lockedBy.fullName}`,
          isLocked: true,
          lockedBy: {
            username: chat.lockedBy.username,
            fullName: chat.lockedBy.fullName
          }
        });
      }
    }

    // Lock the chat
    chat.isLocked = true;
    chat.lockedBy = user._id;
    chat.lockedAt = new Date();
    chat.lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await chat.save();

    // Emit socket event to notify other users
    const io = req.app.get('io');
    if (io) {
      io.to(`org:${user.activeOrganization}`).emit('chat-locked', {
        chatId: chat._id,
        lockedBy: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName
        }
      });
    }

    return res.status(200).json({ 
      message: 'Chat locked successfully',
      isLocked: true,
      lockedBy: user._id
    });
  } catch (error) {
    console.error('Error locking chat:', error);
    return res.status(500).json({ message: 'Error locking chat' });
  }
}

// Unlock a chat when user closes it
async function unlockChat(req, res) {
  try {
    const { chatId } = req.params;
    const user = req.user;

    const chat = await Chat.findOne({
      _id: chatId,
      organizationId: user.activeOrganization
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only the user who locked it can unlock it (or if lock expired)
    if (chat.isLocked && chat.lockedBy && chat.lockedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You cannot unlock this chat' });
    }

    // Unlock the chat
    chat.isLocked = false;
    chat.lockedBy = null;
    chat.lockedAt = null;
    chat.lockExpiry = null;
    await chat.save();

    // Emit socket event to notify other users
    const io = req.app.get('io');
    if (io) {
      io.to(`org:${user.activeOrganization}`).emit('chat-unlocked', {
        chatId: chat._id
      });
    }

    return res.status(200).json({ 
      message: 'Chat unlocked successfully',
      isLocked: false
    });
  } catch (error) {
    console.error('Error unlocking chat:', error);
    return res.status(500).json({ message: 'Error unlocking chat' });
  }
}

// Keep chat lock alive (heartbeat)
async function keepChatLockAlive(req, res) {
  try {
    const { chatId } = req.params;
    const user = req.user;

    const chat = await Chat.findOne({
      _id: chatId,
      organizationId: user.activeOrganization,
      isLocked: true,
      lockedBy: user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or not locked by you' });
    }

    // Extend the lock
    chat.lockedAt = new Date();
    chat.lockExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await chat.save();

    return res.status(200).json({ 
      message: 'Lock extended',
      lockExpiry: chat.lockExpiry
    });
  } catch (error) {
    console.error('Error extending lock:', error);
    return res.status(500).json({ message: 'Error extending lock' });
  }
}

module.exports = {
  getUserChats,
  getChat,
  createChat,
  sendMessage,
  deleteChat,
  updateChatTitle,
  lockChat,
  unlockChat,
  keepChatLockAlive
};
