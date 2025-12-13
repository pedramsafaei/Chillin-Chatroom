const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

let pubClient = null;
let subClient = null;
let cacheClient = null;

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Publisher client for Socket.io adapter
  pubClient = redis.createClient({ url: redisUrl });
  pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
  await pubClient.connect();

  // Subscriber client for Socket.io adapter
  subClient = pubClient.duplicate();
  await subClient.connect();

  // Cache client for general Redis operations
  cacheClient = pubClient.duplicate();
  await cacheClient.connect();

  console.log('Redis clients initialized');

  return { pubClient, subClient, cacheClient };
};

const getRedisAdapter = () => {
  if (!pubClient || !subClient) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return createAdapter(pubClient, subClient);
};

const getCacheClient = () => {
  if (!cacheClient) {
    throw new Error('Redis cache client not initialized. Call initRedis() first.');
  }
  return cacheClient;
};

const closeRedis = async () => {
  const clients = [pubClient, subClient, cacheClient].filter(Boolean);
  await Promise.all(clients.map(client => client.quit()));
  pubClient = null;
  subClient = null;
  cacheClient = null;
  console.log('Redis clients closed');
};

module.exports = {
  initRedis,
  getRedisAdapter,
  getCacheClient,
  closeRedis,
};
