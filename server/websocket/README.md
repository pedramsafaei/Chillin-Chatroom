# WebSocket Events System

This module implements the WebSocket events system for the Chillin Chatroom application using Socket.io.

## Architecture

- `index.js` - Main WebSocket initialization and event registration
- `auth.js` - Authentication middleware for WebSocket connections
- `handlers.js` - Event handler implementations
- `throttle.js` - Rate limiting/throttling utility for events

## Authentication

Clients must authenticate using an access token in the query parameters:

```javascript
const socket = io('ws://server/socket.io', {
  query: { token: '<accessToken>' }
});
```

The token is validated against the session stored in Redis.

## Client to Server Events

### connection
- **Trigger**: Automatic on successful connection
- **Authentication**: Token in query params
- **Response**: `connected` event with initial data

### room:join
- **Payload**: `{ roomId: string }`
- **Response**: `room:joined` | `room:error`
- **Description**: Join a chat room

### room:leave
- **Payload**: `{ roomId: string }`
- **Response**: `room:left`
- **Description**: Leave a chat room

### message:send
- **Payload**: `{ tempId: string, roomId: string, content: string, replyToId?: string, attachments?: string[] }`
- **Response**: `message:confirmed` | `message:error`
- **Description**: Send a message to a room

### message:edit
- **Payload**: `{ messageId: string, content: string }`
- **Response**: `message:edited` | `message:error`
- **Description**: Edit an existing message

### message:delete
- **Payload**: `{ messageId: string }`
- **Response**: `message:deleted` | `message:error`
- **Description**: Delete a message

### message:react
- **Payload**: `{ messageId: string, emoji: string }`
- **Response**: `message:reacted`
- **Description**: Add or remove a reaction to a message

### typing:start
- **Payload**: `{ roomId: string }`
- **Throttled**: Max once per 2 seconds
- **Description**: Indicate user is typing

### typing:stop
- **Payload**: `{ roomId: string }`
- **Description**: Indicate user stopped typing

### presence:update
- **Payload**: `{ status: 'online' | 'away' | 'busy' }`
- **Description**: Update user presence status

### heartbeat
- **Payload**: `{ timestamp: number }`
- **Interval**: Every 30 seconds
- **Description**: Keep connection alive and refresh presence

## Server to Client Events

### connected
- **Payload**: `{ userId: string, sessionId: string, rooms: Room[], unreadCounts: {} }`
- **Description**: Sent on successful connection with initial state

### room:joined
- **Payload**: `{ room: Room, members: User[], recentMessages: Message[] }`
- **Description**: Confirmation of joining a room

### room:user_joined
- **Payload**: `{ roomId: string, user: User }`
- **Broadcast to**: All room members
- **Description**: Another user joined the room

### room:user_left
- **Payload**: `{ roomId: string, userId: string }`
- **Broadcast to**: All room members
- **Description**: A user left the room

### message:new
- **Payload**: `{ message: Message, sender: User }`
- **Broadcast to**: All room members except sender
- **Description**: New message in room

### message:confirmed
- **Payload**: `{ tempId: string, message: Message }`
- **Sent to**: Sender only
- **Description**: Confirmation of message delivery

### message:edited
- **Payload**: `{ message: Message }`
- **Broadcast to**: All room members
- **Description**: A message was edited

### message:deleted
- **Payload**: `{ messageId: string, roomId: string }`
- **Broadcast to**: All room members
- **Description**: A message was deleted

### message:reaction_added
- **Payload**: `{ messageId: string, emoji: string, userId: string, count: number }`
- **Broadcast to**: All room members
- **Description**: Reaction added or removed from message

### typing:update
- **Payload**: `{ roomId: string, users: [{ id, username }] }`
- **Broadcast to**: All room members except typers
- **Description**: List of users currently typing

### presence:update
- **Payload**: `{ userId: string, status: string, lastSeen?: timestamp }`
- **Description**: User presence status changed

### error
- **Payload**: `{ code: string, message: string, details?: any }`
- **Description**: Error notification

## Error Codes

- `AUTH_FAILED` - Authentication failed
- `ROOM_NOT_FOUND` - Requested room doesn't exist
- `INVALID_ROOM` - Invalid room data
- `INVALID_MESSAGE` - Invalid message data
- `MESSAGE_NOT_FOUND` - Message not found
- `NOT_IN_ROOM` - User not a member of room
- `UNAUTHORIZED` - Unauthorized action
- `INVALID_STATUS` - Invalid presence status
- `CONNECTION_ERROR` - General connection error

## Usage Example

```javascript
// Client-side
const socket = io('ws://localhost:5000', {
  query: { token: sessionToken }
});

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Join a room
socket.emit('room:join', { roomId: 'general' });

socket.on('room:joined', (data) => {
  console.log('Joined room:', data);
});

// Send a message
const tempId = generateUUID();
socket.emit('message:send', {
  tempId,
  roomId: 'general',
  content: 'Hello, world!'
});

socket.on('message:confirmed', (data) => {
  console.log('Message confirmed:', data);
});

// Listen for new messages
socket.on('message:new', (data) => {
  console.log('New message:', data);
});

// Typing indicators
socket.emit('typing:start', { roomId: 'general' });
setTimeout(() => {
  socket.emit('typing:stop', { roomId: 'general' });
}, 2000);

// Heartbeat (every 30 seconds)
setInterval(() => {
  socket.emit('heartbeat', { timestamp: Date.now() });
}, 30000);
```

## Throttling

The `typing:start` event is throttled to prevent flooding. A user can emit this event at most once every 2 seconds. Additional events within this window are silently ignored.

## Presence Management

User presence is tracked using Redis and automatically updated on:
- Connection/disconnection
- Room join/leave
- Heartbeat
- Explicit presence updates

Users are marked as offline after 1 minute of disconnection (grace period for reconnection).
