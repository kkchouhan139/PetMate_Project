const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedPet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  },
  reason: {
    type: String,
    required: true,
    enum: ['fake_profile', 'inappropriate_content', 'harassment', 'spam', 'scam', 'other']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);