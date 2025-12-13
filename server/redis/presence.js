const { getCacheClient } = require('./connection');

// Presence tracking using Redis
class PresenceManager {
  constructor() {
    this.PRESENCE_PREFIX = 'presence:';
    this.ROOM_MEMBERS_PREFIX = 'room:members:';
    this.USER_SESSION_PREFIX = 'user:session:';
    this.PRESENCE_TIMEOUT = 300; // 5 minutes in seconds
  }

  // Add user to a room
  async addUserToRoom(socketId, username, roomName) {
    const client = getCacheClient();
    const userKey = `${this.PRESENCE_PREFIX}${socketId}`;
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${roomName}`;
    const sessionKey = `${this.USER_SESSION_PREFIX}${username}`;

    const userData = JSON.stringify({
      socketId,
      username,
      roomName,
      joinedAt: Date.now(),
    });

    await Promise.all([
      client.setEx(userKey, this.PRESENCE_TIMEOUT, userData),
      client.sAdd(roomKey, socketId),
      client.setEx(sessionKey, this.PRESENCE_TIMEOUT, socketId),
    ]);
  }

  // Remove user from room
  async removeUserFromRoom(socketId) {
    const client = getCacheClient();
    const userKey = `${this.PRESENCE_PREFIX}${socketId}`;

    const userData = await client.get(userKey);
    if (!userData) return null;

    const user = JSON.parse(userData);
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${user.roomName}`;
    const sessionKey = `${this.USER_SESSION_PREFIX}${user.username}`;

    await Promise.all([
      client.del(userKey),
      client.sRem(roomKey, socketId),
      client.del(sessionKey),
    ]);

    return user;
  }

  // Get user by socket ID
  async getUser(socketId) {
    const client = getCacheClient();
    const userKey = `${this.PRESENCE_PREFIX}${socketId}`;
    const userData = await client.get(userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Get all users in a room
  async getUsersInRoom(roomName) {
    const client = getCacheClient();
    const roomKey = `${this.ROOM_MEMBERS_PREFIX}${roomName}`;
    const socketIds = await client.sMembers(roomKey);

    const users = await Promise.all(
      socketIds.map(async (socketId) => {
        const user = await this.getUser(socketId);
        return user;
      })
    );

    return users.filter(Boolean);
  }

  // Update user's last seen timestamp
  async updatePresence(socketId) {
    const client = getCacheClient();
    const userKey = `${this.PRESENCE_PREFIX}${socketId}`;
    const userData = await client.get(userKey);
    
    if (userData) {
      await client.expire(userKey, this.PRESENCE_TIMEOUT);
    }
  }

  // Check if user is online
  async isUserOnline(username) {
    const client = getCacheClient();
    const sessionKey = `${this.USER_SESSION_PREFIX}${username}`;
    const socketId = await client.get(sessionKey);
    return !!socketId;
  }
}

module.exports = new PresenceManager();
