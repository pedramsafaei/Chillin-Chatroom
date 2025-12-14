const express = require('express');
const router = express.Router();
const User = require('../database/models/User');
const { 
  createAccessToken, 
  createRefreshToken, 
  createGuestToken,
  verifyToken,
  authenticate
} = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateGuestUser,
  validateRefreshToken
} = require('../middleware/validation');
const { sessionManager } = require('../redis');

// POST /api/v1/auth/register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists by username or email
    const existingUser = await User.findByUsername(username.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    const existingEmail = await User.findByEmail(email.toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Hash password and create user
    const hashedPassword = User.hashPassword(password);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
    
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      email: email.toLowerCase(),
      avatar,
      displayName: username
    });
    
    // Generate tokens
    const accessToken = createAccessToken(user.username);
    const refreshToken = createRefreshToken(user.username);
    
    // Create session in Redis
    await sessionManager.createSession(
      user.username,
      'pending',
      {
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || 'unknown'
      }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/v1/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    if (!User.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate tokens
    const accessToken = createAccessToken(user.username);
    const refreshToken = createRefreshToken(user.username);
    
    // Create session in Redis
    await sessionManager.createSession(
      user.username,
      'pending',
      {
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || 'unknown'
      }
    );
    
    // Update last seen
    await User.updateById(user.id, { last_seen_at: new Date() });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/v1/auth/guest
router.post('/guest', validateGuestUser, async (req, res) => {
  try {
    const { nickname, emoji } = req.body;
    
    // Generate unique guest username
    const guestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const username = `guest_${guestId}`;
    
    // Create guest user with a dummy password
    const hashedPassword = User.hashPassword(`guest-${guestId}-${Date.now()}`);
    const avatar = emoji ? `data:text/plain;charset=utf-8,${encodeURIComponent(emoji)}` : 
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random`;
    
    const user = await User.create({
      username,
      password: hashedPassword,
      email: `${username}@guest.local`,
      avatar,
      displayName: nickname,
      isGuest: true
    });
    
    // Generate guest token with 24h expiry
    const accessToken = createGuestToken(user.username);
    
    // Create session in Redis
    await sessionManager.createSession(
      user.username,
      'pending',
      {
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || 'unknown',
        isGuest: true
      }
    );
    
    // Remove password from response
    const { password: _, email: __, ...userWithoutSensitiveData } = user;
    
    res.status(201).json({
      user: { ...userWithoutSensitiveData, isGuest: true },
      accessToken
    });
  } catch (error) {
    console.error('Guest user creation error:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Verify refresh token
    const verification = verifyToken(refreshToken);
    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Check if user still exists
    const user = await User.findByUsername(verification.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new tokens
    const accessToken = createAccessToken(user.username, verification.type);
    const newRefreshToken = createRefreshToken(user.username, verification.type);
    
    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Find and delete all sessions for this user
    // Note: This is a simple implementation; in production you might want to track session IDs
    // For now, we'll just acknowledge the logout
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get user by username
    const user = await User.findByUsername(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

module.exports = router;
