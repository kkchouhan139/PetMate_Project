const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { body, validationResult, query } = require('express-validator');
const https = require('https');

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

const reverseGeocode = (lat, lng) => new Promise((resolve, reject) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('addressdetails', '1');

  const req = https.get(
    url,
    {
      headers: {
        'User-Agent': process.env.GEOCODE_USER_AGENT || 'PetMate (contact: sakshamswaroop0812@gmail.com)'
      }
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Failed to parse geocode response'));
        }
      });
    }
  );

  req.on('error', (error) => reject(error));
  req.setTimeout(5000, () => {
    req.destroy(new Error('Geocode request timed out'));
  });
});

router.get('/reverse-geocode', auth, [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude is invalid'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude is invalid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { lat, lng } = req.query;
    const geo = await reverseGeocode(lat, lng);
    const address = geo?.address || {};

    const addressLineParts = [
      address.house_number,
      address.road,
      address.neighbourhood,
      address.suburb,
      address.city_district
    ].filter(Boolean);

    const city = address.city || address.town || address.village || address.hamlet || address.municipality || '';
    const district = address.state_district || address.county || address.district || '';
    const state = address.state || '';
    const addressLine = addressLineParts.join(', ') || geo?.display_name || '';

    res.json({
      addressLine,
      city,
      district,
      state
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to resolve location' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('pets');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().isString().isLength({ min: 2 }).withMessage('Name is too short'),
  body('phone').optional().isString().isLength({ min: 6 }).withMessage('Phone is invalid'),
  body('location.city').optional().isString(),
  body('location.district').optional().isString(),
  body('location.state').optional().isString(),
  body('location.addressLine').optional().isString(),
  body('contactPreferences.allowChat').optional().isBoolean(),
  body('contactPreferences.hidePhone').optional().isBoolean(),
  body('avatar').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const allowedFields = [
      'name',
      'phone',
      'location',
      'contactPreferences',
      'avatar'
    ];
    const updates = Object.keys(req.body).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});
    if (updates.location) {
      updates.location = buildLocation(updates.location);
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Schedule profile deletion (soft delete for 30 days)
router.delete('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const deletionScheduledAt = new Date();
    const deletedAt = new Date(deletionScheduledAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      userId,
      { deletionScheduledAt, deletedAt },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile deletion scheduled. Your data will be permanently deleted after 30 days.',
      deletionScheduledAt: user.deletionScheduledAt,
      deletedAt: user.deletedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Optional: Cancel scheduled deletion
router.post('/profile/cancel-deletion', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { deletionScheduledAt: '', deletedAt: '' } },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile deletion canceled.',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
