const users = [];

const addUser = ({ id, name, room }) => {
  // Validate inputs
  if (!name || !room) {
    return { error: "Name and room are required!" };
  }

  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if (name.length === 0) {
    return { error: "Name cannot be empty!" };
  }

  if (room.length === 0) {
    return { error: "Room name cannot be empty!" };
  }

  if (name.length > 20) {
    return { error: "Name is too long! Maximum 20 characters." };
  }

  if (room.length > 30) {
    return { error: "Room name is too long! Maximum 30 characters." };
  }

  const existingUser = users.find(
    (user) => user.room === room && user.name === name
  );

  if (existingUser) {
    return { error: "This username is already taken in this room!" };
  }

  const user = { id, name, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  if (!room) return [];
  return users.filter((user) => user.room === room.trim().toLowerCase());
};

const getRooms = () => {
  const rooms = {};
  users.forEach((user) => {
    if (!rooms[user.room]) {
      rooms[user.room] = {
        name: user.room,
        users: [],
      };
    }
    rooms[user.room].users.push(user.name);
  });
  return Object.values(rooms);
};

const getAllUsers = () => {
  return users;
};

module.exports = { addUser, removeUser, getUser, getUsersInRoom, getRooms, getAllUsers };
