const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

// Database imports
const { initDatabase } = require("./database/connection");
const { runMigrations } = require("./database/migrations");
const User = require("./database/models/User");
const Room = require("./database/models/Room");
const Message = require("./database/models/Message");

// Redis imports
const { 
  initRedis, 
  getRedisAdapter, 
  sessionManager, 
  presenceManager, 
  cacheManager,
  messageQueue,
  pubsubManager 
} = require("./redis");

// Storage imports
const { initS3 } = require("./storage/s3Client");

// Legacy imports (for backward compatibility during transition)
const { registerUser, loginUser } = require("./auth.js");
const { createRoom: createRoomLegacy, joinRoom: joinRoomLegacy } = require("./rooms.js");

// Middleware
const messageValidator = require("./middleware/messageValidation");

const PORT = process.env.PORT || 5000;
const router = require("./router");

// API Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/uploads');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);

// Socket.io with Redis adapter (will be configured after Redis initialization)
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  // Enable sticky sessions support for load balancer
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Initialize infrastructure
const initInfrastructure = async () => {
  try {
    console.log("Initializing infrastructure...");
    
    // Initialize database
    initDatabase();
    await runMigrations();
    
    // Initialize Redis
    await initRedis();
    
    // Configure Socket.io with Redis adapter
    io.adapter(getRedisAdapter());
    
    // Subscribe to presence updates for cross-server synchronization
    await pubsubManager.subscribeToPresence((data) => {
      console.log('Presence update received:', data);
      // Broadcast presence changes to connected clients
      io.emit('presenceUpdate', data);
    });

    // Subscribe to system announcements
    await pubsubManager.subscribeToSystem((data) => {
      console.log('System announcement received:', data);
      // Broadcast to all connected clients
      io.emit('systemMessage', data.announcement);
    });

    // Subscribe to all room channels using pattern matching
    // This allows multiple server instances to sync messages
    await pubsubManager.psubscribe('room:*', (data, channel) => {
      if (data.type === 'room_message') {
        // Message already handled by Redis adapter, but could add additional logic
        console.log(`Message in ${channel}:`, data.message);
      } else if (data.type === 'typing_indicator') {
        // Sync typing indicators across servers
        const roomName = data.roomId;
        if (data.isTyping) {
          io.to(roomName).emit('userTyping', { user: data.userId });
        } else {
          io.to(roomName).emit('userStoppedTyping', { user: data.userId });
        }
      }
    });
    
    // Initialize S3/MinIO (if credentials are provided)
    if (process.env.S3_ACCESS_KEY_ID || process.env.USE_MINIO === 'true') {
      initS3();
    }
    
    console.log("Infrastructure initialized successfully");
  } catch (error) {
    console.error("Failed to initialize infrastructure:", error);
    process.exit(1);
  }
};

