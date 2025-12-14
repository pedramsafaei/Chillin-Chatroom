const express = require('express');
const router = express.Router();
const Room = require('../database/models/Room');
const User = require('../database/models/User');
const Message = require('../database/models/Message');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateCreateRoom, validateUpdateRoom } = require('../middleware/validation');
const { cacheManager } = require('../redis');

// GET /api/v1/rooms
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'created_at', category } = req.query;
    
    // Validate query params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    
    // Try to get from cache first
    const cacheKey = `rooms:list:${pageNum}:${limitNum}:${sort}:${category || 'all'}`;
    let result = await cacheManager.get(cacheKey);
    
    if (!result) {
      result = await Room.findAll({
        page: pageNum,
        limit: limitNum,
        sort,
        category
      });
      
      // Cache for 5 minutes
      await cacheManager.set(cacheKey, result, 300);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// POST /api/v1/rooms
router.post('/', authenticate, validateCreateRoom, async (req, res) => {
  try {
    const { name, description, type, themeColor, icon, maxMembers } = req.body;
    const { userId } = req.user;
    
    // Check if room already exists
    const existingRoom = await Room.findByName(name.toLowerCase());
    if (existingRoom) {
      return res.status(409).json({ error: 'Room with this name already exists' });
    }
    
    // Get user info
    const user = await User.findByUsername(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create room
    const room = await Room.create({
      name: name.trim(),
      description: description || '',
      creator: userId,
      isPrivate: type === 'private',
      themeColor: themeColor || '#4A90E2',
      icon: icon || '💬',
      maxMembers: maxMembers || null
    });
    
    // Add creator as owner
    await Room.addMember(room.id, user.id, 'owner');
    
    // Invalidate cache
    await cacheManager.deletePattern('rooms:list:*');
    
    res.status(201).json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/v1/rooms/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await Room.getRoomWithCounts(parseInt(id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Remove password from response
    const { password: _, ...roomWithoutPassword } = room;
    
    res.json({ room: roomWithoutPassword });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// PATCH /api/v1/rooms/:id
router.patch('/:id', authenticate, validateUpdateRoom, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, settings } = req.body;
    const { userId } = req.user;
    
    // Check if room exists
    const room = await Room.findById(parseInt(id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Check if user is owner/admin (simplified - checking creator)
    if (room.creator !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this room' });
    }
    
    // Build updates object
    const updates = {};
    if (name !== undefined) {
      updates.name = name.trim();
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (description !== undefined) updates.description = description;
    if (settings !== undefined) updates.settings = settings;
    
    // Update room
    const updatedRoom = await Room.updateById(parseInt(id), updates);
    
    // Invalidate cache
    await cacheManager.deletePattern('rooms:list:*');
    
    res.json({ room: updatedRoom });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /api/v1/rooms/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    // Check if room exists
    const room = await Room.findById(parseInt(id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Check if user is owner
    if (room.creator !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this room' });
    }
    
    // Delete room (will cascade delete members and messages)
    await Room.delete(parseInt(id));
    
    // Invalidate cache
    await cacheManager.deletePattern('rooms:list:*');
    await cacheManager.deletePattern(`messages:${room.name}:*`);
    
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// POST /api/v1/rooms/:id/join
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    // Check if room exists
    const room = await Room.findById(parseInt(id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get user info
    const user = await User.findByUsername(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if room has max members limit
    if (room.max_members && room.member_count >= room.max_members) {
      return res.status(400).json({ error: 'Room is full' });
    }
    
    // Add user to room
    const membership = await Room.addMember(room.id, user.id, 'member');
    
    if (!membership) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }
    
    // Invalidate cache
    await cacheManager.deletePattern('rooms:list:*');
    
    res.status(201).json({ membership });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// POST /api/v1/rooms/:id/leave
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    // Check if room exists
    const room = await Room.findById(parseInt(id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get user info
    const user = await User.findByUsername(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove user from room
    await Room.removeMember(room.id, user.id);
    
    // Invalidate cache
    await cacheManager.deletePattern('rooms:list:*');
    
    res.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// GET /api/v1/rooms/:id/members
router.get('/:id/members', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 50 } = req.query;
    
    // Check if room exists
    const room = await Room.findById(parseInt(id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Validate query params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    
    const result = await Room.getMembers(parseInt(id), {
      status,
      page: pageNum,
      limit: limitNum
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get room members error:', error);
    res.status(500).json({ error: 'Failed to get room members' });
  }
});

// GET /api/v1/rooms/:id/messages
router.get('/:id/messages', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 50 } = req.query;
    
    // Check if room exists
    const room = await Room.findById(parseInt(id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Validate query params
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const beforeId = before ? parseInt(before) : null;
    
    // Try to get from cache if no 'before' param
    let result;
    if (!beforeId) {
      const cacheKey = `messages:room:${id}:${limitNum}`;
      result = await cacheManager.get(cacheKey);
      
      if (!result) {
        result = await Message.findByRoomId(parseInt(id), {
          limit: limitNum
        });
        
        // Cache for 1 minute
        await cacheManager.set(cacheKey, result, 60);
      }
    } else {
      result = await Message.findByRoomId(parseInt(id), {
        before: beforeId,
        limit: limitNum
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ error: 'Failed to get room messages' });
  }
});

module.exports = router;
