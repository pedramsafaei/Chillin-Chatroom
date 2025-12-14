// Request validation middleware

const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields: username, email, password' 
    });
  }
  
  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ 
      error: 'Username must be at least 3 characters' 
    });
  }
  
  if (typeof username !== 'string' || username.trim().length > 50) {
    return res.status(400).json({ 
      error: 'Username must be at most 50 characters' 
    });
  }
  
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters' 
    });
  }
  
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email format' 
    });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields: email, password' 
    });
  }
  
  next();
};

const validateGuestUser = (req, res, next) => {
  const { nickname, emoji } = req.body;
  
  if (!nickname) {
    return res.status(400).json({ 
      error: 'Missing required field: nickname' 
    });
  }
  
  if (typeof nickname !== 'string' || nickname.trim().length < 2) {
    return res.status(400).json({ 
      error: 'Nickname must be at least 2 characters' 
    });
  }
  
  if (typeof nickname !== 'string' || nickname.trim().length > 30) {
    return res.status(400).json({ 
      error: 'Nickname must be at most 30 characters' 
    });
  }
  
  next();
};

const validateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ 
      error: 'Missing required field: refreshToken' 
    });
  }
  
  next();
};

const validateUserUpdate = (req, res, next) => {
  const { displayName, avatar, statusMessage } = req.body;
  
  // At least one field should be present
  if (!displayName && !avatar && !statusMessage && statusMessage !== '') {
    return res.status(400).json({ 
      error: 'At least one field to update is required: displayName, avatar, statusMessage' 
    });
  }
  
  if (displayName && (typeof displayName !== 'string' || displayName.trim().length > 100)) {
    return res.status(400).json({ 
      error: 'Display name must be at most 100 characters' 
    });
  }
  
  if (statusMessage && typeof statusMessage !== 'string') {
    return res.status(400).json({ 
      error: 'Status message must be a string' 
    });
  }
  
  next();
};

const validateCreateRoom = (req, res, next) => {
  const { name, description, type } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      error: 'Missing required field: name' 
    });
  }
  
  if (typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ 
      error: 'Room name must be at least 3 characters' 
    });
  }
  
  if (typeof name !== 'string' || name.trim().length > 100) {
    return res.status(400).json({ 
      error: 'Room name must be at most 100 characters' 
    });
  }
  
  if (type && !['public', 'private'].includes(type)) {
    return res.status(400).json({ 
      error: 'Room type must be either "public" or "private"' 
    });
  }
  
  next();
};

const validateUpdateRoom = (req, res, next) => {
  const { name, description, settings } = req.body;
  
  // At least one field should be present
  if (!name && !description && !settings) {
    return res.status(400).json({ 
      error: 'At least one field to update is required: name, description, settings' 
    });
  }
  
  if (name && (typeof name !== 'string' || name.trim().length < 3)) {
    return res.status(400).json({ 
      error: 'Room name must be at least 3 characters' 
    });
  }
  
  if (settings && typeof settings !== 'object') {
    return res.status(400).json({ 
      error: 'Settings must be an object' 
    });
  }
  
  next();
};

const validateMessage = (req, res, next) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ 
      error: 'Missing required field: content' 
    });
  }
  
  if (typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Message content cannot be empty' 
    });
  }
  
  next();
};

const validateReaction = (req, res, next) => {
  const { emoji } = req.body;
  
  if (!emoji) {
    return res.status(400).json({ 
      error: 'Missing required field: emoji' 
    });
  }
  
  if (typeof emoji !== 'string' || emoji.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Emoji cannot be empty' 
    });
  }
  
  next();
};

const validatePresignRequest = (req, res, next) => {
  const { fileName, mimeType, size } = req.body;
  
  if (!fileName || !mimeType || !size) {
    return res.status(400).json({ 
      error: 'Missing required fields: fileName, mimeType, size' 
    });
  }
  
  if (typeof fileName !== 'string' || fileName.trim().length === 0) {
    return res.status(400).json({ 
      error: 'File name cannot be empty' 
    });
  }
  
  if (typeof mimeType !== 'string' || mimeType.trim().length === 0) {
    return res.status(400).json({ 
      error: 'MIME type cannot be empty' 
    });
  }
  
  if (typeof size !== 'number' || size <= 0) {
    return res.status(400).json({ 
      error: 'Size must be a positive number' 
    });
  }
  
  // Check file size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (size > MAX_FILE_SIZE) {
    return res.status(400).json({ 
      error: 'File size exceeds maximum limit of 10MB' 
    });
  }
  
  next();
};

const validateUploadComplete = (req, res, next) => {
  const { fileUrl } = req.body;
  
  if (!fileUrl) {
    return res.status(400).json({ 
      error: 'Missing required field: fileUrl' 
    });
  }
  
  if (typeof fileUrl !== 'string' || fileUrl.trim().length === 0) {
    return res.status(400).json({ 
      error: 'File URL cannot be empty' 
    });
  }
  
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateGuestUser,
  validateRefreshToken,
  validateUserUpdate,
  validateCreateRoom,
  validateUpdateRoom,
  validateMessage,
  validateReaction,
  validatePresignRequest,
  validateUploadComplete
};
