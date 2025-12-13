const { getCacheClient } = require('./connection');

// Presence tracking using Redis
class PresenceManager {
  constructor() {
    this.PRESENCE_PREFIX = 'presence:';
    this.ROOM_MEMBERS_PREFIX = 'room:';
    this.ROOM_TYPING_PREFIX = 'room:';
    this.PRESENCE_TIMEOUT = 300; // 5 minutes in seconds
    this.TYPING_TIMEOUT = 5; // 5 seconds for typing indicators
  }

  // Set user presence using HASH
  async setUserPresence(userId, presenceData) {
    const client = getCacheClient();
    const presenceKey = `${this.PRESENCE_PREFIX}${userId}`;
    
    const data = {
      status: presenceData.status || 'online',
      currentRoom: presenceData.currentRoom || '',
      lastActivity: Date.now().toString(),
      typing: presenceData.typing || 'false'
    };

    await client.hSet(presenceKey, data);
    await client.expire(presenceKey, this.PRESENCE_TIMEOUT);
  }

  // Get user presence
  async getUserPresence(userId) {
    const client = getCacheClient();
    const presenceKey = `${this.PRESENCE_PREFIX}${userId}`;
    const presenceData = await client.hGetAll(presenceKey);
    
    if (!presenceData || Object.keys(presenceData).length === 0) {
      return null;
    }
    
    return presenceData;
  }

  // Update presence field
  async updatePresenceField(userId, field, value) {
    const client = getCacheClient();
    const presenceKey = `${this.PRESENCE_PREFIX}${userId}`;
    
    await client.hSet(presenceKey, {
      [field]: value.toString(),
      lastActivity: Date.now().toString()
    });
    await client.expire(presenceKey, this.PRESENCE_TIMEOUT);
  }

  // Refresh presence TTL (heartbeat)
  async refreshPresence(userId) {
    const client = getCacheClient();
    const presenceKey = `${this.PRESENCE_PREFIX}${userId}`;
    const exists = await client.exists(presenceKey);
    
    if (exists) {
      await client.hSet(presenceKey, 'lastActivity', Date.now().toString());
      await client.expire(presenceKey, this.PRESENCE_TIMEOUT);
      return true;
    }
    return false;
  }

  // Delete user presence
  async deleteUserPresence(userId) {
    const client = getCacheClient();
    const presenceKey = `${this.PRESENCE_PREFIX}${userId}`;
    await client.del(presenceKey);
  }

  // Add user to room members (SET)
  async addUserToRoom(roomId, userId) {
    const client = getCacheClient();
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${roomId}:members`;
    await client.sAdd(roomKey, userId);
  }

  // Remove user from room members
  async removeUserFromRoom(roomId, userId) {
    const client = getCacheClient();
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${roomId}:members`;
    await client.sRem(roomKey, userId);
  }

  // Get all members in a room
  async getRoomMembers(roomId) {
    const client = getCacheClient();
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${roomId}:members`;
    return await client.sMembers(roomKey);
  }

  // Check if user is in room
  async isUserInRoom(roomId, userId) {
    const client = getCacheClient();
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${roomId}:members`;
    return await client.sIsMember(roomKey, userId);
  }

  // Get room member count
  async getRoomMemberCount(roomId) {
    const client = getCacheClient();
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${roomId}:members`;
    return await client.sCard(roomKey);
  }

  // Add typing indicator (SORTED SET with timestamp as score)
  async setUserTyping(roomId, userId) {
    const client = getCacheClient();
    const typingKey = `${this.ROOM_TYPING_PREFIX}${roomId}:typing`;
    const timestamp = Date.now();
    
    await client.zAdd(typingKey, { score: timestamp, value: userId });
    await client.expire(typingKey, this.TYPING_TIMEOUT * 2); // Double timeout for safety
  }

  // Remove typing indicator
  async removeUserTyping(roomId, userId) {
    const client = getCacheClient();
    const typingKey = `${this.ROOM_TYPING_PREFIX}${roomId}:typing`;
    await client.zRem(typingKey, userId);
  }

  // Get users currently typing (auto-cleanup old entries)
  async getUsersTyping(roomId) {
    const client = getCacheClient();
    const typingKey = `${this.ROOM_TYPING_PREFIX}${roomId}:typing`;
    const cutoffTime = Date.now() - (this.TYPING_TIMEOUT * 1000);
    
    // Remove old entries
    await client.zRemRangeByScore(typingKey, 0, cutoffTime);
    
    // Get remaining typing users
    return await client.zRange(typingKey, 0, -1);
  }

  // Clean up old typing indicators
  async cleanupTypingIndicators(roomId) {
    const client = getCacheClient();
    const typingKey = `${this.ROOM_TYPING_PREFIX}${roomId}:typing`;
    const cutoffTime = Date.now() - (this.TYPING_TIMEOUT * 1000);
    
    await client.zRemRangeByScore(typingKey, 0, cutoffTime);
  }

  // Legacy compatibility methods
  async addUserToRoom_Legacy(socketId, username, roomName) {
    await this.setUserPresence(username, {
      status: 'online',
      currentRoom: roomName,
      typing: 'false'
    });
    await this.addUserToRoom(roomName, username);
  }

  async removeUserFromRoom_Legacy(socketId) {
    // For legacy compatibility - requires session lookup
    // In practice, we'll need to pass userId explicitly
    return null;
  }

  async getUser(socketId) {
    // Legacy method - would need session manager to map socketId to userId
    // Keeping for backward compatibility
    return null;
  }

  async getUsersInRoom(roomName) {
    const members = await this.getRoomMembers(roomName);
    return members.map(username => ({ username, roomName }));
  }

  async updatePresence(socketId) {
    // Legacy method - would need session manager
    return;
  }

  async isUserOnline(username) {
    const presence = await this.getUserPresence(username);
    return presence !== null && presence.status === 'online';
  }
}

module.exports = new PresenceManager();
