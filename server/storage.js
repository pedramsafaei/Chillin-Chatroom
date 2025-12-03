const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize files if they don't exist
const initFile = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initFile(MESSAGES_FILE, {});
initFile(ROOMS_FILE, {});
initFile(USERS_FILE, {});

// Message storage
const saveMessage = (room, message) => {
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8"));
    if (!data[room]) {
      data[room] = [];
    }
    data[room].push({
      ...message,
      timestamp: new Date().toISOString(),
    });
    // Keep only last 100 messages per room
    if (data[room].length > 100) {
      data[room] = data[room].slice(-100);
    }
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving message:", error);
    return false;
  }
};

const getMessages = (room) => {
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8"));
    return data[room] || [];
  } catch (error) {
    console.error("Error reading messages:", error);
    return [];
  }
};

// Room storage
const saveRoom = (roomData) => {
  try {
    const data = JSON.parse(fs.readFileSync(ROOMS_FILE, "utf8"));
    data[roomData.name] = {
      ...roomData,
      createdAt: roomData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving room:", error);
    return false;
  }
};

const getRoom = (roomName) => {
  try {
    const data = JSON.parse(fs.readFileSync(ROOMS_FILE, "utf8"));
    return data[roomName] || null;
  } catch (error) {
    console.error("Error reading room:", error);
    return null;
  }
};

const getAllRooms = () => {
  try {
    const data = JSON.parse(fs.readFileSync(ROOMS_FILE, "utf8"));
    return Object.values(data);
  } catch (error) {
    console.error("Error reading rooms:", error);
    return [];
  }
};

const deleteRoom = (roomName) => {
  try {
    const data = JSON.parse(fs.readFileSync(ROOMS_FILE, "utf8"));
    delete data[roomName];
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error deleting room:", error);
    return false;
  }
};

// User authentication storage
const saveUser = (userData) => {
  try {
    const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    data[userData.username] = {
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving user:", error);
    return false;
  }
};

const getAuthUser = (username) => {
  try {
    const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    return data[username] || null;
  } catch (error) {
    console.error("Error reading user:", error);
    return null;
  }
};

module.exports = {
  saveMessage,
  getMessages,
  saveRoom,
  getRoom,
  getAllRooms,
  deleteRoom,
  saveUser,
  getAuthUser,
};
