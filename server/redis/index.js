// Central export for all Redis modules
const { initRedis, getRedisAdapter, getCacheClient, closeRedis } = require('./connection');
const sessionManager = require('./session');
const presenceManager = require('./presence');
const cacheManager = require('./cache');
const messageQueue = require('./messageQueue');
const pubsubManager = require('./pubsub');

module.exports = {
  // Connection
  initRedis,
  getRedisAdapter,
  getCacheClient,
  closeRedis,
  
  // Managers
  sessionManager,
  presenceManager,
  cacheManager,
  messageQueue,
  pubsubManager,
};
