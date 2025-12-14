const { sessionManager } = require('../redis');

/**
 * WebSocket authentication middleware
 * Validates token from query parameters
 */
const authenticateSocket = async (socket, next) => {
  try {
    // Get token from query params
    const token = socket.handshake.query.token || socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('AUTH_FAILED: No token provided'));
    }

    // Validate session token
    const sessionData = await sessionManager.getSession(token);
    
    if (!sessionData || !sessionData.userId) {
      return next(new Error('AUTH_FAILED: Invalid or expired token'));
    }

    // Attach user info to socket
    socket.userId = sessionData.userId;
    socket.sessionId = token;
    
    // Update session with socket ID
    await sessionManager.updateSession(token, {
      socketId: socket.id
    });

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('AUTH_FAILED: Authentication failed'));
  }
};

module.exports = { authenticateSocket };
