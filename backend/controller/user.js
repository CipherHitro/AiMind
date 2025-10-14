const User = require("../models/user");
const Organization = require("../models/organization");
const bcrypt = require("bcryptjs");
const { setUser } = require("../services/auth");
const { sendWelcomeNotification } = require("../services/socket");
require("dotenv").config();

async function handleCheckUsername(req, res) {
  try {
    const { username } = req.query;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        available: false,
        message: "Username must be at least 3 characters",
      });
    }

    const existingUser = await User.findOne({ username: username.trim() });

    if (existingUser) {
      return res.status(200).json({
        available: false,
        message: "Username is already taken",
      });
    }

    return res.status(200).json({
      available: true,
      message: "Username is available",
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return res.status(500).json({
      available: false,
      message: "Error checking username availability",
    });
  }
}

async function handleSignup(req, res) {
  console.log(req.body);
  const { email, username, password } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync(password, salt);

    // Create user first
    const user = await User.create({
      username,
      email,
      password: passHash,
      fullName: username, // Use username as fullName for regular signups
    });

    if (user) {
      // Create default organization for the user
      const defaultOrg = await Organization.create({
        name: `${username}'s Organization`,
        owner: user._id,
        members: [
          {
            userId: user._id,
            role: "admin",
            status: "active",
            joinedAt: new Date(),
          },
        ],
        isDefault: true,
      });

      // Update user with organization info
      user.organizations = [
        {
          orgId: defaultOrg._id,
          role: "admin",
          status: "active",
        },
      ];
      user.activeOrganization = defaultOrg._id;
      await user.save();

      // Send welcome notification to new user
      await sendWelcomeNotification(user._id);

      console.log("User and default organization created successfully");
      return res.status(201).json({ message: "User created", user });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Error creating user" });
  }
}
async function handleLogin(req, res) {
  const { username, password, rememberMe } = req.body;

  try {
    // Check if the input is an email or username
    const isEmail = /\S+@\S+\.\S+/.test(username);

    // Find user by either username or email
    const user = await User.findOne(
      isEmail ? { email: username } : { username }
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const authUser = bcrypt.compareSync(password, user.password);
    if (!authUser) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = setUser(user);

    if (process.env.mode == "development") {
      return res.status(200).json({ message: "Logged in!", token, rememberMe });
    } else {
      console.log("In production");
      res.cookie("uid", token, {
        httpOnly: true,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 1 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-site cookies
        path : '/',
      });
      return res.status(200).json({ message: "Logged in!" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Error during login" });
  }
}

async function handleOAuthLogin(req, res) {
  const { email, name, picture, sub } = req.body;
  console.log("OAuth login request received");
  console.log("Request body:", req.body);

  try {
    // Check if user already exists by email or OAuth sub
    let user = await User.findOne({
      $or: [{ email }, { oauthId: sub }],
    });

    let isNewUser = false;

    if (user) {
      console.log("Existing user found:", user.username);
      // User exists - update OAuth info if needed
      if (!user.oauthId) {
        user.oauthId = sub;
        user.picture = picture;
        user.name = name;
        user.fullName = name; // Update fullName with Google name
        await user.save();
        console.log("Updated existing user with OAuth info");
      }
    } else {
      console.log("Creating new OAuth user");
      isNewUser = true;

      // Create new user from OAuth data
      // Generate username from email or name
      let username = email.split("@")[0];

      // Ensure username is unique
      let existingUsername = await User.findOne({ username });
      let counter = 1;
      while (existingUsername) {
        username = `${email.split("@")[0]}${counter}`;
        existingUsername = await User.findOne({ username });
        counter++;
      }

      console.log("Generated username:", username);

      user = await User.create({
        username,
        email,
        oauthId: sub,
        picture,
        name,
        fullName: name, // Use Google name as fullName for OAuth users
        // Don't set password field at all for OAuth users
      });

      console.log("New OAuth user created:", user.username);

      // Create default organization for new OAuth user
      const defaultOrg = await Organization.create({
        name: `${name}'s Organization`,
        owner: user._id,
        members: [
          {
            userId: user._id,
            role: "admin",
            status: "active",
            joinedAt: new Date(),
          },
        ],
        isDefault: true,
      });

      // Update user with organization info
      user.organizations = [
        {
          orgId: defaultOrg._id,
          role: "admin",
          status: "active",
        },
      ];
      user.activeOrganization = defaultOrg._id;
      await user.save();

      // Send welcome notification to new OAuth user
      await sendWelcomeNotification(user._id);

      console.log("Default organization created for OAuth user");
    }

    // Generate token
    const token = setUser(user);
    console.log("Token generated for user:", user.username);

    if (process.env.mode == "development") {
      console.log("Sending development response with token");
      return res.status(200).json({
        message: "Logged in!",
        token,
        user: { username: user.username, email: user.email },
      });
    } else {
      res.cookie("uid", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-site cookies,
        path: '/',
      });
      return res.status(200).json({
        message: "Logged in!",
        user: { username: user.username, email: user.email },
      });
    }
  } catch (error) {
    console.error("OAuth login error:", error);
    return res
      .status(500)
      .json({ message: "Error during OAuth login", error: error.message });
  }
}

async function getUserProfile(req, res) {
  try {
    const user = req.user; // Assuming you have authentication middleware that adds user to req

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Populate organizations
    const userWithOrgs = await User.findById(user._id)
      .populate({
        path: "organizations.orgId",
        select: "name owner isDefault members",
      })
      .populate("activeOrganization", "name");

    // Format organizations data
    const organizations = userWithOrgs.organizations.map((org) => ({
      _id: org.orgId._id,
      name: org.orgId.name,
      role: org.role,
      status: org.status,
      isDefault: org.orgId.isDefault,
      memberCount: org.orgId.members.length,
      isActive:
        userWithOrgs.activeOrganization?._id.toString() ===
        org.orgId._id.toString(),
    }));

    // Return user profile without sensitive information
    return res.status(200).json({
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      picture: user.picture || null,
      name: user.name || user.fullName || user.username,
      organizations: organizations,
      activeOrganization: userWithOrgs.activeOrganization
        ? {
            _id: userWithOrgs.activeOrganization._id,
            name: userWithOrgs.activeOrganization.name,
          }
        : null,
      credits: user.credits || 0, // Include credits in profile response
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
}

// Get user credits
async function getUserCredits(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      credits: user.credits || 0,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Get credits error:", error);
    return res.status(500).json({ message: "Error fetching credits" });
  }
}

async function handleLogout(req, res) {
  try {
    // Clear the httpOnly cookie
    res.clearCookie('uid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: '/',
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Error during logout" });
  }
}

module.exports = {
  handleLogin,
  handleSignup,
  handleCheckUsername,
  handleOAuthLogin,
  getUserProfile,
  getUserCredits,
  handleLogout,
};
