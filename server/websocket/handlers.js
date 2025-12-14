const User = require('../database/models/User');
const Room = require('../database/models/Room');
const Message = require('../database/models/Message');
const Reaction = require('../database/models/Reaction');
const { 
  sessionManager, 
  presenceManager, 
  cacheManager,
  messageQueue,
  pubsubManager 
} = require('../redis');
const throttleManager = require('./throttle');

/**
 * Handle connection event
 * Send initial data to newly connected client
 */
const handleConnection = async (socket, io) => {
  try {
    const userId = socket.userId;
    const sessionId = socket.sessionId;

    // Get user's joined rooms from database
    const userRooms = await getRoomsForUser(userId);

    // Get unread counts per room
    const unreadCounts = await getUnreadCountsForUser(userId, userRooms);

    // Set user presence
    await presenceManager.setUserPresence(userId, {
      status: 'online',
      currentRoom: '',
      typing: 'false'
    });

    // Publish presence update
    await pubsubManager.publishPresenceUpdate(userId, {
      status: 'online',
      currentRoom: ''
    });

    // Send connected event with initial data
    socket.emit('connected', {
      userId,
      sessionId,
      rooms: userRooms,
      unreadCounts
    });

    console.log(`User ${userId} connected with session ${sessionId}`);
  } catch (error) {
    console.error('Error in handleConnection:', error);
    socket.emit('error', {
      code: 'CONNECTION_ERROR',
      message: 'Failed to establish connection',
      details: error.message
    });
  }
};

/**
 * Handle room:join event
 */
const handleRoomJoin = async (socket, io, payload) => {
  try {
    const { roomId } = payload;
    const userId = socket.userId;

    if (!roomId) {
      return socket.emit('room:error', {
        code: 'INVALID_ROOM',
        message: 'Room ID is required'
      });
    }

    const roomName = roomId.trim().toLowerCase();

    // Check if room exists
    const room = await Room.findByName(roomName);
    if (!room) {
      return socket.emit('room:error', {
        code: 'ROOM_NOT_FOUND',
        message: 'Room does not exist'
      });
    }

    // Join socket.io room
    socket.join(roomName);

    // Update user presence
    await presenceManager.setUserPresence(userId, {
      status: 'online',
      currentRoom: roomName,
      typing: 'false'
    });

    // Add user to room members
    await presenceManager.addUserToRoom(roomName, userId);

    // Get online members
    const memberIds = await presenceManager.getRoomMembers(roomName);
    const members = await Promise.all(
      memberIds.map(async (id) => {
        const user = await User.findByUsername(id);
        return user ? { id: user.username, username: user.username, avatar: user.avatar } : null;
      })
    );
    const onlineMembers = members.filter(m => m !== null);

    // Get recent messages
    const recentMessages = await Message.findByRoom(roomName, 50);

    // Send confirmation to user
    socket.emit('room:joined', {
      room: {
        id: room.name,
        name: room.name,
        description: room.description,
        isPrivate: room.is_private,
        memberCount: room.member_count
      },
      members: onlineMembers,
      recentMessages
    });

    // Notify other room members
    socket.to(roomName).emit('room:user_joined', {
      roomId: roomName,
      user: {
        id: userId,
        username: userId,
        avatar: (await User.findByUsername(userId))?.avatar
      }
    });

    // Update room member count
    await Room.updateMemberCount(roomName, memberIds.length);

    // Invalidate cache
    await cacheManager.delete('rooms:list');

    // Publish presence update
    await pubsubManager.publishPresenceUpdate(userId, {
      status: 'online',
      currentRoom: roomName
    });

    console.log(`User ${userId} joined room ${roomName}`);
  } catch (error) {
    console.error('Error in handleRoomJoin:', error);
    socket.emit('room:error', {
      code: 'JOIN_FAILED',
      message: 'Failed to join room',
      details: error.message
    });
  }
};

/**
 * Handle room:leave event
 */
const handleRoomLeave = async (socket, io, payload) => {
  try {
    const { roomId } = payload;
    const userId = socket.userId;

    if (!roomId) {
      return;
    }

    const roomName = roomId.trim().toLowerCase();

    // Leave socket.io room
    socket.leave(roomName);

    // Remove user from room members
    await presenceManager.removeUserFromRoom(roomName, userId);

    // Remove typing indicator
    await presenceManager.removeUserTyping(roomName, userId);

    // Update presence
    await presenceManager.updatePresenceField(userId, 'currentRoom', '');

    // Notify other room members
    socket.to(roomName).emit('room:user_left', {
      roomId: roomName,
      userId
    });

    // Update room member count
    const memberIds = await presenceManager.getRoomMembers(roomName);
    await Room.updateMemberCount(roomName, memberIds.length);

    // Invalidate cache
    await cacheManager.delete('rooms:list');

    // Send confirmation
    socket.emit('room:left', { roomId: roomName });

    console.log(`User ${userId} left room ${roomName}`);
  } catch (error) {
    console.error('Error in handleRoomLeave:', error);
  }
};

