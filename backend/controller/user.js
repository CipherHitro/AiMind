const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { setUser } = require("../services/auth");
require('dotenv').config();

async function handleCheckUsername(req, res) {
  try {
    const { username } = req.query;
    
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ 
        available: false, 
        message: 'Username must be at least 3 characters' 
      });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    
    if (existingUser) {
      return res.status(200).json({ 
        available: false, 
        message: 'Username is already taken' 
      });
    }

    return res.status(200).json({ 
      available: true, 
      message: 'Username is available' 
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return res.status(500).json({ 
      available: false, 
      message: 'Error checking username availability' 
    });
  }
}

async function handleSignup(req, res) {
  console.log(req.body);
  const { email, username, password } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
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

    const user = await User.create({
      username,
      email,
      password: passHash,
      fullName: username, // Use username as fullName for regular signups
    });

    if (user) {
      return res.status(201).json({ message: "User created", user });
    }
  } catch (error) {
    console.error('Signup error:', error);
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
      res.cookie("uid", token, {
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 1 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({ message: "Logged in!" });
    }
  } catch (error) {
    console.error('Login error:', error);
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
      $or: [{ email }, { oauthId: sub }] 
    });

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
      // Create new user from OAuth data
      // Generate username from email or name
      let username = email.split('@')[0];
      
      // Ensure username is unique
      let existingUsername = await User.findOne({ username });
      let counter = 1;
      while (existingUsername) {
        username = `${email.split('@')[0]}${counter}`;
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
    }

    // Generate token
    const token = setUser(user);
    console.log("Token generated for user:", user.username);

    if (process.env.mode == "development") {
      console.log("Sending development response with token");
      return res.status(200).json({ 
        message: "Logged in!", 
        token, 
        user: { username: user.username, email: user.email } 
      });
    } else {
      res.cookie("uid", token, {
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for OAuth
      });
      return res.status(200).json({ 
        message: "Logged in!",
        user: { username: user.username, email: user.email }
      });
    }
  } catch (error) {
    console.error('OAuth login error:', error);
    return res.status(500).json({ message: "Error during OAuth login", error: error.message });
  }
}

async function getUserProfile(req, res) {
  try {
    const user = req.user; // Assuming you have authentication middleware that adds user to req
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Return user profile without sensitive information
    return res.status(200).json({
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      picture: user.picture || null,
      name: user.name || user.fullName || user.username,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
}

module.exports = {
  handleLogin,
  handleSignup,
  handleCheckUsername,
  handleOAuthLogin,
  getUserProfile,
};
