import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./RoomList.css";

const roomThemes = ['blue', 'purple', 'green', 'orange', 'cyan', 'rose'];
const CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'new', label: 'New', icon: '✨' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'random', label: 'Random', icon: '🎲' }
];

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    password: "",
  });
  const [userName, setUserName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomPassword, setRoomPassword] = useState("");
  const [activeCategory, setActiveCategory] = useState('trending');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/rooms");
      const data = await response.json();
      setRooms(data.rooms);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!userName) {
      alert("Please enter your name first!");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newRoom,
          creator: userName,
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowCreateForm(false);
        setNewRoom({ name: "", description: "", password: "" });
        fetchRooms();
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room!");
    }
  };

  const handleJoinRoom = (room) => {
    if (!userName) {
      alert("Please enter your name first!");
      return;
    }
    if (room.isPrivate) {
      setSelectedRoom(room);
    } else {
      joinRoom(room.name, "");
    }
  };

  const joinRoom = async (roomName, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName, password }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        window.location.href = `/chat?name=${userName}&room=${roomName}`;
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room!");
    }
  };

  const handlePrivateRoomSubmit = (e) => {
    e.preventDefault();
    if (selectedRoom) {
      joinRoom(selectedRoom.name, roomPassword);
      setSelectedRoom(null);
      setRoomPassword("");
    }
  };

  const getRoomTheme = (index) => {
    return roomThemes[index % roomThemes.length];
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="rooms-page">
      {/* Top Navigation */}
      <nav className="rooms-navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <div className="logo-icon gradient-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 2H2C1.44772 2 1 2.44772 1 3V4C1 4.55228 1.44772 5 2 5H3C3.55228 5 4 4.55228 4 4V3C4 2.44772 3.55228 2 3 2Z" fill="white"/>
                <path d="M8 2H7C6.44772 2 6 2.44772 6 3V4C6 4.55228 6.44772 5 7 5H8C8.55228 5 9 4.55228 9 4V3C9 2.44772 8.55228 2 8 2Z" fill="white"/>
                <path d="M13 2H12C11.4477 2 11 2.44772 11 3V4C11 4.55228 11.4477 5 12 5H13C13.5523 5 14 4.55228 14 4V3C14 2.44772 13.5523 2 13 2Z" fill="white"/>
              </svg>
            </div>
            <span className="navbar-title">SPACES</span>
          </Link>
          
          <div className="navbar-actions">
            <button className="navbar-icon-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C10 2 8 2 8 4C8 5.5 9 6 10 6C11 6 12 5.5 12 4C12 2 10 2 10 2Z" fill="currentColor"/>
                <path d="M10 6V10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="notification-badge">3</span>
            </button>
            <button className="navbar-icon-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="5" r="2" fill="currentColor"/>
                <circle cx="10" cy="10" r="2" fill="currentColor"/>
                <circle cx="10" cy="15" r="2" fill="currentColor"/>
              </svg>
            </button>
            <button className="navbar-avatar">
              <span className="avatar-text">U</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="rooms-container">
        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM15 15l3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* User Name Input */}
        {!userName && (
          <div className="user-input-banner">
            <input
              type="text"
              placeholder="Enter your display name to join rooms"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="user-name-input"
            />
          </div>
        )}

        {/* Rooms Grid */}
        <div className="rooms-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Loading spaces...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path d="M20 28C20 28 24 24 32 24C40 24 44 28 44 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="24" cy="32" r="2" fill="currentColor"/>
                <circle cx="40" cy="32" r="2" fill="currentColor"/>
              </svg>
              <h3>No spaces found</h3>
              <p>Try adjusting your search or create a new space!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {filteredRooms.map((room, index) => (
                <div key={room.name} className="room-card" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className={`room-preview gradient-${getRoomTheme(index)}`}>
                    <div className="room-preview-overlay">
                      {room.memberCount > 0 && (
                        <div className="active-indicator">
                          <span className="pulse-dot"></span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="room-card-body">
                    <h3 className="room-card-title">{room.name}</h3>
                    {room.description && (
                      <p className="room-card-description">{room.description}</p>
                    )}
                    
                    <div className="room-card-meta">
                      <div className="room-online-count">
                        👥 {room.memberCount || 0} online
                      </div>
                    </div>
                    
                    <button
                      className="join-room-btn"
                      onClick={() => handleJoinRoom(room)}
                      disabled={!userName}
                    >
                      Join Room →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create New Room Button */}
        <div className="create-room-fixed">
          <button
            className="create-room-fab"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span>Create New Room</span>
          </button>
        </div>

        {/* Create Room Modal */}
        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
              
              <h2 className="modal-title">Create a New Space</h2>
              
              <form onSubmit={handleCreateRoom} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Space Name*</label>
                  <input
                    type="text"
                    placeholder="e.g., Design Team"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="What's this space about?"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    className="form-textarea"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave empty for public space"
                    value={newRoom.password}
                    onChange={(e) => setNewRoom({ ...newRoom, password: e.target.value })}
                    className="form-input"
                  />
                </div>
                
                <button type="submit" className="modal-button primary" disabled={!userName}>
                  Create Space
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Password Modal */}
        {selectedRoom && (
          <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedRoom(null)}>×</button>
              
              <h2 className="modal-title">Enter Password</h2>
              <p className="modal-subtitle">
                This space is private. Enter the password to join <strong>{selectedRoom.name}</strong>
              </p>
              
              <form onSubmit={handlePrivateRoomSubmit} className="modal-form">
                <input
                  type="password"
                  placeholder="Enter password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="form-input"
                  autoFocus
                  required
                />
                <button type="submit" className="modal-button primary">
                  Join Space
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;
