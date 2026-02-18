const express = require('express');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Match = require('../models/Match');
const Report = require('../models/Report');
const Job = require('../models/Job');

const router = express.Router();

// Get admin stats
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalPets, totalMatches, pendingReports, pendingApprovals] = await Promise.all([
      User.countDocuments(),
      Pet.countDocuments(),
      Match.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isApproved: false, role: 'user' })
    ]);

    res.json({
      totalUsers,
      totalPets,
      totalMatches,
      pendingReports,
      pendingApprovals
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reports
router.get('/reports', auth, authorize('admin'), async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reportedPet', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status
router.put('/reports/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNotes, action } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    );
    
    // Take action on reported user/pet
    if (action === 'ban_user' && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser, { isBanned: true });
    } else if (action === 'delete_pet' && report.reportedPet) {
      await Pet.findByIdAndDelete(report.reportedPet);
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', search = '', role = 'all' } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};
    
    if (status === 'pending') {
      filter.isApproved = false;
      filter.isBanned = false;
    } else if (status === 'approved') {
      filter.isApproved = true;
      filter.isBanned = false;
    } else if (status === 'banned') {
      filter.isBanned = true;
    }
    
    if (role !== 'all') filter.role = role;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .populate('pets', 'name species')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve user
router.put('/users/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: req.user._id,
        rejectedAt: undefined,
        rejectedBy: undefined,
        rejectionReason: undefined
      },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject user
router.put('/users/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
        rejectionReason: reason || 'Not specified'
      },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Recent activity summary
router.get('/activity', auth, authorize('admin'), async (req, res) => {
  try {
    const [recentUsers, recentPets, recentReports, recentMatches] = await Promise.all([
      User.find().select('name email createdAt isApproved').sort({ createdAt: -1 }).limit(10),
      Pet.find().select('name species breed createdAt').sort({ createdAt: -1 }).limit(10),
      Report.find().select('reason status createdAt').sort({ createdAt: -1 }).limit(10),
      Match.find().select('createdAt status').sort({ createdAt: -1 }).limit(10)
    ]);
    res.json({ recentUsers, recentPets, recentReports, recentMatches });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban/unban user
router.put('/users/:id/ban', auth, authorize('admin'), async (req, res) => {
  try {
    const { banned } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: banned },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Grant/revoke premium
router.put('/users/:id/premium', auth, authorize('admin'), async (req, res) => {
  try {
    const { isPremium, days } = req.body;
    const update = { isPremium };
    
    if (isPremium && days) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + parseInt(days));
      update.premiumExpiry = expiry;
    } else if (!isPremium) {
      update.premiumExpiry = null;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify user
router.put('/users/:id/verify', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Jobs management
router.get('/jobs', auth, authorize('admin'), async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/jobs', auth, authorize('admin'), async (req, res) => {
  try {
    const { title, department, location, type, description, requirements, status } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const job = await Job.create({
      title,
      department,
      location,
      type,
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements ? String(requirements).split(',').map((r) => r.trim()).filter(Boolean) : []),
      status: status || 'open'
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/jobs/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body || {};
    if (updates.requirements && !Array.isArray(updates.requirements)) {
      updates.requirements = String(updates.requirements).split(',').map((r) => r.trim()).filter(Boolean);
    }
    const job = await Job.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/jobs/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pets
router.get('/pets', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { species: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pets = await Pet.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Pet.countDocuments(filter);
    
    res.json({
      pets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete pet
router.delete('/pets/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Pet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pet deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update pet
router.put('/pets/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

