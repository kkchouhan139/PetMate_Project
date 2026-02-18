const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 hour
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);