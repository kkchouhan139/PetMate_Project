const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

const router = express.Router();

const buildLocation = (location = {}) => {
  const loc = {
    city: location.city,
    district: location.district,
    state: location.state ?? location.area,
    addressLine: location.addressLine
  };

  const lat = location?.coordinates?.lat ?? location?.lat;
  const lng = location?.coordinates?.lng ?? location?.lng;
  if (lat !== undefined && lng !== undefined) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
      loc.geo = { type: 'Point', coordinates: [lngNum, latNum] };
    }
  }

  return loc;
};

// Register - Send OTP
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('location.city').notEmpty().withMessage('City is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, location, role } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Validate admin registration with secret key
    if (role === 'admin') {
      const adminKey = req.body.adminKey;
      if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ message: 'Invalid admin registration key' });
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Save OTP and user data
    const otpDoc = new OTP({
      email: normalizedEmail,
      otp,
      userData: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        phone,
        location: buildLocation(location),
        role: role || 'user'
      }
    });
    await otpDoc.save();

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, name);

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: normalizedEmail
    });
  } catch (error) {
    logger.error('Registration error', error?.message || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and Create User
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Find OTP record
    const otpRecord = await OTP.findOne({ email: normalizedEmail, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'User already exists. Please login.' });
    }

    // Create user with stored data
    const user = new User({ 
      ...otpRecord.userData, 
      isVerified: true, 
      isApproved: otpRecord.userData.role === 'admin' ? true : false 
    });
    await user.save();

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(201).json({
      message: 'Email verified successfully! You can now login.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location
      }
    });
  } catch (error) {
    logger.error('OTP verification error', error?.message || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Find existing OTP record
    const otpRecord = await OTP.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return res.status(400).json({ message: 'No pending registration found for this email' });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    otpRecord.otp = otp;
    otpRecord.expiresAt = new Date();
    await otpRecord.save();

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, otpRecord.userData.name);

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    logger.error('Resend OTP error', error?.message || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify Token
router.get('/verify-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: 'Account is banned' });
    }
    if (user.deletedAt) {
      user.deletedAt = undefined;
      user.deletionScheduledAt = undefined;
      await user.save();
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration' });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        isPremium: user.isPremium,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, we\'ve sent a password reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email: normalizedEmail });

    // Save reset token
    const passwordReset = new PasswordReset({
      email: normalizedEmail,
      token: resetTokenHash
    });
    await passwordReset.save();

    // Send reset email
    await sendPasswordResetEmail(normalizedEmail, resetToken, user.name);

    res.json({ message: 'If an account with that email exists, we\'ve sent a password reset link.' });
  } catch (error) {
    logger.error('Forgot password error', error?.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    if (typeof token !== 'string' || token.length < 20) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token (hash first, then legacy raw token for backward compatibility)
    let resetRecord = await PasswordReset.findOne({ token: tokenHash });
    if (!resetRecord) {
      resetRecord = await PasswordReset.findOne({ token });
    }
    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find user
    const user = await User.findOne({ email: resetRecord.email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Delete reset token
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error', error?.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
