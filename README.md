# Chillin Chat Application ![Chillin](client/public/Chill.png)

A comprehensive multi-tenant real-time chat room application built with React, Node.js, and Socket.IO. This application provides a complete chat solution with room management, user authentication, message persistence, and advanced real-time features.

## Tools being utilized

- [HTML, CSS](https://www.w3.org/standards/webdesign/htmlcss)
- [JavaScript](https://www.javascript.com/)
- [NodeJS](https://nodejs.org/en/)
- [ReactJS](https://reactjs.org/)
- [Socket.io](https://socket.io/) - Real-time bidirectional communication
- [Express](https://expressjs.com/) - Backend web framework
- [React Router](https://reactrouter.com/) - Client-side routing

## Features

### Core Chat Functionality
- ✅ Real-time messaging with Socket.IO
- ✅ Multiple chat rooms support
- ✅ User presence indicators (online users list)
- ✅ Typing indicators showing when users are typing
- ✅ Message persistence (chat history survives server restarts)
- ✅ Emoji support in messages
- ✅ Responsive design (works on mobile and desktop)
- ✅ User join/leave notifications

### Multi-Tenancy Features
- ✅ Room list/discovery page
- ✅ Create custom rooms with names and descriptions
- ✅ Private rooms with password protection
- ✅ Room metadata (creation time, member count, creator)
- ✅ Dynamic room member count updates

### User Authentication
- ✅ User registration system
- ✅ User login system
- ✅ User profiles with auto-generated avatars
- ✅ Guest access (no authentication required)
- ✅ Session token management

### User Experience Enhancements
- ✅ Message timestamps
- ✅ Sender identification (your messages vs. others)
- ✅ Loading states for async operations
- ✅ Error handling and user feedback
- ✅ Input validation throughout the application
- ✅ Automatic scrolling to latest messages

### Error Handling & Validation
- ✅ Empty message validation
- ✅ Message length limits (500 characters)
- ✅ Username validation (3-20 characters)
- ✅ Room name validation (max 30 characters)
- ✅ Password validation (minimum 6 characters)
- ✅ Duplicate username prevention per room
- ✅ Disconnected user handling
- ✅ Invalid room name protection

### CORS & Production Ready
- ✅ Proper CORS configuration
- ✅ Environment variable support for client origin
- ✅ Comprehensive error logging
- ✅ RESTful API endpoints

## Project Structure

```
Chillin-Chatroom/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/       # Authentication UI
│   │   │   ├── Chat/       # Main chat interface
│   │   │   ├── InfoBar/    # Room header with leave button
│   │   │   ├── Input/      # Message input component
│   │   │   ├── Join/       # Simple join interface
│   │   │   ├── Messages/   # Message list container
│   │   │   │   └── Message/ # Individual message component
│   │   │   ├── RoomList/   # Room discovery and creation
│   │   │   └── TextContainer/ # Online users sidebar
│   │   ├── App.js          # Main routing
│   │   └── index.js        # Entry point
│   └── package.json
├── server/                  # Node.js backend
│   ├── index.js            # Main server with Socket.IO
│   ├── users.js            # User management (active connections)
│   ├── auth.js             # Authentication logic
│   ├── rooms.js            # Room management
│   ├── storage.js          # File-based persistence
│   ├── router.js           # Express routes
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v12 or higher)
- npm or yarn

### Server Setup
```bash
cd server
npm install
npm start
```
Server will run on `http://localhost:5000`

### Client Setup
```bash
cd client
npm install
npm start
```
Client will run on `http://localhost:3000`

## Usage Guide

### Quick Start (Guest Access)
1. Go to `http://localhost:3000`
2. Enter your name and room name
3. Click the arrow button to join
4. Start chatting!

### Browse & Join Rooms
1. Click "Browse Rooms" on the home page
2. Enter your name
3. View available rooms with member counts
4. Click "Join Room" on any room
5. Enter password if the room is private

### Create a New Room
1. Go to Browse Rooms page
2. Click "Create New Room"
3. Enter room name, description (optional)
4. Set password for private room (optional)
5. Click "Create Room"

### Authentication (Optional)
1. Click "Login / Register" on home page
2. Register a new account or login
3. Access additional features with authenticated account

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login existing user

### Room Management
- `GET /api/rooms` - Get list of all rooms
- `POST /api/rooms/create` - Create new room
- `POST /api/rooms/join` - Join room (with password if private)
- `GET /api/rooms/:roomName/messages` - Get message history for room

### Health Check
- `GET /` - Server status check

## Socket.IO Events

### Client → Server
- `join` - Join a chat room
- `sendMessage` - Send a message to room
- `typing` - Notify room that user is typing
- `stopTyping` - Notify room that user stopped typing
- `disconnect` - User disconnected

### Server → Client
- `message` - New message received
- `messageHistory` - Initial message history on join
- `roomData` - Updated room user list
- `userTyping` - Another user started typing
- `userStoppedTyping` - Another user stopped typing

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

## Data Persistence

The application uses file-based JSON storage for:
- **Message History**: Last 100 messages per room
- **Room Metadata**: Room settings, creators, descriptions
- **User Profiles**: Registered user data (hashed passwords)

Data is stored in `server/data/` directory.

## Security Features

- Password hashing using SHA-256
- Input validation and sanitization
- Message length limits
- Username uniqueness per room
- Protected private rooms
- CORS configuration for cross-origin requests

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

- File-based storage (for production, consider MongoDB or PostgreSQL)
- SHA-256 password hashing (for production, use bcrypt)
- No file/image sharing yet
- No message read receipts
- No rich text formatting (only emoji support)
- Session tokens not persisted (logout on page refresh)

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- File and image sharing
- Message read receipts
- Rich text formatting
- User profile customization
- Admin controls for room management
- Message search functionality
- Push notifications
- Video/voice chat integration

## Contributing

This project is part of a private discord server community. Feel free to fork and adapt for your own use.

## License

This project is open source and available for personal use.

## Live Server

- To be deployed

## Troubleshooting

### Server won't start
- Check if port 5000 is available
- Ensure all dependencies are installed: `npm install`

### Client can't connect to server
- Verify server is running on port 5000
- Check CORS configuration in `server/index.js`
- Update `ENDPOINT` in `Chat.js` if needed

### Messages not persisting
- Check `server/data/` directory exists
- Verify write permissions for data directory

### Users can't join rooms
- Check username length (3-20 characters)
- Verify room name is valid (max 30 characters)
- Ensure username is unique in that room
