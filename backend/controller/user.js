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
module.exports = {
  handleLogin,
  handleSignup,
  handleCheckUsername,
};
