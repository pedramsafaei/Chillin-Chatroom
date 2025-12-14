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

// WebSocket imports
const { initializeWebSocket } = require("./websocket");

// Legacy imports (for backward compatibility during transition)
const { registerUser, loginUser } = require("./auth.js");
const { createRoom: createRoomLegacy, joinRoom: joinRoomLegacy } = require("./rooms.js");

// Middleware
const messageValidator = require("./middleware/messageValidation");

const PORT = process.env.PORT || 5000;
const router = require("./router");

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

// Initialize WebSocket event handlers (new implementation)
initializeWebSocket(io);

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

