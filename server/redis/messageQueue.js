const { getCacheClient } = require('./connection');

class MessageQueue {
  constructor() {
    this.QUEUE_PREFIX = 'queue:';
    this.QUEUE_TIMEOUT = 86400; // 24 hours in seconds
  }

  // Enqueue a message for an offline user
  async enqueueMessage(userId, messageData) {
    const client = getCacheClient();
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    const message = JSON.stringify({
      ...messageData,
      queuedAt: Date.now()
    });

    // Push to the end of the list (RPUSH)
    await client.rPush(queueKey, message);
    
    // Set TTL on the queue
    await client.expire(queueKey, this.QUEUE_TIMEOUT);
  }

  // Enqueue multiple messages
  async enqueueMessages(userId, messages) {
    const client = getCacheClient();
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    if (messages.length === 0) return;

    const serializedMessages = messages.map(msg => 
      JSON.stringify({
        ...msg,
        queuedAt: Date.now()
      })
    );

    // Push all messages to the list
    await client.rPush(queueKey, serializedMessages);
    
    // Set TTL on the queue
    await client.expire(queueKey, this.QUEUE_TIMEOUT);
  }

  // Retrieve all queued messages for a user
  async getQueuedMessages(userId) {
    const client = getCacheClient();
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    const messages = await client.lRange(queueKey, 0, -1);
    
    return messages.map(msg => {
      try {
        return JSON.parse(msg);
      } catch (error) {
        console.error('Error parsing queued message:', error);
        return null;
      }
    }).filter(Boolean);
  }

  // Retrieve and remove (pop) all queued messages
  async dequeueMessages(userId) {
    const client = getCacheClient();
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    // Get all messages
    const messages = await this.getQueuedMessages(userId);
    
    // Clear the queue
    await client.del(queueKey);
    
    return messages;
  }

  // Get queue length
  async getQueueLength(userId) {
    const client = getCacheClient();
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    return await client.lLen(queueKey);
  }

  // Clear queue for a user
  async clearQueue(userId) {
    const client = getCacheClient();
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    await client.del(queueKey);
  }

  // Check if user has queued messages
  async hasQueuedMessages(userId) {
    const length = await this.getQueueLength(userId);
    return length > 0;
  }

  // Peek at next message without removing it
  async peekNextMessage(userId) {
    const client = getCacheClient();
    const queueKey = `${this.QUEUE_PREFIX}${userId}`;
    
    const message = await client.lIndex(queueKey, 0);
    
    if (!message) return null;
    
    try {
      return JSON.parse(message);
    } catch (error) {
      console.error('Error parsing queued message:', error);
      return null;
    }
  }

  // Remove old queued messages (cleanup)
  async cleanupExpiredQueues() {
    // This would require scanning keys, which is expensive
    // Better to rely on Redis TTL expiration
    // This method is here for completeness but shouldn't be called regularly
    const client = getCacheClient();
    const pattern = `${this.QUEUE_PREFIX}*`;
    const keys = await client.keys(pattern);
    
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await client.ttl(key);
      if (ttl === -1) {
        // No TTL set, set it
        await client.expire(key, this.QUEUE_TIMEOUT);
      } else if (ttl === -2) {
        // Key doesn't exist anymore
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

module.exports = new MessageQueue();
