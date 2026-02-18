const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  location: { type: String, trim: true },
  type: { type: String, trim: true },
  description: { type: String, required: true, trim: true },
  requirements: { type: [String], default: [] },
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
