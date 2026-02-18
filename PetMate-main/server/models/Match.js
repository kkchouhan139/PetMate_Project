const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  pet1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  pet2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  status: {
    type: String,
    enum: ['matched', 'completed', 'cancelled'],
    default: 'matched'
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  meetupDetails: {
    location: String,
    date: Date,
    notes: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);