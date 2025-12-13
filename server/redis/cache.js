const { getCacheClient } = require('./connection');

class CacheManager {
  constructor() {
    this.CACHE_PREFIX = 'cache:';
    this.DEFAULT_TTL = 3600; // 1 hour in seconds
  }

  // Set cache value
  async set(key, value, ttl = this.DEFAULT_TTL) {
    const client = getCacheClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    await client.setEx(cacheKey, ttl, data);
  }

  // Get cache value
  async get(key) {
    const client = getCacheClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    const data = await client.get(cacheKey);
    
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  // Delete cache value
  async delete(key) {
    const client = getCacheClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    await client.del(cacheKey);
  }

  // Delete multiple keys matching pattern
  async deletePattern(pattern) {
    const client = getCacheClient();
    const cachePattern = `${this.CACHE_PREFIX}${pattern}`;
    const keys = await client.keys(cachePattern);
    
    if (keys.length > 0) {
      await client.del(keys);
    }
  }

  // Check if key exists
  async exists(key) {
    const client = getCacheClient();
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    return await client.exists(cacheKey);
  }

  // Get multiple values
  async mget(keys) {
    const client = getCacheClient();
    const cacheKeys = keys.map(key => `${this.CACHE_PREFIX}${key}`);
    const values = await client.mGet(cacheKeys);
    
    return values.map(data => {
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    });
  }
}

module.exports = new CacheManager();
