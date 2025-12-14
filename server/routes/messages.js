const express = require('express');
const router = express.Router();
const Message = require('../database/models/Message');
const Reaction = require('../database/models/Reaction');
const User = require('../database/models/User');
const { authenticate } = require('../middleware/auth');
const { validateMessage, validateReaction } = require('../middleware/validation');
const { cacheManager } = require('../redis');

// GET /api/v1/messages/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findById(parseInt(id));
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to get message' });
  }
});

// PATCH /api/v1/messages/:id
router.patch('/:id', authenticate, validateMessage, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { userId } = req.user;
    
    // Check if message exists
    const message = await Message.findById(parseInt(id));
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Check if user is authorized to edit this message
    if (message.username !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }
    
    // Update message
    const updatedMessage = await Message.update(parseInt(id), content.trim());
    
    // Invalidate cache
    await cacheManager.deletePattern(`messages:*`);
    
    res.json({ message: updatedMessage });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// DELETE /api/v1/messages/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    // Check if message exists
    const message = await Message.findById(parseInt(id));
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Check if user is authorized to delete this message
    if (message.username !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }
    
    // Soft delete message
    await Message.delete(parseInt(id));
    
    // Invalidate cache
    await cacheManager.deletePattern(`messages:*`);
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// POST /api/v1/messages/:id/reactions
router.post('/:id/reactions', authenticate, validateReaction, async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const { userId } = req.user;
    
    // Check if message exists
    const message = await Message.findById(parseInt(id));
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Get user info
    const user = await User.findByUsername(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add reaction
    const reaction = await Reaction.create({
      messageId: parseInt(id),
      username: userId,
      emoji: emoji.trim(),
      userId: user.id
    });
    
    if (!reaction) {
      return res.status(400).json({ error: 'You have already reacted with this emoji' });
    }
    
    // Invalidate cache
    await cacheManager.deletePattern(`messages:*`);
    
    res.status(201).json({ reaction });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// DELETE /api/v1/messages/:id/reactions/:emoji
router.delete('/:id/reactions/:emoji', authenticate, async (req, res) => {
  try {
    const { id, emoji } = req.params;
    const { userId } = req.user;
    
    // Check if message exists
    const message = await Message.findById(parseInt(id));
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Get user info
    const user = await User.findByUsername(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove reaction
    const result = await Reaction.deleteByUserId({
      messageId: parseInt(id),
      userId: user.id,
      emoji: decodeURIComponent(emoji)
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Reaction not found' });
    }
    
    // Invalidate cache
    await cacheManager.deletePattern(`messages:*`);
    
    res.json({ success: true, message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

module.exports = router;
