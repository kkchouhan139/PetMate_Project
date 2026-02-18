const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    if (!process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (user && !user.isBanned && !user.deletedAt) {
      req.user = user;
    }
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
  }
  next();
};

module.exports = optionalAuth;
