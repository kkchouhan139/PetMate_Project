const express = require('express');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { checkPetOwnership } = require('../middleware/authorize');
const { upload, enforceContentLength } = require('../middleware/upload');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { body, validationResult, query } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

// Create pet profile with photo upload
router.post('/', auth, enforceContentLength(30 * 1024 * 1024), upload.array('photos', 5), [
  body('name').notEmpty().withMessage('Name is required'),
  body('species').isIn(['dog', 'cat', 'bird', 'rabbit', 'other']).withMessage('Invalid species'),
  body('breed').notEmpty().withMessage('Breed is required'),
  body('gender').isIn(['male', 'female']).withMessage('Invalid gender'),
  body('age.years').notEmpty().withMessage('Age is required'),
  body('weight').notEmpty().withMessage('Weight is required'),
  body('size').isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Invalid size'),
  body('vaccination.isVaccinated').notEmpty().withMessage('Vaccination status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const petData = {
      ...req.body,
      owner: req.user._id,
      photos: req.files?.map((file, index) => ({
        url: file.path,
        isMain: req.body[`photoMeta[${index}]`] ? JSON.parse(req.body[`photoMeta[${index}]`]).isMain : false
      })) || []
    };

    // Parse JSON fields
    if (req.body.temperament) {
      let parsed = req.body.temperament;
      if (typeof parsed === 'string') {
        const trimmed = parsed.trim();
        if (trimmed === '' || trimmed === 'false' || trimmed === 'null' || trimmed === 'undefined') {
          parsed = [];
        } else {
          try {
            parsed = JSON.parse(trimmed);
          } catch (error) {
            parsed = trimmed.split(',').map((t) => t.trim()).filter(Boolean);
          }
        }
      }
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
      const allowedTemperaments = [
        'friendly',
        'aggressive',
        'calm',
        'playful',
        'shy',
        'energetic',
        'gentle',
        'protective'
      ];
      petData.temperament = parsed.filter((t) => allowedTemperaments.includes(String(t).toLowerCase()));
    }

    const pet = new Pet(petData);
    await pet.save();

    // Add pet to user's pets array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pets: pet._id }
    });

    const populatedPet = await Pet.findById(pet._id).populate('owner', 'name location');
    res.status(201).json(populatedPet);
  } catch (error) {
    logger.error('Pet creation error', error?.message || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pets with advanced filters and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      species, breed, gender, city, district, state, minAge, maxAge, size,
      vaccinated, page = 1, limit = 12, sortBy = 'createdAt',
      sortOrder = 'desc', search, lat, lng, radius
    } = req.query;

    const filter = { isActive: true };
    const allowedSortFields = ['createdAt', 'views', 'name', 'age.years'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Build filter object
    if (species) filter.species = species;
    if (breed && breed !== 'all') filter.breed = new RegExp(breed, 'i');
    if (gender) filter.gender = gender;
    if (size) filter.size = size;
    if (vaccinated === 'true') filter['vaccination.isVaccinated'] = true;
    
    if (minAge || maxAge) {
      filter['age.years'] = {};
      if (minAge) filter['age.years'].$gte = parseInt(minAge);
      if (maxAge) filter['age.years'].$lte = parseInt(maxAge);
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { breed: new RegExp(search, 'i') }
      ];
    }

    // Location-based filtering
    if (radius && (!lat || !lng)) {
      return res.status(400).json({ message: 'Location is required for distance filter' });
    }
    if (lat && lng && radius) {
      const radiusInKm = parseFloat(radius);
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!Number.isNaN(radiusInKm) && !Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        const users = await User.find({
          'location.geo': {
            $geoWithin: {
              $centerSphere: [[lngNum, latNum], radiusInKm / 6378.1]
            }
          }
        }).select('_id');
        filter.owner = { $in: users.map(u => u._id) };
      }
    } else if (city || district || state) {
      const userFilter = {};
      if (city) userFilter['location.city'] = new RegExp(city, 'i');
      if (district) userFilter['location.district'] = new RegExp(district, 'i');
      if (state) userFilter['location.state'] = new RegExp(state, 'i');

      const users = await User.find(userFilter).select('_id');
      filter.owner = { $in: users.map((u) => u._id) };
    }

    const safeLimit = Math.min(parseInt(limit) || 12, 50);
    const safePage = parseInt(page) || 1;
    const skip = (safePage - 1) * safeLimit;
    
    const [pets, total] = await Promise.all([
      Pet.find(filter)
        .populate('owner', 'name location contactPreferences')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit),
      Pet.countDocuments(filter)
    ]);

    res.json({
      pets,
      pagination: {
        current: safePage,
        pages: Math.ceil(total / safeLimit),
        total,
        hasNext: skip + pets.length < total,
        hasPrev: safePage > 1
      }
    });
  } catch (error) {
    logger.error('Pet search error', error?.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's pets
router.get('/my-pets', auth, async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user._id, isActive: true })
      .populate('interests.from', 'name photos breed species owner');
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific pet with view tracking
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('owner', 'name location contactPreferences isVerified')
      .populate('interests.from', 'name photos owner');
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Increment view count (but not for owner)
    if (req.user && pet.owner._id.toString() !== req.user._id.toString()) {
      await Pet.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }

    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update pet profile (only owner)
router.put('/:id', auth, checkPetOwnership, [
  body('name').optional().isString(),
  body('species').optional().isIn(['dog', 'cat', 'bird', 'rabbit', 'other']),
  body('breed').optional().isString(),
  body('gender').optional().isIn(['male', 'female']),
  body('age').optional().isObject(),
  body('weight').optional().isNumeric(),
  body('size').optional().isIn(['small', 'medium', 'large', 'extra-large']),
  body('vaccination').optional().isObject(),
  body('health').optional().isObject(),
  body('videos').optional().isArray(),
  body('temperament').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const allowedFields = [
      'name',
      'species',
      'breed',
      'gender',
      'age',
      'weight',
      'size',
      'vaccination',
      'health',
      'videos',
      'temperament',
      'isActive'
    ];
    const updates = Object.keys(req.body).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});
    const pet = await Pet.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete pet (only owner)
router.delete('/:id', auth, checkPetOwnership, async (req, res) => {
  try {
    await Pet.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Pet profile deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