/**
 * Handle message:send event
 */
const handleMessageSend = async (socket, io, payload) => {
  try {
    const { tempId, roomId, content, replyToId, attachments } = payload;
    const userId = socket.userId;

    if (!roomId || !content) {
      return socket.emit('message:error', {
        code: 'INVALID_MESSAGE',
        message: 'Room ID and content are required',
        tempId
      });
    }

    const roomName = roomId.trim().toLowerCase();

    // Verify user is in room
    const isInRoom = await presenceManager.isUserInRoom(roomName, userId);
    if (!isInRoom) {
      return socket.emit('message:error', {
        code: 'NOT_IN_ROOM',
        message: 'You are not a member of this room',
        tempId
      });
    }

    // Save message to database
    const savedMessage = await Message.create({
      roomName,
      username: userId,
      text: content.trim()
    });

    // Get sender info
    const sender = await User.findByUsername(userId);

    // Prepare message data
    const messageData = {
      id: savedMessage.id,
      roomId: roomName,
      user: userId,
      text: savedMessage.text,
      timestamp: savedMessage.timestamp,
      replyToId: replyToId || null,
      attachments: attachments || [],
      isEdited: false
    };

    // Send confirmation to sender
    socket.emit('message:confirmed', {
      tempId,
      message: messageData
    });

    // Broadcast to other room members
    socket.to(roomName).emit('message:new', {
      message: messageData,
      sender: {
        id: userId,
        username: userId,
        avatar: sender?.avatar
      }
    });

    // Publish message via pub/sub for scalability
    await pubsubManager.publishToRoom(roomName, messageData);

    // Queue message for offline members
    const members = await presenceManager.getRoomMembers(roomName);
    for (const member of members) {
      const memberPresence = await presenceManager.getUserPresence(member);
      if (!memberPresence || memberPresence.status !== 'online') {
        await messageQueue.enqueueMessage(member, messageData);
      }
    }

    // Invalidate message cache
    await cacheManager.deletePattern(`messages:${roomName}:*`);

    console.log(`Message sent in room ${roomName} by ${userId}`);
  } catch (error) {
    console.error('Error in handleMessageSend:', error);
    socket.emit('message:error', {
      code: 'SEND_FAILED',
      message: 'Failed to send message',
      details: error.message,
      tempId: payload.tempId
    });
  }
};

/**
 * Handle message:edit event
 */
const handleMessageEdit = async (socket, io, payload) => {
  try {
    const { messageId, content } = payload;
    const userId = socket.userId;

    if (!messageId || !content) {
      return socket.emit('message:error', {
        code: 'INVALID_EDIT',
        message: 'Message ID and content are required'
      });
    }

    // Get original message
    const originalMessage = await Message.findByIdWithDetails(messageId);
    if (!originalMessage) {
      return socket.emit('message:error', {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found'
      });
    }

    // Verify ownership
    if (originalMessage.username !== userId) {
      return socket.emit('message:error', {
        code: 'UNAUTHORIZED',
        message: 'You can only edit your own messages'
      });
    }

    // Update message
    const updatedMessage = await Message.update(messageId, {
      text: content.trim()
    });

    // Broadcast to all room members
    io.to(originalMessage.room_name).emit('message:edited', {
      message: {
        id: updatedMessage.id,
        roomId: originalMessage.room_name,
        text: updatedMessage.text,
        isEdited: true,
        editedAt: updatedMessage.edited_at,
        timestamp: updatedMessage.timestamp
      }
    });

    // Invalidate cache
    await cacheManager.deletePattern(`messages:${originalMessage.room_name}:*`);

    console.log(`Message ${messageId} edited by ${userId}`);
  } catch (error) {
    console.error('Error in handleMessageEdit:', error);
    socket.emit('message:error', {
      code: 'EDIT_FAILED',
      message: 'Failed to edit message',
      details: error.message
    });
  }
};

/**
 * Handle message:delete event
 */
