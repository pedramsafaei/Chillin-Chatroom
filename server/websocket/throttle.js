/**
 * Throttle manager for WebSocket events
 * Prevents event flooding by rate-limiting specific events per user
 */
class ThrottleManager {
  constructor() {
    // Map of userId -> Map of eventName -> lastTimestamp
    this.throttles = new Map();
  }

  /**
   * Check if an event should be throttled
   * @param {string} userId - User identifier
   * @param {string} eventName - Event name
   * @param {number} throttleMs - Throttle duration in milliseconds
   * @returns {boolean} - True if throttled (should not execute), false if allowed
   */
  isThrottled(userId, eventName, throttleMs) {
    if (!this.throttles.has(userId)) {
      this.throttles.set(userId, new Map());
    }

    const userThrottles = this.throttles.get(userId);
    const lastTimestamp = userThrottles.get(eventName);
    const now = Date.now();

    if (lastTimestamp && (now - lastTimestamp) < throttleMs) {
      return true; // Throttled
    }

    // Update timestamp
    userThrottles.set(eventName, now);
    return false; // Not throttled
  }

  /**
   * Clear throttle data for a user
   * @param {string} userId - User identifier
   */
  clearUser(userId) {
    this.throttles.delete(userId);
  }

  /**
   * Clear all throttle data (cleanup)
   */
  clearAll() {
    this.throttles.clear();
  }
}

// Export singleton instance
module.exports = new ThrottleManager();
