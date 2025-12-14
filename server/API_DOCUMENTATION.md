# Chillin Chatroom REST API Documentation

Base URL: `/api/v1`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://...",
    "display_name": "johndoe",
    "status": "offline",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "string (30min expiry)",
  "refreshToken": "string (7day expiry)"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {...},
  "accessToken": "string",
  "refreshToken": "string"
}
```

#### POST /auth/guest
Create a guest user account (24h token expiry).

**Request Body:**
```json
{
  "nickname": "string (2-30 chars)",
  "emoji": "string (optional)"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 2,
    "username": "guest_abc123",
    "display_name": "GuestUser",
    "avatar": "...",
    "isGuest": true
  },
  "accessToken": "string (24h expiry)"
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

#### POST /auth/logout
Logout current user (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/me
Get current authenticated user information.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "display_name": "John Doe",
    "avatar": "https://...",
    "status": "online",
    "status_message": "Available"
  }
}
```

## User Endpoints

#### GET /users/:id
Get user by ID (requires authentication).

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "display_name": "John Doe",
    "avatar": "https://...",
    "status": "online"
  }
}
```

#### PATCH /users/:id
Update user profile (requires authentication, own profile only).

**Request Body:**
```json
{
  "displayName": "string (optional, max 100 chars)",
  "avatar": "string (optional, URL)",
  "statusMessage": "string (optional)"
}
```

**Response (200):**
```json
{
  "user": {...}
}
```

#### GET /users/:id/rooms
Get all rooms for a user (requires authentication, own profile only).

**Response (200):**
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "General",
      "slug": "general",
      "description": "General discussion",
      "theme_color": "#4A90E2",
      "icon": "💬",
      "role": "member",
      "joined_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /users/:id/avatar
Upload user avatar (requires authentication).

**Note:** Currently returns 501. Use `/uploads/presign` flow instead.

## Room Endpoints

#### GET /rooms
List rooms with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `sort` (string: 'created_at' | 'members', default: 'created_at')
- `category` (string, optional)

**Response (200):**
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "General",
      "slug": "general",
      "description": "General discussion",
      "creator": "admin",
      "theme_color": "#4A90E2",
      "icon": "💬",
      "is_private": false,
      "member_count": 10,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### POST /rooms
Create a new room (requires authentication).

**Request Body:**
```json
{
  "name": "string (3-100 chars, required)",
  "description": "string (optional)",
  "type": "public | private (optional)",
  "themeColor": "string (hex color, optional)",
  "icon": "string (emoji, optional)",
  "maxMembers": "number (optional)"
}
```

**Response (201):**
```json
{
  "room": {
    "id": 1,
    "name": "New Room",
    "slug": "new-room",
    "description": "...",
    "creator": "johndoe",
    "theme_color": "#4A90E2",
    "icon": "💬",
    "member_count": 0
  }
}
```

#### GET /rooms/:id
Get room details by ID.

**Response (200):**
```json
{
  "room": {
    "id": 1,
    "name": "General",
    "slug": "general",
    "description": "...",
    "member_count": 10,
    "online_count": 3,
    "theme_color": "#4A90E2",
    "icon": "💬"
  }
}
```

#### PATCH /rooms/:id
Update room details (requires authentication, owner only).

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "settings": "object (optional)"
}
```

**Response (200):**
```json
{
  "room": {...}
}
```

#### DELETE /rooms/:id
Delete room (requires authentication, owner only).

**Response (200):**
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

#### POST /rooms/:id/join
Join a room (requires authentication).

**Response (201):**
```json
{
  "membership": {
    "room_id": 1,
    "user_id": 1,
    "role": "member",
    "joined_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /rooms/:id/leave
Leave a room (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "message": "Left room successfully"
}
```

#### GET /rooms/:id/members
Get room members with pagination.

**Query Parameters:**
- `status` (string: 'online' | 'offline' | 'away' | 'busy', optional)
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)

**Response (200):**
```json
{
  "members": [
    {
      "id": 1,
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar": "https://...",
      "status": "online",
      "role": "member",
      "joined_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

#### GET /rooms/:id/messages
Get room messages with pagination.

**Query Parameters:**
- `before` (number: message ID, optional - for cursor-based pagination)
- `limit` (number, default: 50, max: 100)

**Response (200):**
```json
{
  "messages": [
    {
      "id": 1,
      "room_name": "general",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar": "https://...",
      "text": "Hello world!",
      "type": "text",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "is_edited": false
    }
  ],
  "hasMore": true
}
```

## Message Endpoints

#### GET /messages/:id
Get message by ID (requires authentication).

**Response (200):**
```json
{
  "message": {
    "id": 1,
    "room_name": "general",
    "username": "johndoe",
    "text": "Hello!",
    "type": "text",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /messages/:id
Update message content (requires authentication, own message only).

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response (200):**
```json
{
  "message": {
    "id": 1,
    "text": "Updated text",
    "is_edited": true,
    "edited_at": "2024-01-01T00:01:00.000Z"
  }
}
```

#### DELETE /messages/:id
Delete message (soft delete, requires authentication, own message only).

**Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

#### POST /messages/:id/reactions
Add emoji reaction to message (requires authentication).

**Request Body:**
```json
{
  "emoji": "string (required, e.g., '👍')"
}
```

**Response (201):**
```json
{
  "reaction": {
    "message_id": 1,
    "username": "johndoe",
    "emoji": "👍",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### DELETE /messages/:id/reactions/:emoji
Remove emoji reaction from message (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "message": "Reaction removed successfully"
}
```

## Upload Endpoints

#### POST /uploads/presign
Generate presigned URL for file upload (requires authentication).

**Request Body:**
```json
{
  "fileName": "string (required)",
  "mimeType": "string (required)",
  "size": "number (required, max 10MB)"
}
```

**Response (200):**
```json
{
  "uploadUrl": "string (presigned URL for PUT request)",
  "fileUrl": "string (final file URL)",
  "fields": {
    "key": "string",
    "Content-Type": "string"
  }
}
```

**Error (503):**
```json
{
  "error": "File upload service not configured. Please set up S3/MinIO."
}
```

#### POST /uploads/complete
Mark upload as complete and optionally attach to message (requires authentication).

**Request Body:**
```json
{
  "fileUrl": "string (required)",
  "messageId": "number (optional)",
  "fileName": "string (optional)",
  "mimeType": "string (optional)",
  "size": "number (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "attachment": {
    "id": 1,
    "message_id": 1,
    "file_name": "image.png",
    "file_size": 1024,
    "mime_type": "image/png",
    "url": "https://...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Descriptive error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "No authorization token provided"
}
```

**403 Forbidden:**
```json
{
  "error": "Not authorized to perform this action"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**409 Conflict:**
```json
{
  "error": "Resource already exists"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to process request"
}
```

## Authentication Flow

1. **Register/Login:** Use `/auth/register` or `/auth/login` to get `accessToken` and `refreshToken`
2. **Use Access Token:** Include in Authorization header: `Bearer <accessToken>`
3. **Refresh Token:** When access token expires (30 min), use `/auth/refresh` with refresh token
4. **Guest Users:** Use `/auth/guest` for temporary access (24h expiry, no refresh)

## Socket.IO Compatibility

The REST API is fully compatible with existing Socket.IO real-time functionality. Socket.IO handles:
- Real-time message broadcasting
- Typing indicators
- User presence updates
- Room member updates

REST API handles:
- User registration and authentication
- Room management (CRUD operations)
- Message history retrieval
- User profile management
- File uploads

Both can be used simultaneously for optimal user experience.
