const express = require('express');
const auth = require('../middleware/auth');
const { upload, enforceContentLength } = require('../middleware/upload');
const Chat = require('../models/Chat');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get user chats (only own chats)
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    }).populate('participants', 'name avatar').populate('match');
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message (only to own chats)
router.post('/message', auth, enforceContentLength(6 * 1024 * 1024), upload.single('image'), [
  body('chatId').notEmpty().withMessage('chatId is required'),
  body('messageType').optional().isIn(['text', 'image']).withMessage('Invalid message type'),
  body('content').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { chatId, content, messageType = 'text' } = req.body;
    
    const chat = await Chat.findById(chatId).populate('participants', 'blockedUsers');
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Verify user is participant in chat
    if (!chat.participants.some((p) => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied. You are not a participant in this chat.' });
    }
    
    // Check if either user has blocked the other
    const otherParticipant = chat.participants.find(p => p._id.toString() !== req.user._id.toString());
    const currentUser = chat.participants.find(p => p._id.toString() === req.user._id.toString());
    
    if (currentUser.blockedUsers?.some(id => id.toString() === otherParticipant._id.toString())) {
      return res.status(403).json({ message: 'You have blocked this user' });
    }
    
    if (otherParticipant.blockedUsers?.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You cannot send messages to this user' });
    }
    
    if (!req.file && !content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = {
      sender: req.user._id,
      content: req.file ? req.file.path : content,
      messageType: req.file ? 'image' : messageType
    };
    
    chat.messages.push(message);
    chat.lastMessage = {
      content: req.file ? 'Photo' : content,
      timestamp: new Date(),
      sender: req.user._id
    };
    
    await chat.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'name avatar blockedUsers')
      .populate('messages.sender', 'name')
      .populate('match');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Verify user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check block status
    const otherParticipant = chat.participants.find(p => p._id.toString() !== req.user._id.toString());
    const currentUser = chat.participants.find(p => p._id.toString() === req.user._id.toString());
    
    const isBlocked = currentUser.blockedUsers?.some(id => id.toString() === otherParticipant._id.toString()) ||
                      otherParticipant.blockedUsers?.some(id => id.toString() === req.user._id.toString());
    
    res.json({ ...chat.toObject(), isBlocked });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
