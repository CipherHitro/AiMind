const mongoose = require('mongoose')

const organizationSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "user",
      required: true 
    },
    members: [
      {
        userId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "user",
          required: true 
        },
        role: { 
          type: String, 
          enum: ["admin", "member"], 
          default: "member" 
        },
        status: { 
          type: String, 
          enum: ["active", "invited"], 
          default: "active" 
        },
        joinedAt: { 
          type: Date, 
          default: Date.now 
        },
      },
    ],
    invitations: [
      {
        email: { 
          type: String, 
          required: true 
        },
        invitedBy: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "user" 
        },
        role: { 
          type: String, 
          enum: ["admin", "member"], 
          default: "member" 
        },
        status: { 
          type: String, 
          enum: ["pending", "accepted", "declined"], 
          default: "pending" 
        },
        invitedAt: { 
          type: Date, 
          default: Date.now 
        },
        token:  {
          type: String,
        },
        expiresAt: {
          type: Date,
          default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      },
    ],
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Organization = mongoose.model("organization", organizationSchema);
module.exports = Organization;