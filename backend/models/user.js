const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: false, // Not required for OAuth users
    },
    fullName: {
      type: String,
      require: false, // Will be username for regular users, Google name for OAuth users
    },
    oauthId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but enforces uniqueness when present
    },
    picture: {
      type: String,
    },
    name: {
      type: String,
    },
    organizations: [
      {
        orgId: { type: mongoose.Schema.Types.ObjectId, ref: "organization" },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        status: { type: String, enum: ["active", "invited"], default: "active" },
      },
    ],
    activeOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    credits: {
      type: Number,
      default: 1000, // Default 1000 credits for new users
      min: 0, // Credits cannot go below 0
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("user", userSchema);
module.exports = User;
