const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");
const { registerUser, loginUser, generateSessionToken } = require("./auth.js");
const { createRoom, joinRoom, getRoomList, updateRoomMemberCount } = require("./rooms.js");
const { saveMessage, getMessages } = require("./storage.js");

const PORT = process.env.PORT || 5000;
const router = require("./router");

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Authentication endpoints
app.post("/api/auth/register", (req, res) => {
  const result = registerUser(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  const token = generateSessionToken();
  res.json({ user: result.user, token });
});

app.post("/api/auth/login", (req, res) => {
  const result = loginUser(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  const token = generateSessionToken();
  res.json({ user: result.user, token });
});

// Room management endpoints
app.post("/api/rooms/create", (req, res) => {
  const result = createRoom(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ room: result.room });
});

app.get("/api/rooms", (req, res) => {
  const rooms = getRoomList();
  res.json({ rooms });
});

app.post("/api/rooms/join", (req, res) => {
  const result = joinRoom(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ room: result.room });
});

app.get("/api/rooms/:roomName/messages", (req, res) => {
  const { roomName } = req.params;
  const messages = getMessages(roomName.toLowerCase());
  res.json({ messages });
});

io.on("connection", (socket) => {
  console.log("New connection established");

  socket.on("join", ({ name, room }, callback) => {
    // Validate inputs
    if (!name || !room) {
      return callback("Name and room are required!");
    }

    if (name.trim().length === 0 || room.trim().length === 0) {
      return callback("Name and room cannot be empty!");
    }

    const { error, user } = addUser({
      id: socket.id,
      name,
      room,
    });

    if (error) return callback(error);

    // Load message history
    const messageHistory = getMessages(user.room);
    socket.emit("messageHistory", { messages: messageHistory });

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}!`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} has joined!`,
    });

    socket.join(user.room);

    // Send room data to all users in the room
    const usersInRoom = getUsersInRoom(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: usersInRoom,
    });

    // Update room member count
    updateRoomMemberCount(user.room, usersInRoom.length);

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    try {
      const user = getUser(socket.id);

      if (!user) {
        return callback("User not found. Please rejoin the room.");
      }

      // Validate message
      if (!message || message.trim().length === 0) {
        return callback("Message cannot be empty!");
      }

      if (message.trim().length > 500) {
        return callback("Message is too long! Maximum 500 characters.");
      }

      const messageData = {
        user: user.name,
        text: message,
      };

      // Save message to storage
      saveMessage(user.room, messageData);

      io.to(user.room).emit("message", messageData);

      callback();
    } catch (error) {
      console.error("Error in sendMessage:", error);
      callback("Failed to send message. Please try again.");
    }
  });

  socket.on("typing", () => {
    try {
      const user = getUser(socket.id);
      if (user) {
        socket.broadcast.to(user.room).emit("userTyping", {
          user: user.name,
        });
      }
    } catch (error) {
      console.error("Error in typing event:", error);
    }
  });

  socket.on("stopTyping", () => {
    try {
      const user = getUser(socket.id);
      if (user) {
        socket.broadcast.to(user.room).emit("userStoppedTyping", {
          user: user.name,
        });
      }
    } catch (error) {
      console.error("Error in stopTyping event:", error);
    }
  });

  socket.on("disconnect", () => {
    try {
      const user = removeUser(socket.id);

      if (user) {
        io.to(user.room).emit("message", {
          user: "admin",
          text: `${user.name} has left.`,
        });

        // Update room data for remaining users
        const usersInRoom = getUsersInRoom(user.room);
        io.to(user.room).emit("roomData", {
          room: user.room,
          users: usersInRoom,
        });

        // Update room member count
        updateRoomMemberCount(user.room, usersInRoom.length);
      }

      console.log("User disconnected:", socket.id);
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));

