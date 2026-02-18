const express = require('express');
const auth = require('../middleware/auth');
const Pet = require('../models/Pet');
const Match = require('../models/Match');
const Chat = require('../models/Chat');
const { body, validationResult, param } = require('express-validator');

const router = express.Router();

// Send interest (only to own pets)
router.post('/interest', auth, [
  body('petId').notEmpty().withMessage('petId is required'),
  body('targetPetId').notEmpty().withMessage('targetPetId is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { petId, targetPetId } = req.body;
    
    // Verify user owns the pet sending interest
    const userPet = await Pet.findOne({ _id: petId, owner: req.user._id });
    if (!userPet) {
      return res.status(403).json({ message: 'You can only send interests from your own pets' });
    }
    
    const targetPet = await Pet.findById(targetPetId);
    if (!targetPet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    if (!targetPet.isActive) {
      return res.status(400).json({ message: 'Pet is not active' });
    }

    // Prevent self-interest
    if (targetPet.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send interest to your own pet' });
    }
    
    // Check if interest already exists
    const existingInterest = targetPet.interests.find(
      interest => interest.from.toString() === petId.toString()
    );
    if (existingInterest) {
      return res.status(400).json({ message: 'Interest already sent' });
    }
    
    // Add interest to target pet
    targetPet.interests.push({
      from: petId,
      status: 'pending'
    });
    await targetPet.save();
    
    res.json({ message: 'Interest sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user matches
router.get('/', auth, async (req, res) => {
  try {
    const userPets = await Pet.find({ owner: req.user._id });
    const petIds = userPets.map(pet => pet._id);
    
    const matches = await Match.find({
      $or: [
        { pet1: { $in: petIds } },
        { pet2: { $in: petIds } }
      ]
    }).populate('pet1 pet2');
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept/Reject Interest (only pet owner)
router.put('/interest/:interestId', auth, [
  param('interestId').notEmpty().withMessage('interestId is required'),
  body('action').isIn(['accepted', 'rejected']).withMessage('Invalid action'),
  body('petId').notEmpty().withMessage('petId is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { interestId } = req.params;
    const { action, petId } = req.body; // action: 'accept' or 'reject'
    
    // Verify user owns the pet receiving interest
    const pet = await Pet.findOne({ _id: petId, owner: req.user._id });
    if (!pet) {
      return res.status(403).json({ message: 'You can only manage interests for your own pets' });
    }
    
    const interest = pet.interests.id(interestId);
    if (!interest) {
      return res.status(404).json({ message: 'Interest not found' });
    }

    if (interest.status !== 'pending') {
      return res.status(400).json({ message: 'Interest already processed' });
    }
    
    interest.status = action;
    await pet.save();
    
    // If accepted, create match and chat
    if (action === 'accepted') {
      const existingMatch = await Match.findOne({
        $or: [
          { pet1: interest.from, pet2: petId },
          { pet1: petId, pet2: interest.from }
        ]
      });
      if (existingMatch) {
        return res.json({ message: 'Interest accepted successfully' });
      }

      const match = new Match({
        pet1: interest.from,
        pet2: petId
      });
      await match.save();
      
      // Create chat for the match
      const senderPet = await Pet.findById(interest.from).populate('owner');
      const chat = new Chat({
        participants: [req.user._id, senderPet.owner._id],
        match: match._id
      });
      await chat.save();
      
      match.chatId = chat._id;
      await match.save();
    }
    
    res.json({ message: `Interest ${action} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
