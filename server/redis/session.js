const { getCacheClient } = require('./connection');
const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.SESSION_PREFIX = 'session:';
    this.SESSION_TIMEOUT = 86400; // 24 hours in seconds
  }

  // Create a new session
  async createSession(username, userData = {}) {
    const client = getCacheClient();
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;

    const sessionData = JSON.stringify({
      sessionId,
      username,
      ...userData,
      createdAt: Date.now(),
    });

    await client.setEx(sessionKey, this.SESSION_TIMEOUT, sessionData);
    return sessionId;
  }

  // Get session data
  async getSession(sessionId) {
    const client = getCacheClient();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionData = await client.get(sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  // Update session
  async updateSession(sessionId, updates) {
    const client = getCacheClient();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionData = await this.getSession(sessionId);

    if (!sessionData) return null;

    const updatedData = JSON.stringify({
      ...sessionData,
      ...updates,
      updatedAt: Date.now(),
    });

    await client.setEx(sessionKey, this.SESSION_TIMEOUT, updatedData);
    return JSON.parse(updatedData);
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
}

module.exports = new SessionManager();