const handleMessageDelete = async (socket, io, payload) => {
  try {
    const { messageId } = payload;
    const userId = socket.userId;

    if (!messageId) {
      return socket.emit('message:error', {
        code: 'INVALID_DELETE',
        message: 'Message ID is required'
      });
    }

    // Get original message
    const originalMessage = await Message.findByIdWithDetails(messageId);
    if (!originalMessage) {
      return socket.emit('message:error', {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found'
      });
    }

    // Verify ownership
    if (originalMessage.username !== userId) {
      return socket.emit('message:error', {
        code: 'UNAUTHORIZED',
        message: 'You can only delete your own messages'
      });
    }

    // Delete message
    await Message.delete(messageId);

    // Broadcast to all room members
    io.to(originalMessage.room_name).emit('message:deleted', {
      messageId,
      roomId: originalMessage.room_name
    });

    // Invalidate cache
    await cacheManager.deletePattern(`messages:${originalMessage.room_name}:*`);

    console.log(`Message ${messageId} deleted by ${userId}`);
  } catch (error) {
    console.error('Error in handleMessageDelete:', error);
    socket.emit('message:error', {
      code: 'DELETE_FAILED',
      message: 'Failed to delete message',
      details: error.message
    });
  }
};

/**
 * Handle message:react event
 */
