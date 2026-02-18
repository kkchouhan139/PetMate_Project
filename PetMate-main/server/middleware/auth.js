const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if (user.isBanned && user.role !== 'admin') {
      return res.status(403).json({ message: 'Account is banned' });
    }
    if (user.deletedAt) {
      return res.status(403).json({ message: 'Account is scheduled for deletion' });
    }
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
