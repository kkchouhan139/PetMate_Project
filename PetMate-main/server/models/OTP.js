const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  userData: {
    name: String,
    email: String,
    password: String,
    phone: String,
    location: {
      city: String,
      district: String,
      state: String,
      addressLine: String
    },
    role: String
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OTP', otpSchema);
