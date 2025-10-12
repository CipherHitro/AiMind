const { getUser } = require('../services/auth');
const User = require('../models/user');

async function authenticateUser(req, res, next) {
  try {
    // Get token from cookie
    const token = req.cookies?.uid;
    
    if (!token) {
      return res.status(401).json({ message: "No authentication token provided" });
    }

    // Verify token
    const decoded = getUser(token);
    
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get full user details from database
    const user = await User.findById(decoded._id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: "Authentication failed" });
  }
}

module.exports = {
  authenticateUser,
};
