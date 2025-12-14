const { sessionManager } = require('../redis');
const crypto = require('crypto');

// Token structure: {userId, type, expiresAt, signature}
// We'll use a simple token format: base64(userId:type:expiresAt:signature)

const SECRET = process.env.JWT_SECRET || 'chillin-chatroom-secret-key-change-in-production';

// Generate a signature for the token
const generateSignature = (payload) => {
  return crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
};

// Create access token (30 minutes expiry)
const createAccessToken = (userId, type = 'user') => {
  const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
  const payload = `${userId}:${type}:${expiresAt}`;
  const signature = generateSignature(payload);
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return token;
};

// Create refresh token (7 days expiry)
const createRefreshToken = (userId, type = 'user') => {
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  const payload = `${userId}:${type}:${expiresAt}`;
  const signature = generateSignature(payload);
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return token;
};

// Create guest token (24 hours expiry)
const createGuestToken = (userId) => {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  const payload = `${userId}:guest:${expiresAt}`;
  const signature = generateSignature(payload);
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return token;
};

// Verify and decode token
const verifyToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [userId, type, expiresAt, signature] = parts;
    const payload = `${userId}:${type}:${expiresAt}`;
    const expectedSignature = generateSignature(payload);
    
    // Verify signature
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    // Check expiration
    if (Date.now() > parseInt(expiresAt)) {
      return { valid: false, error: 'Token expired' };
    }
    
    return {
      valid: true,
      userId,
      type,
      expiresAt: parseInt(expiresAt)
    };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const verification = verifyToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({ error: verification.error });
    }
    
    // Attach user info to request
    req.user = {
      userId: verification.userId,
      type: verification.type
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verification = verifyToken(token);
      
      if (verification.valid) {
        req.user = {
          userId: verification.userId,
          type: verification.type
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  createAccessToken,
  createRefreshToken,
  createGuestToken,
  verifyToken
};