const handleMessageReact = async (socket, io, payload) => {
  try {
    const { messageId, emoji } = payload;
    const userId = socket.userId;

    if (!messageId || !emoji) {
      return socket.emit('message:error', {
        code: 'INVALID_REACTION',
        message: 'Message ID and emoji are required'
      });
    }

    // Get message to verify it exists and get room
    const message = await Message.findByIdWithDetails(messageId);
    if (!message) {
      return socket.emit('message:error', {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await Reaction.getUserReaction(messageId, userId, emoji);
    
    if (existingReaction) {
      // Remove reaction (toggle)
      await Reaction.delete({ messageId, username: userId, emoji });
    } else {
      // Add reaction
      await Reaction.create({
        messageId,
        username: userId,
        emoji
      });
    }

    // Get updated count
    const count = await Reaction.getEmojiCount(messageId, emoji);

    // Broadcast to all room members
    io.to(message.room_name).emit('message:reaction_added', {
      messageId,
      emoji,
      userId,
      count
    });

    // Send confirmation to sender
    socket.emit('message:reacted', {
      messageId,
      emoji,
      count,
      action: existingReaction ? 'removed' : 'added'
    });

    console.log(`User ${userId} reacted to message ${messageId} with ${emoji}`);
  } catch (error) {
    console.error('Error in handleMessageReact:', error);
    socket.emit('message:error', {
      code: 'REACT_FAILED',
      message: 'Failed to add reaction',
      details: error.message
    });
  }
};

/**
 * Handle typing:start event with throttling
 */
const handleTypingStart = async (socket, io, payload) => {
  try {
    const { roomId } = payload;
    const userId = socket.userId;

    if (!roomId) {
      return;
    }

    // Throttle: max once per 2 seconds
    if (throttleManager.isThrottled(userId, 'typing:start', 2000)) {
      return; // Silently ignore throttled events
    }

    const roomName = roomId.trim().toLowerCase();

    // Verify user is in room
    const isInRoom = await presenceManager.isUserInRoom(roomName, userId);
    if (!isInRoom) {
      return;
    }

    // Add to typing indicators
    await presenceManager.setUserTyping(roomName, userId);
    await presenceManager.updatePresenceField(userId, 'typing', 'true');

    // Get all users currently typing
    const typingUserIds = await presenceManager.getUsersTyping(roomName);
    const typingUsers = await Promise.all(
      typingUserIds.map(async (id) => {
        const user = await User.findByUsername(id);
        return user ? { id: user.username, username: user.username } : null;
      })
    );

    // Broadcast to room (excluding the typer)
    socket.to(roomName).emit('typing:update', {
      roomId: roomName,
      users: typingUsers.filter(u => u !== null && u.id !== userId)
    });

    // Publish typing indicator
    await pubsubManager.publishTypingIndicator(roomName, userId, true);
  } catch (error) {
    console.error('Error in handleTypingStart:', error);
  }
};

/**
 * Handle typing:stop event
 */
const handleTypingStop = async (socket, io, payload) => {
  try {
    const { roomId } = payload;
    const userId = socket.userId;

    if (!roomId) {
      return;
    }

    const roomName = roomId.trim().toLowerCase();

    // Remove from typing indicators
    await presenceManager.removeUserTyping(roomName, userId);
    await presenceManager.updatePresenceField(userId, 'typing', 'false');

    // Get remaining typing users
    const typingUserIds = await presenceManager.getUsersTyping(roomName);
    const typingUsers = await Promise.all(
      typingUserIds.map(async (id) => {
        const user = await User.findByUsername(id);
        return user ? { id: user.username, username: user.username } : null;
      })
    );

    // Broadcast to room
    socket.to(roomName).emit('typing:update', {
      roomId: roomName,
      users: typingUsers.filter(u => u !== null)
    });

    // Publish typing indicator
    await pubsubManager.publishTypingIndicator(roomName, userId, false);
  } catch (error) {
    console.error('Error in handleTypingStop:', error);
  }
};

/**
 * Handle presence:update event
 */
const handlePresenceUpdate = async (socket, io, payload) => {
  try {
    const { status } = payload;
    const userId = socket.userId;

    const validStatuses = ['online', 'away', 'busy'];
    if (!validStatuses.includes(status)) {
      return socket.emit('error', {
        code: 'INVALID_STATUS',
        message: 'Invalid presence status'
      });
    }

    // Update presence
    await presenceManager.updatePresenceField(userId, 'status', status);

    // Get user's current room
    const presence = await presenceManager.getUserPresence(userId);
    const currentRoom = presence?.currentRoom;

    // Broadcast to all connected clients (or just room members)
    const presenceData = {
      userId,
      status,
      lastSeen: Date.now()
    };

    if (currentRoom) {
      io.to(currentRoom).emit('presence:update', presenceData);
    } else {
      io.emit('presence:update', presenceData);
    }

    // Publish presence update
    await pubsubManager.publishPresenceUpdate(userId, {
      status,
      currentRoom: currentRoom || ''
    });

    console.log(`User ${userId} updated presence to ${status}`);
  } catch (error) {
    console.error('Error in handlePresenceUpdate:', error);
  }
};

/**
 * Handle heartbeat event
 */
const handleHeartbeat = async (socket, payload) => {
  try {
    const { timestamp } = payload;
    const userId = socket.userId;

    // Refresh presence
    await presenceManager.refreshPresence(userId);

    // Refresh session
    await sessionManager.refreshSession(socket.sessionId);

    // Optional: send heartbeat response
    socket.emit('heartbeat:ack', {
      timestamp: Date.now(),
      clientTimestamp: timestamp
    });
  } catch (error) {
    console.error('Error in handleHeartbeat:', error);
  }
};

/**
 * Handle disconnect event
 */
const handleDisconnect = async (socket, io) => {
  try {
    const userId = socket.userId;
    const sessionId = socket.sessionId;

    if (!userId) {
      return;
    }

    // Get user's current room
    const presence = await presenceManager.getUserPresence(userId);
    const currentRoom = presence?.currentRoom;

    if (currentRoom) {
      // Remove user from room
      await presenceManager.removeUserFromRoom(currentRoom, userId);

      // Remove typing indicator
      await presenceManager.removeUserTyping(currentRoom, userId);

      // Notify room members
      socket.to(currentRoom).emit('room:user_left', {
        roomId: currentRoom,
        userId
      });

      // Update room member count
      const memberIds = await presenceManager.getRoomMembers(currentRoom);
      await Room.updateMemberCount(currentRoom, memberIds.length);

      // Invalidate cache
      await cacheManager.delete('rooms:list');
    }

    // Update presence to offline
    await presenceManager.updatePresenceField(userId, 'status', 'offline');

    // Broadcast presence update
    io.emit('presence:update', {
      userId,
      status: 'offline',
      lastSeen: Date.now()
    });

    // Publish presence update
    await pubsubManager.publishPresenceUpdate(userId, {
      status: 'offline',
      currentRoom: ''
    });

    // Clean up throttle data
    throttleManager.clearUser(userId);

    // Delete session after delay (grace period for reconnection)
    setTimeout(async () => {
      const currentPresence = await presenceManager.getUserPresence(userId);
      if (currentPresence && currentPresence.status === 'offline') {
        await presenceManager.deleteUserPresence(userId);
        await sessionManager.deleteSession(sessionId);
      }
    }, 60000); // 1 minute grace period

    console.log(`User ${userId} disconnected`);
  } catch (error) {
    console.error('Error in handleDisconnect:', error);
  }
};

/**
 * Helper function to get rooms for a user
 */
const getRoomsForUser = async (userId) => {
  // In a real implementation, this would query room_members table
  // For now, return empty array or all public rooms
  try {
    const rooms = await Room.findAll();
    return rooms.map(room => ({
      id: room.name,
      name: room.name,
      description: room.description,
      isPrivate: room.is_private,
      memberCount: room.member_count
    }));
  } catch (error) {
    console.error('Error getting rooms for user:', error);
    return [];
  }
};

/**
 * Helper function to get unread counts for user
 */
const getUnreadCountsForUser = async (userId, rooms) => {
  // In a real implementation, this would track last_read_at per room
  // For now, return empty object
  const counts = {};
  for (const room of rooms) {
    counts[room.id] = 0;
  }
  return counts;
};

module.exports = {
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
};