// Authentication endpoints
app.post("/api/auth/register", async (req, res) => {
  try {
    const result = registerUser(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    // Create session in Redis with proper fields
    // Note: socketId will be set when user connects via Socket.io
    const sessionId = await sessionManager.createSession(
      result.user.username,
      'pending', // socketId will be updated on connection
      {
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || req.connection.remoteAddress || 'unknown'
      }
    );
    
    res.json({ user: result.user, token: sessionId });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const result = loginUser(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    // Create session in Redis with proper fields
    const sessionId = await sessionManager.createSession(
      result.user.username,
      'pending', // socketId will be updated on connection
      {
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || req.connection.remoteAddress || 'unknown'
      }
    );
    
    res.json({ user: result.user, token: sessionId });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login user" });
  }
});

// Room management endpoints
app.post("/api/rooms/create", async (req, res) => {
  try {
    // Use legacy function for validation then save to DB
    const result = createRoomLegacy(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    // Save to database
    await Room.create({
      name: result.room.name,
      description: result.room.description,
      creator: result.room.creator,
      isPrivate: result.room.isPrivate,
      password: result.room.password
    });
    
    // Invalidate cache
    await cacheManager.delete('rooms:list');
    
    res.json({ room: result.room });
  } catch (error) {
    console.error("Room creation error:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.get("/api/rooms", async (req, res) => {
  try {
    // Try to get from cache first
    let rooms = await cacheManager.get('rooms:list');
    
    if (!rooms) {
      // Get from database
      const dbRooms = await Room.findAll();
      rooms = dbRooms.map(({ password, ...room }) => room);
      
      // Cache for 5 minutes
      await cacheManager.set('rooms:list', rooms, 300);
    }
    
    res.json({ rooms });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ error: "Failed to get rooms" });
  }
});

app.post("/api/rooms/join", async (req, res) => {
  try {
    const result = joinRoomLegacy(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ room: result.room });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

app.get("/api/rooms/:roomName/messages", async (req, res) => {
  try {
    const { roomName } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    // Try to get from cache first
    const cacheKey = `messages:${roomName}:${limit}`;
    let messages = await cacheManager.get(cacheKey);
    
    if (!messages) {
      // Get from database
      messages = await Message.findByRoom(roomName.toLowerCase(), limit);
      
      // Cache for 1 minute
      await cacheManager.set(cacheKey, messages, 60);
    }
    
    res.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

io.on("connection", (socket) => {
  console.log("New connection established:", socket.id);

  // Heartbeat mechanism - client should emit this every 30 seconds
  socket.on("heartbeat", async ({ userId }) => {
    try {
      if (userId) {
        await presenceManager.refreshPresence(userId);
      }
    } catch (error) {
      console.error("Error in heartbeat:", error);
    }
  });

  socket.on("join", async ({ name, room }, callback) => {
    try {
      // Validate inputs
      if (!name || !room) {
        return callback("Name and room are required!");
      }

      if (name.trim().length === 0 || room.trim().length === 0) {
        return callback("Name and room cannot be empty!");
      }

      const username = name.trim().toLowerCase();
      const roomName = room.trim().toLowerCase();

      // Set user presence in Redis using HASH
      await presenceManager.setUserPresence(username, {
        status: 'online',
        currentRoom: roomName,
        typing: 'false'
      });

      // Add user to room members SET
      await presenceManager.addUserToRoom(roomName, username);

      // Update session with socket ID
      const sessionData = await sessionManager.getSessionBySocketId(socket.id);
      if (!sessionData) {
        // Create new session if doesn't exist
        await sessionManager.createSession(username, socket.id, {
          userAgent: socket.handshake.headers['user-agent'] || 'unknown',
          ip: socket.handshake.address || 'unknown'
        });
      } else {
        // Update existing session with new socket ID
        await sessionManager.updateSession(sessionData.sessionId, {
          socketId: socket.id
        });
      }

      // Check for queued messages
      const queuedMessages = await messageQueue.dequeueMessages(username);
      if (queuedMessages.length > 0) {
        socket.emit("queuedMessages", { messages: queuedMessages });
      }

      // Load message history from database
      const messageHistory = await Message.findByRoom(roomName);
      socket.emit("messageHistory", { messages: messageHistory });

      socket.emit("message", {
        user: "admin",
        text: `${username}, welcome to room ${roomName}!`,
      });

      socket.broadcast.to(roomName).emit("message", {
        user: "admin",
        text: `${username} has joined!`,
      });

      socket.join(roomName);

      // Send room data to all users in the room
      const members = await presenceManager.getRoomMembers(roomName);
      const usersList = members.map(u => ({ id: u, name: u, room: roomName }));
      
      io.to(roomName).emit("roomData", {
        room: roomName,
        users: usersList,
      });

      // Update room member count in database
      await Room.updateMemberCount(roomName, members.length);
      
      // Invalidate cache
      await cacheManager.delete('rooms:list');

      // Publish presence update
      await pubsubManager.publishPresenceUpdate(username, {
        status: 'online',
        currentRoom: roomName
      });

      callback();
    } catch (error) {
      console.error("Error in join event:", error);
      callback("Failed to join room. Please try again.");
    }
  });

  socket.on("sendMessage", async (message, callback) => {
    try {
      // Get session to find user
      const sessionData = await sessionManager.getSessionBySocketId(socket.id);
      if (!sessionData) {
        return callback("Session not found. Please reconnect.");
      }

      const username = sessionData.userId;
      const presence = await presenceManager.getUserPresence(username);
      
      if (!presence) {
        return callback("User presence not found. Please rejoin the room.");
      }

      const roomName = presence.currentRoom;

      // Run validation pipeline
      const validationResult = await messageValidator.validate(socket.id, message);
      
      if (!validationResult.valid) {
        return callback(validationResult.error);
      }

      const { sanitizedMessage } = validationResult;

      // Get user and room from database for IDs
      const user = await User.findByUsername(username);
      const room = await Room.findByName(roomName);
      
      if (!user || !room) {
        return callback("User or room not found in database.");
      }

      // Save message to database
      const savedMessage = await Message.create({
        roomName: roomName,
        username: username,
        text: sanitizedMessage,
        roomId: room.id,
        userId: user.id
      });

      // Prepare message data with database ID
      const messageData = {
        id: savedMessage.id,
        user: username,
        text: sanitizedMessage,
        timestamp: savedMessage.timestamp
      };

      // Publish message via pub/sub for scalability across multiple server instances
      await pubsubManager.publishToRoom(roomName, messageData);

      // Also broadcast directly (for same server instance)
      io.to(roomName).emit("message", messageData);
      
      // Send confirmation to sender with message ID
      socket.emit("messageConfirmed", {
        tempId: message.tempId, // Client will send this
        id: savedMessage.id,
        timestamp: savedMessage.timestamp
      });

      // Check which room members are offline and queue message for them
      const members = await presenceManager.getRoomMembers(roomName);
      for (const member of members) {
        const memberPresence = await presenceManager.getUserPresence(member);
        if (!memberPresence || memberPresence.status !== 'online') {
          await messageQueue.enqueueMessage(member, messageData);
        }
      }

      // Invalidate message cache for this room
      await cacheManager.deletePattern(`messages:${roomName}:*`);

      callback();
    } catch (error) {
      console.error("Error in sendMessage:", error);
      callback("Failed to send message. Please try again.");
    }
  });

  socket.on("typing", async () => {
    try {
      const sessionData = await sessionManager.getSessionBySocketId(socket.id);
      if (!sessionData) return;

      const username = sessionData.userId;
      const presence = await presenceManager.getUserPresence(username);
      
      if (presence) {
        const roomName = presence.currentRoom;
        
        // Add to typing SORTED SET with timestamp
        await presenceManager.setUserTyping(roomName, username);
        
        // Update presence field
        await presenceManager.updatePresenceField(username, 'typing', 'true');
        
        // Broadcast to room
        socket.broadcast.to(roomName).emit("userTyping", {
          user: username,
        });

        // Publish typing indicator
        await pubsubManager.publishTypingIndicator(roomName, username, true);
        
        // Refresh presence
        await presenceManager.refreshPresence(username);
      }
    } catch (error) {
      console.error("Error in typing event:", error);
    }
  });

  socket.on("stopTyping", async () => {
    try {
      const sessionData = await sessionManager.getSessionBySocketId(socket.id);
      if (!sessionData) return;

      const username = sessionData.userId;
      const presence = await presenceManager.getUserPresence(username);
      
      if (presence) {
        const roomName = presence.currentRoom;
        
        // Remove from typing SORTED SET
        await presenceManager.removeUserTyping(roomName, username);
        
        // Update presence field
        await presenceManager.updatePresenceField(username, 'typing', 'false');
        
        // Broadcast to room
        socket.broadcast.to(roomName).emit("userStoppedTyping", {
          user: username,
        });

        // Publish typing indicator
        await pubsubManager.publishTypingIndicator(roomName, username, false);
      }
    } catch (error) {
      console.error("Error in stopTyping event:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      const sessionData = await sessionManager.getSessionBySocketId(socket.id);
      
      if (sessionData) {
        const username = sessionData.userId;
        const presence = await presenceManager.getUserPresence(username);

        if (presence) {
          const roomName = presence.currentRoom;

          // Remove user from room members
          await presenceManager.removeUserFromRoom(roomName, username);

          // Remove from typing indicators
          await presenceManager.removeUserTyping(roomName, username);

          // Update presence to offline
          await presenceManager.updatePresenceField(username, 'status', 'offline');

          io.to(roomName).emit("message", {
            user: "admin",
            text: `${username} has left.`,
          });

          // Update room data for remaining users
          const members = await presenceManager.getRoomMembers(roomName);
          const usersList = members.map(u => ({ id: u, name: u, room: roomName }));
          
          io.to(roomName).emit("roomData", {
            room: roomName,
            users: usersList,
          });

          // Update room member count in database
          await Room.updateMemberCount(roomName, members.length);
          
          // Invalidate cache
          await cacheManager.delete('rooms:list');

          // Publish presence update
          await pubsubManager.publishPresenceUpdate(username, {
            status: 'offline',
            currentRoom: ''
          });

          // Clean up presence after a delay (user might reconnect)
          setTimeout(async () => {
            const currentPresence = await presenceManager.getUserPresence(username);
            if (currentPresence && currentPresence.status === 'offline') {
              await presenceManager.deleteUserPresence(username);
            }
          }, 60000); // 1 minute grace period
        }

        // Delete session
        await sessionManager.deleteSession(sessionData.sessionId);
      }

      console.log("User disconnected:", socket.id);
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
});

// Mount API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/uploads', uploadRoutes);

app.use(router);

// Initialize infrastructure and start server
initInfrastructure().then(() => {
  server.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { closeDatabase } = require('./database/connection');
  const { closeRedis } = require('./redis/connection');
  
  // Clean up pub/sub subscribers
  await pubsubManager.cleanup();
  
  await closeDatabase();
  await closeRedis();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Periodic cleanup of typing indicators (every 10 seconds)
setInterval(async () => {
  try {
    // This would clean up old typing indicators across all rooms
    // In production, you might want to track active rooms
    // For now, the auto-cleanup happens on read via getUsersTyping()
  } catch (error) {
    console.error('Error in typing cleanup:', error);
  }
}, 10000);

