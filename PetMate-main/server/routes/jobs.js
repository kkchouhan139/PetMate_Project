const express = require('express');
const { query, validationResult } = require('express-validator');
const Job = require('../models/Job');

const router = express.Router();

router.get('/', [
  query('status').optional().isIn(['open', 'closed', 'all'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const status = req.query.status || 'open';
    const filter = status === 'all' ? {} : { status };
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
