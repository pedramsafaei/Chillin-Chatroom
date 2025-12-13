const presenceManager = require('../redis/presence');
const sessionManager = require('../redis/session');
const Room = require('../database/models/Room');

// Rate limiting cache (simple in-memory, could use Redis)
const rateLimitCache = new Map();

class MessageValidator {
  constructor() {
    this.MAX_MESSAGE_LENGTH = 500;
    this.RATE_LIMIT_WINDOW = 10000; // 10 seconds
    this.RATE_LIMIT_MAX_MESSAGES = 10; // Max 10 messages per 10 seconds
  }

  // Step 1: Authentication check
  async validateAuthentication(socketId) {
    const sessionData = await sessionManager.getSessionBySocketId(socketId);
    
    if (!sessionData) {
      return {
        valid: false,
        error: 'User not authenticated. Please rejoin the room.',
      };
    }

    const username = sessionData.userId;
    const presence = await presenceManager.getUserPresence(username);

    if (!presence) {
      return {
        valid: false,
        error: 'User presence not found. Please rejoin the room.',
      };
    }

    return { 
      valid: true, 
      user: { 
        username, 
        roomName: presence.currentRoom,
        socketId 
      } 
    };
  }

  // Step 2: Room membership verification
  async validateRoomMembership(username, roomName) {
    const isMember = await presenceManager.isUserInRoom(roomName, username);

    if (!isMember) {
      return {
        valid: false,
        error: 'You are not a member of this room.',
      };
    }

    // Check if room exists in database
    const room = await Room.findByName(roomName);
    if (!room) {
      return {
        valid: false,
        error: 'Room does not exist.',
      };
    }

    return { valid: true, room };
  }

  // Step 3: Content sanitization
  sanitizeContent(message) {
    if (!message || typeof message !== 'string') {
      return {
        valid: false,
        error: 'Message must be a non-empty string.',
      };
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Message cannot be empty.',
      };
    }

    if (trimmed.length > this.MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Message is too long. Maximum ${this.MAX_MESSAGE_LENGTH} characters.`,
      };
    }

    // Basic XSS prevention - remove potential script tags
    const sanitized = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    return { valid: true, sanitized };
  }

  // Step 4: Rate limiting
  checkRateLimit(userId) {
    const now = Date.now();
    const userRateData = rateLimitCache.get(userId) || { messages: [], windowStart: now };

    // Remove old messages outside the window
    userRateData.messages = userRateData.messages.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
    );

    // Check if user exceeded rate limit
    if (userRateData.messages.length >= this.RATE_LIMIT_MAX_MESSAGES) {
      return {
        valid: false,
        error: 'You are sending messages too quickly. Please slow down.',
      };
    }

    // Add current message timestamp
    userRateData.messages.push(now);
    rateLimitCache.set(userId, userRateData);

    // Cleanup old entries periodically
    if (rateLimitCache.size > 10000) {
      this.cleanupRateLimitCache();
    }

    return { valid: true };
  }

  // Cleanup old rate limit entries
  cleanupRateLimitCache() {
    const now = Date.now();
    for (const [userId, data] of rateLimitCache.entries()) {
      if (now - data.windowStart > this.RATE_LIMIT_WINDOW * 2) {
        rateLimitCache.delete(userId);
      }
    }
  }

  // Full validation pipeline
  async validate(socketId, message) {
    // Step 1: Authentication
    const authResult = await this.validateAuthentication(socketId);
    if (!authResult.valid) {
      return authResult;
    }

    const { user } = authResult;

    // Step 2: Room membership
    const membershipResult = await this.validateRoomMembership(user.username, user.roomName);
    if (!membershipResult.valid) {
      return membershipResult;
    }

    // Step 3: Content sanitization
    const contentResult = this.sanitizeContent(message);
    if (!contentResult.valid) {
      return contentResult;
    }

    // Step 4: Rate limiting
    const rateLimitResult = this.checkRateLimit(socketId);
    if (!rateLimitResult.valid) {
      return rateLimitResult;
    }

    return {
      valid: true,
      user,
      room: membershipResult.room,
      sanitizedMessage: contentResult.sanitized,
    };
  }
}

module.exports = new MessageValidator();
