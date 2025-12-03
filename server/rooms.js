const crypto = require("crypto");
const { saveRoom, getRoom, getAllRooms, deleteRoom } = require("./storage");

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const createRoom = ({ name, description, password, creator }) => {
  // Validate inputs
  if (!name) {
    return { error: "Room name is required!" };
  }

  const trimmedName = name.trim().toLowerCase();

  if (trimmedName.length === 0) {
    return { error: "Room name cannot be empty!" };
  }

  if (trimmedName.length > 30) {
    return { error: "Room name is too long! Maximum 30 characters." };
  }

  // Check if room already exists
  const existingRoom = getRoom(trimmedName);
  if (existingRoom) {
    return { error: "Room name already exists!" };
  }

  // Create room
  const room = {
    name: trimmedName,
    description: description || "",
    creator: creator || "anonymous",
    createdAt: new Date().toISOString(),
    isPrivate: !!password,
    password: password ? hashPassword(password) : null,
    memberCount: 0,
  };

  saveRoom(room);

  // Return room without password
  const { password: _, ...roomWithoutPassword } = room;
  return { room: roomWithoutPassword };
};

const joinRoom = ({ roomName, password }) => {
  const room = getRoom(roomName);

  if (!room) {
    return { error: "Room not found!" };
  }

  // Check if room is private and password is required
  if (room.isPrivate && room.password) {
    if (!password) {
      return { error: "Password required for this room!" };
    }

    const hashedPassword = hashPassword(password);
    if (room.password !== hashedPassword) {
      return { error: "Incorrect password!" };
    }
  }

  // Return room without password
  const { password: _, ...roomWithoutPassword } = room;
  return { room: roomWithoutPassword };
};

const getRoomList = () => {
  const rooms = getAllRooms();
  // Remove passwords from response
  return rooms.map(({ password, ...room }) => room);
};

const updateRoomMemberCount = (roomName, count) => {
  const room = getRoom(roomName);
  if (room) {
    room.memberCount = count;
    saveRoom(room);
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getRoomList,
  updateRoomMemberCount,
};
