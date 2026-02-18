const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  species: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'bird', 'rabbit', 'other']
  },
  breed: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  age: {
    years: { type: Number, required: true },
    months: { type: Number, default: 0 }
  },
  weight: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    required: true,
    enum: ['small', 'medium', 'large', 'extra-large']
  },
  vaccination: {
    isVaccinated: { type: Boolean, required: true },
    lastVaccinationDate: Date,
    certificates: [String] // URLs to vaccination certificates
  },
  health: {
    conditions: [String],
    medications: [String],
    notes: String
  },
  photos: [{
    url: String,
    isMain: { type: Boolean, default: false }
  }],
  videos: [String],
  temperament: [{
    type: String,
    enum: ['friendly', 'aggressive', 'calm', 'playful', 'shy', 'energetic', 'gentle', 'protective']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  interests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Pet', petSchema);