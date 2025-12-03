const crypto = require("crypto");
const { saveUser, getAuthUser } = require("./storage");

// Simple password hashing (in production, use bcrypt)
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const registerUser = ({ username, password, email, avatar }) => {
  // Validate inputs
  if (!username || !password) {
    return { error: "Username and password are required!" };
  }

  const trimmedUsername = username.trim().toLowerCase();

  if (trimmedUsername.length < 3) {
    return { error: "Username must be at least 3 characters!" };
  }

  if (trimmedUsername.length > 20) {
    return { error: "Username must be at most 20 characters!" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters!" };
  }

  // Check if user already exists
  const existingUser = getAuthUser(trimmedUsername);
  if (existingUser) {
    return { error: "Username already taken!" };
  }

  // Create user
  const user = {
    username: trimmedUsername,
    password: hashPassword(password),
    email: email || "",
    avatar: avatar || `https://ui-avatars.com/api/?name=${trimmedUsername}&background=random`,
    createdAt: new Date().toISOString(),
  };

  saveUser(user);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
};

const loginUser = ({ username, password }) => {
  // Validate inputs
  if (!username || !password) {
    return { error: "Username and password are required!" };
  }

  const trimmedUsername = username.trim().toLowerCase();

  // Get user from storage
  const user = getAuthUser(trimmedUsername);
  if (!user) {
    return { error: "Invalid username or password!" };
  }

  // Verify password
  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    return { error: "Invalid username or password!" };
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
};

const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = {
  registerUser,
  loginUser,
  generateSessionToken,
};
