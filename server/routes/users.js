const express = require('express');
const router = express.Router();
const User = require('../database/models/User');
const { authenticate } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');
const { StorageManager } = require('../storage/s3Client');

// GET /api/v1/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PATCH /api/v1/users/:id
router.patch('/:id', authenticate, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, avatar, statusMessage } = req.body;
    
    // Check if user exists
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is authorized to update this profile
    if (user.username !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }
    
    // Build updates object
    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (avatar !== undefined) updates.avatar = avatar;
    if (statusMessage !== undefined) updates.status_message = statusMessage;
    
    // Update user
    const updatedUser = await User.updateById(parseInt(id), updates);
    
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/v1/users/:id/rooms
router.get('/:id/rooms', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is authorized to view this data
    if (user.username !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view this user\'s rooms' });
    }
    
    const rooms = await User.getUserRooms(parseInt(id));
    
    res.json({ rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Failed to get user rooms' });
  }
});

// POST /api/v1/users/:id/avatar
router.post('/:id/avatar', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is authorized to update this profile
    if (user.username !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }
    
    // For now, return error since we need multipart form data support
    // This would require multer or similar middleware
    // Client should use the presigned URL upload flow instead
    return res.status(501).json({ 
      error: 'Direct avatar upload not implemented. Please use /api/v1/uploads/presign for file uploads.' 
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

module.exports = router;
