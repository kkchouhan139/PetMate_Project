const express = require('express');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Report user or pet
router.post('/', auth, [
  body('reason').isIn(['fake_profile', 'inappropriate_content', 'harassment', 'spam', 'scam', 'other']).withMessage('Invalid reason'),
  body('description').isLength({ min: 5 }).withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { reportedUser, reportedPet, reason, description } = req.body;
    if (!reportedUser && !reportedPet) {
      return res.status(400).json({ message: 'reportedUser or reportedPet is required' });
    }
    if (reportedUser && reportedUser.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }
    
    const report = new Report({
      reporter: req.user._id,
      reportedUser,
      reportedPet,
      reason,
      description
    });
    
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/block', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: userId }
    });
    
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock user
router.post('/unblock', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: userId }
    });
    
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate('reportedUser', 'name')
      .populate('reportedPet', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
