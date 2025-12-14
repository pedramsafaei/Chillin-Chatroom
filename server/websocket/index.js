const { authenticateSocket } = require('./auth');
const {
  handleConnection,
  handleRoomJoin,
  handleRoomLeave,
  handleMessageSend,
  handleMessageEdit,
  handleMessageDelete,
  handleMessageReact,
  handleTypingStart,
  handleTypingStop,
  handlePresenceUpdate,
  handleHeartbeat,
  handleDisconnect
} = require('./handlers');

/**
 * Initialize WebSocket event handlers
 * @param {SocketIO.Server} io - Socket.io server instance
 */
const initializeWebSocket = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`New WebSocket connection: ${socket.id}, User: ${socket.userId}`);

    // Send initial connection data
    handleConnection(socket, io);

    // Client to Server Events
    
    // Room management
    socket.on('room:join', (payload) => {
      handleRoomJoin(socket, io, payload);
    });

    socket.on('room:leave', (payload) => {
      handleRoomLeave(socket, io, payload);
    });

    // Message management
    socket.on('message:send', (payload) => {
      handleMessageSend(socket, io, payload);
    });

    socket.on('message:edit', (payload) => {
      handleMessageEdit(socket, io, payload);
    });

    socket.on('message:delete', (payload) => {
      handleMessageDelete(socket, io, payload);
    });

    socket.on('message:react', (payload) => {
      handleMessageReact(socket, io, payload);
    });

    // Typing indicators
    socket.on('typing:start', (payload) => {
      handleTypingStart(socket, io, payload);
    });

    socket.on('typing:stop', (payload) => {
      handleTypingStop(socket, io, payload);
    });

    // Presence management
    socket.on('presence:update', (payload) => {
      handlePresenceUpdate(socket, io, payload);
    });

    // Heartbeat
    socket.on('heartbeat', (payload) => {
      handleHeartbeat(socket, payload);
    });

    // Disconnect
    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.userId}:`, error);
      socket.emit('error', {
        code: 'SOCKET_ERROR',
        message: 'An unexpected error occurred',
        details: error.message
      });
    });
  });

  // Handle connection errors
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });

  console.log('WebSocket handlers initialized');
};

module.exports = { initializeWebSocket };
