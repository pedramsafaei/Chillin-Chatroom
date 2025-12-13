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
const { initRedis, getRedisAdapter } = require("./redis/connection");
const presenceManager = require("./redis/presence");
const sessionManager = require("./redis/session");
const cacheManager = require("./redis/cache");

// Storage imports
const { initS3 } = require("./storage/s3Client");

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
    
    // Create session in Redis
    const sessionId = await sessionManager.createSession(result.user.username, {
      email: result.user.email,
      avatar: result.user.avatar
    });
    
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
    
    // Create session in Redis
    const sessionId = await sessionManager.createSession(result.user.username, {
      email: result.user.email,
      avatar: result.user.avatar
    });
    
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

      // Add user to Redis presence
      await presenceManager.addUserToRoom(socket.id, username, roomName);

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
      const usersInRoom = await presenceManager.getUsersInRoom(roomName);
      const usersList = usersInRoom.map(u => ({ id: u.socketId, name: u.username, room: u.roomName }));
      
      io.to(roomName).emit("roomData", {
        room: roomName,
        users: usersList,
      });

      // Update room member count in database
      await Room.updateMemberCount(roomName, usersInRoom.length);
      
      // Invalidate cache
      await cacheManager.delete('rooms:list');

      callback();
    } catch (error) {
      console.error("Error in join event:", error);
      callback("Failed to join room. Please try again.");
    }
  });

  socket.on("sendMessage", async (message, callback) => {
    try {
      // Run validation pipeline
      const validationResult = await messageValidator.validate(socket.id, message);
      
      if (!validationResult.valid) {
        return callback(validationResult.error);
      }

      const { user, sanitizedMessage } = validationResult;

      // Save message to database
      const savedMessage = await Message.create({
        roomName: user.roomName,
        username: user.username,
        text: sanitizedMessage
      });

      // Prepare message data with database ID
      const messageData = {
        id: savedMessage.id,
        user: user.username,
        text: sanitizedMessage,
        timestamp: savedMessage.timestamp
      };

      // Broadcast to all users in the room (including sender)
      io.to(user.roomName).emit("message", messageData);
      
      // Send confirmation to sender with message ID
      socket.emit("messageConfirmed", {
        tempId: message.tempId, // Client will send this
        id: savedMessage.id,
        timestamp: savedMessage.timestamp
      });

      // Invalidate message cache for this room
      await cacheManager.deletePattern(`messages:${user.roomName}:*`);

      callback();
    } catch (error) {
      console.error("Error in sendMessage:", error);
      callback("Failed to send message. Please try again.");
    }
  });

  socket.on("typing", async () => {
    try {
      const user = await presenceManager.getUser(socket.id);
      if (user) {
        socket.broadcast.to(user.roomName).emit("userTyping", {
          user: user.username,
        });
        
        // Update presence timestamp
        await presenceManager.updatePresence(socket.id);
      }
    } catch (error) {
      console.error("Error in typing event:", error);
    }
  });

  socket.on("stopTyping", async () => {
    try {
      const user = await presenceManager.getUser(socket.id);
      if (user) {
        socket.broadcast.to(user.roomName).emit("userStoppedTyping", {
          user: user.username,
        });
      }
    } catch (error) {
      console.error("Error in stopTyping event:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      const user = await presenceManager.removeUserFromRoom(socket.id);

      if (user) {
        io.to(user.roomName).emit("message", {
          user: "admin",
          text: `${user.username} has left.`,
        });

        // Update room data for remaining users
        const usersInRoom = await presenceManager.getUsersInRoom(user.roomName);
        const usersList = usersInRoom.map(u => ({ id: u.socketId, name: u.username, room: u.roomName }));
        
        io.to(user.roomName).emit("roomData", {
          room: user.roomName,
          users: usersList,
        });

        // Update room member count in database
        await Room.updateMemberCount(user.roomName, usersInRoom.length);
        
        // Invalidate cache
        await cacheManager.delete('rooms:list');
      }

      console.log("User disconnected:", socket.id);
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
});

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
  
  await closeDatabase();
  await closeRedis();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

