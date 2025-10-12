const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'New Chat'
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'organization',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true
        },
        content: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Chat = mongoose.model('chat', chatSchema);
module.exports = Chat;
