const { getCacheClient } = require('./connection');
const redis = require('redis');

class PubSubManager {
  constructor() {
    this.subscribers = new Map();
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  }

  // Create a dedicated subscriber client for a channel
  async createSubscriber(channelPattern) {
    if (this.subscribers.has(channelPattern)) {
      return this.subscribers.get(channelPattern);
    }

    const subscriber = redis.createClient({ url: this.redisUrl });
    subscriber.on('error', (err) => console.error(`Redis Subscriber Error (${channelPattern}):`, err));
    await subscriber.connect();
    
    this.subscribers.set(channelPattern, subscriber);
    return subscriber;
  }

  // Publish to a room channel
  async publishToRoom(roomId, message) {
    const client = getCacheClient();
    const channel = `room:${roomId}`;
    
    const data = JSON.stringify({
      type: 'room_message',
      roomId,
      message,
      timestamp: Date.now()
    });

    await client.publish(channel, data);
  }

  // Subscribe to a room channel
  async subscribeToRoom(roomId, callback) {
    const channel = `room:${roomId}`;
    const subscriber = await this.createSubscriber(channel);

    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error parsing room message:', error);
      }
    });

    return () => subscriber.unsubscribe(channel);
  }

  // Publish to a user channel (direct notifications)
  async publishToUser(userId, notification) {
    const client = getCacheClient();
    const channel = `user:${userId}`;
    
    const data = JSON.stringify({
      type: 'user_notification',
      userId,
      notification,
      timestamp: Date.now()
    });

    await client.publish(channel, data);
  }

  // Subscribe to a user channel
  async subscribeToUser(userId, callback) {
    const channel = `user:${userId}`;
    const subscriber = await this.createSubscriber(channel);

    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error parsing user notification:', error);
      }
    });

    return () => subscriber.unsubscribe(channel);
  }

  // Publish presence update
  async publishPresenceUpdate(userId, presenceData) {
    const client = getCacheClient();
    const channel = 'presence';
    
    const data = JSON.stringify({
      type: 'presence_update',
      userId,
      presence: presenceData,
      timestamp: Date.now()
    });

    await client.publish(channel, data);
  }

  // Subscribe to presence updates
  async subscribeToPresence(callback) {
    const channel = 'presence';
    const subscriber = await this.createSubscriber(channel);

    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error parsing presence update:', error);
      }
    });

    return () => subscriber.unsubscribe(channel);
  }

  // Publish system-wide announcement
  async publishSystemMessage(announcement) {
    const client = getCacheClient();
    const channel = 'system';
    
    const data = JSON.stringify({
      type: 'system_announcement',
      announcement,
      timestamp: Date.now()
    });

    await client.publish(channel, data);
  }

  // Subscribe to system announcements
  async subscribeToSystem(callback) {
    const channel = 'system';
    const subscriber = await this.createSubscriber(channel);

    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error parsing system message:', error);
      }
    });

    return () => subscriber.unsubscribe(channel);
  }

  // Publish typing indicator
  async publishTypingIndicator(roomId, userId, isTyping) {
    const client = getCacheClient();
    const channel = `room:${roomId}`;
    
    const data = JSON.stringify({
      type: 'typing_indicator',
      roomId,
      userId,
      isTyping,
      timestamp: Date.now()
    });

    await client.publish(channel, data);
  }

  // Generic publish method
  async publish(channel, data) {
    const client = getCacheClient();
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    await client.publish(channel, message);
  }

  // Generic subscribe method
  async subscribe(channel, callback) {
    const subscriber = await this.createSubscriber(channel);

    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        // If not JSON, pass as string
        callback(message);
      }
    });

    return () => subscriber.unsubscribe(channel);
  }

  // Pattern subscribe (for wildcards)
  async psubscribe(pattern, callback) {
    const subscriber = await this.createSubscriber(pattern);

    await subscriber.pSubscribe(pattern, (message, channel) => {
      try {
        const data = JSON.parse(message);
        callback(data, channel);
      } catch (error) {
        callback(message, channel);
      }
    });

    return () => subscriber.pUnsubscribe(pattern);
  }

  // Clean up all subscribers
  async cleanup() {
    for (const [channel, subscriber] of this.subscribers) {
      try {
        await subscriber.quit();
      } catch (error) {
        console.error(`Error closing subscriber for ${channel}:`, error);
      }
    }
    this.subscribers.clear();
  }

  // Get number of subscribers to a channel
  async getSubscriberCount(channel) {
    const client = getCacheClient();
    const result = await client.pubSubNumSub(channel);
    return result[channel] || 0;
  }
}

module.exports = new PubSubManager();
