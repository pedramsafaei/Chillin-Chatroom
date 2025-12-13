const { getCacheClient } = require('./connection');
const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.SESSION_PREFIX = 'session:';
    this.SESSION_TIMEOUT = 604800; // 7 days in seconds
  }

  // Create a new session using HASH
  async createSession(userId, socketId, metadata = {}) {
    const client = getCacheClient();
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;

    const sessionData = {
      userId: userId,
      socketId: socketId,
      connectedAt: Date.now().toString(),
      userAgent: metadata.userAgent || 'unknown',
      ip: metadata.ip || 'unknown'
    };

    // Store as HASH
    await client.hSet(sessionKey, sessionData);
    await client.expire(sessionKey, this.SESSION_TIMEOUT);
    
    return sessionId;
  }

  // Get session data from HASH
  async getSession(sessionId) {
    const client = getCacheClient();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionData = await client.hGetAll(sessionKey);
    
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return null;
    }
    
    return sessionData;
  }

  // Update session fields
  async updateSession(sessionId, updates) {
    const client = getCacheClient();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    
    const exists = await client.exists(sessionKey);
    if (!exists) return null;

    // Update specific fields
    await client.hSet(sessionKey, updates);
    await client.expire(sessionKey, this.SESSION_TIMEOUT);
    
    return await this.getSession(sessionId);
  }

  // Delete session
  async deleteSession(sessionId) {
    const client = getCacheClient();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await client.del(sessionKey);
  }

  // Refresh session expiry
  async refreshSession(sessionId) {
    const client = getCacheClient();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const exists = await client.exists(sessionKey);
    
    if (exists) {
      await client.expire(sessionKey, this.SESSION_TIMEOUT);
      return true;
    }
    return false;
  }

  // Get session by socket ID
  async getSessionBySocketId(socketId) {
    const client = getCacheClient();
    const pattern = `${this.SESSION_PREFIX}*`;
    const keys = await client.keys(pattern);
    
    for (const key of keys) {
      const sessionData = await client.hGetAll(key);
      if (sessionData.socketId === socketId) {
        return { sessionId: key.replace(this.SESSION_PREFIX, ''), ...sessionData };
      }
    }
    
    return null;
  }
}

module.exports = new SessionManager();
