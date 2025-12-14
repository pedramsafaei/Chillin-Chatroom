# REST API Implementation for Chillin-Chatroom

## Overview
This document provides a comprehensive overview of the REST API implementation for the Chillin-Chatroom application. The API has been designed to complement the existing Socket.IO real-time functionality with a complete set of RESTful endpoints.

## Base URL
All REST API endpoints are available at:
```
/api/v1
```

## Quick Start

### 1. Authentication
```bash
# Register a new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "email": "john@example.com", "password": "secret123"}'

# Response includes accessToken and refreshToken
# Use accessToken in Authorization header for subsequent requests
```

### 2. Create a Room
```bash
curl -X POST http://localhost:5000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name": "General Chat", "description": "Main discussion room"}'
```

### 3. Get Room Messages
```bash
curl http://localhost:5000/api/v1/rooms/1/messages?limit=50 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Key Features

### 🔐 Authentication & Authorization
- **Token-based authentication** using HMAC signatures
- **Three token types**: Access (30min), Refresh (7 days), Guest (24h)
- **Bearer token** format for API requests
- **Password hashing** with SHA-256
- **Authorization checks** to ensure users can only modify their own resources

### 📝 Complete CRUD Operations
- **Users**: Read and update profiles
- **Rooms**: Full CRUD with member management
- **Messages**: Read, update, delete with reactions
- **Attachments**: Presigned URL upload flow

### 📊 Pagination & Filtering
- **Offset-based pagination** for lists (rooms, members)
- **Cursor-based pagination** for messages (using message ID)
- **Filtering support** (by status, category, etc.)
- **Sorting options** (by date, member count, etc.)

### ⚡ Performance Optimization
- **Redis caching** for frequently accessed data
- **Automatic cache invalidation** on updates
- **Query optimization** with proper indexes
- **Efficient pagination** to reduce load

### 🔄 Real-time Integration
- **Seamless Socket.IO integration** - both work together
- **Shared session management** via Redis
- **Shared database** for data consistency
- **Real-time updates** via Socket.IO, REST for queries

### 🛡️ Security Best Practices
- **Input validation** on all endpoints
- **SQL injection prevention** via parameterized queries
- **XSS protection** through input sanitization
- **Rate limiting ready** (can add middleware)
- **CORS configuration** for cross-origin requests

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Application                │
├─────────────────────────────────────────────────────┤
│  REST API Calls              Socket.IO Events       │
│  (HTTP/HTTPS)                (WebSocket)           │
└──────────┬───────────────────────┬──────────────────┘
           │                       │
           v                       v
┌─────────────────────────────────────────────────────┐
│              Express.js Server (index.js)           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐         ┌──────────────────┐    │
│  │ REST API     │         │ Socket.IO        │    │
│  │ Routes       │         │ Event Handlers   │    │
│  │ (/api/v1/*)  │         │                  │    │
│  └──────┬───────┘         └────────┬─────────┘    │
│         │                           │              │
│         v                           v              │
│  ┌──────────────────────────────────────────┐     │
│  │         Middleware Layer                  │     │
│  │  • Authentication (Bearer token)          │     │
│  │  • Validation (Request inputs)            │     │
│  │  • Error handling                         │     │
│  └──────────────┬────────────────────────────┘     │
│                 │                                   │
│                 v                                   │
│  ┌──────────────────────────────────────────┐     │
│  │         Business Logic Layer              │     │
│  │  • Database Models (User, Room, Message)  │     │
│  │  • Redis Managers (Cache, Session)        │     │
│  │  • S3 Storage Manager                     │     │
│  └──────────────┬────────────────────────────┘     │
└─────────────────┼───────────────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────────────┐
│              Infrastructure Layer                   │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │PostgreSQL│  │  Redis   │  │ S3/MinIO         │ │
│  │(Database)│  │ (Cache,  │  │ (File Storage)   │ │
│  │          │  │ Sessions)│  │                  │ │
│  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Endpoint Categories

### 1. Authentication (`/api/v1/auth/*`)
- User registration and login
- Guest user creation
- Token refresh and logout
- Current user information

### 2. Users (`/api/v1/users/*`)
- User profile retrieval
- Profile updates
- User's room list
- Avatar upload

### 3. Rooms (`/api/v1/rooms/*`)
- Room listing with pagination
- Room creation and management
- Join/leave operations
- Member list
- Message history

### 4. Messages (`/api/v1/messages/*`)
- Message retrieval
- Message editing and deletion
- Reaction management

### 5. Uploads (`/api/v1/uploads/*`)
- Presigned URL generation
- Upload completion tracking

## File Structure

```
server/
├── index.js                    # Main server file with route mounting
├── middleware/
│   ├── auth.js                # Authentication & token management
│   ├── validation.js          # Request validation
│   └── messageValidation.js   # Legacy message validation
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── users.js              # User management endpoints
│   ├── rooms.js              # Room management endpoints
│   ├── messages.js           # Message management endpoints
│   └── uploads.js            # File upload endpoints
├── database/
│   ├── models/
│   │   ├── User.js          # Enhanced user model
│   │   ├── Room.js          # Enhanced room model
│   │   ├── Message.js       # Enhanced message model
│   │   ├── Reaction.js      # Reaction model
│   │   └── Attachment.js    # Attachment model (new)
│   ├── connection.js        # Database connection
│   └── migrations.js        # Schema migrations
├── redis/
│   ├── connection.js        # Redis connection
│   ├── session.js           # Session management
│   ├── cache.js             # Cache management
│   └── ...                  # Other Redis managers
├── storage/
│   └── s3Client.js          # S3/MinIO client
├── API_DOCUMENTATION.md     # Detailed API documentation
└── test-api.sh             # API testing script
```

## Token Types

### Access Token (30 minutes)
- Used for API authentication
- Short-lived for security
- Must be refreshed when expired

### Refresh Token (7 days)
- Used to obtain new access tokens
- Longer-lived for convenience
- Should be stored securely

### Guest Token (24 hours)
- For temporary guest users
- No refresh capability
- Expires after 24 hours

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Descriptive error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Testing

Use the provided test script:
```bash
cd server
./test-api.sh
```

Or test manually:
```bash
# Health check
curl http://localhost:5000/health

# Create guest user
curl -X POST http://localhost:5000/api/v1/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"nickname": "TestUser", "emoji": "👤"}'

# List rooms
curl http://localhost:5000/api/v1/rooms
```

## Environment Variables

Required:
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

Optional:
- `JWT_SECRET` - Secret for token signing (default: auto-generated)
- `S3_ACCESS_KEY_ID` - AWS S3 access key
- `S3_SECRET_ACCESS_KEY` - AWS S3 secret key
- `S3_BUCKET_NAME` - S3 bucket name
- `USE_MINIO` - Use MinIO instead of S3 (true/false)
- `MINIO_ENDPOINT` - MinIO endpoint URL

## Backward Compatibility

The REST API is fully compatible with the existing Socket.IO implementation:

✅ **Preserved Features:**
- All Socket.IO event handlers
- Legacy HTTP endpoints (/api/auth/*, /api/rooms/*)
- Redis session management
- Database schema (with enhancements)
- Real-time message broadcasting

✅ **Coexistence:**
- REST API for CRUD operations
- Socket.IO for real-time updates
- Both can be used simultaneously
- Shared data layer ensures consistency

## Next Steps

1. **Deploy**: Set environment variables and start the server
2. **Test**: Use the test script to verify endpoints
3. **Monitor**: Check logs for any issues
4. **Scale**: Add Redis adapter for horizontal scaling
5. **Enhance**: Add rate limiting, more caching, etc.

## Documentation

- **API Reference**: `server/API_DOCUMENTATION.md`
- **Implementation Summary**: `.agents/implementation_summary.md`
- **Requirements Checklist**: `.agents/requirements_checklist.md`

## Support

For issues or questions:
1. Check the API documentation
2. Review the implementation summary
3. Examine the error logs
4. Test with the provided script

---

**Note**: Dockerfile validation was skipped due to INTEGRATIONS_ONLY network mode, as per task guidelines. The implementation is complete and ready for use, but Docker builds may require additional network configuration.
