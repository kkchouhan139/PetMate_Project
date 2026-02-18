const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    city: { type: String, required: true },
    area: { type: String },
    district: { type: String },
    state: { type: String },
    addressLine: { type: String },
    geo: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (val) => Array.isArray(val) && val.length === 2,
          message: 'Geo coordinates must be [lng, lat]'
        }
      }
    }
  },
  contactPreferences: {
    allowChat: { type: Boolean, default: true },
    hidePhone: { type: Boolean, default: true }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiry: Date,
  avatar: String,
  isBanned: {
    type: Boolean,
    default: false
  },
  deletionScheduledAt: Date,
  deletedAt: Date,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }]
}, {
  timestamps: true
});

userSchema.index(
  { 'location.geo': '2dsphere' },
  { partialFilterExpression: { 'location.geo.coordinates': { $type: 'array' } } }
);

module.exports = mongoose.model('User', userSchema);
