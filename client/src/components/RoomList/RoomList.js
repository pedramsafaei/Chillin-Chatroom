import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./RoomList.css";

// Room theme colors
const roomThemes = ['blue', 'purple', 'green', 'orange', 'cyan', 'rose'];

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

  return (
    <div className="rooms-page">
      <div className="rooms-container">
        {/* Header */}
        <header className="rooms-header">
          <div className="header-content">
            <div className="brand-section">
              <div className="brand-logo">
                <div className="logo-icon gradient-blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3 2H2C1.44772 2 1 2.44772 1 3V4C1 4.55228 1.44772 5 2 5H3C3.55228 5 4 4.55228 4 4V3C4 2.44772 3.55228 2 3 2Z" fill="white"/>
                    <path d="M8 2H7C6.44772 2 6 2.44772 6 3V4C6 4.55228 6.44772 5 7 5H8C8.55228 5 9 4.55228 9 4V3C9 2.44772 8.55228 2 8 2Z" fill="white"/>
                    <path d="M13 2H12C11.4477 2 11 2.44772 11 3V4C11 4.55228 11.4477 5 12 5H13C13.5523 5 14 4.55228 14 4V3C14 2.44772 13.5523 2 13 2Z" fill="white"/>
                  </svg>
                </div>
                <h1 className="brand-name">Spaces</h1>
              </div>
              <p className="header-subtitle">Discover and join conversations</p>
            </div>
            <button
              className={`create-room-button ${showCreateForm ? 'active' : ''}`}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {showCreateForm ? "Cancel" : "Create Space"}
            </button>
          </div>

          {/* User Name Input */}
          <div className="user-input-section">
            <div className="input-group">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
                <path d="M10 12C4.477 12 0 14.477 0 17.5V20H20V17.5C20 14.477 15.523 12 10 12Z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                placeholder="Enter your display name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="user-name-input"
              />
              {userName && (
                <span className="input-indicator">✓</span>
              )}
            </div>
          </div>
        </header>

        {/* Create Room Form */}
        {showCreateForm && (
          <div className="create-room-section fade-in">
            <form className="create-room-form" onSubmit={handleCreateRoom}>
              <h2 className="form-title">Create a New Space</h2>
              <div className="form-grid">
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
                <div className="form-group full-width">
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
              </div>
              <button type="submit" className="submit-button" disabled={!userName}>
                Create Space
              </button>
            </form>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="rooms-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Loading spaces...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path d="M32 32C41.9411 32 50 23.9411 50 14C50 4.05887 41.9411 -4 32 -4C22.0589 -4 14 4.05887 14 14C14 23.9411 22.0589 32 32 32ZM32 38C21.12 38 0 43.44 0 54V60H64V54C64 43.44 42.88 38 32 38Z" fill="currentColor"/>
              </svg>
              <h3>No spaces yet</h3>
              <p>Be the first to create a space and start a conversation!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room, index) => (
                <div key={room.name} className="room-card fade-in">
                  <div className={`room-theme gradient-${getRoomTheme(index)}`}></div>
                  <div className="room-card-content">
                    <div className="room-header">
                      <div className={`room-icon gradient-${getRoomTheme(index)}`}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M2 2H1C0.447715 2 0 2.44772 0 3V4C0 4.55228 0.447715 5 1 5H2C2.55228 5 3 4.55228 3 4V3C3 2.44772 2.55228 2 2 2Z" fill="white"/>
                          <path d="M6 2H5C4.44772 2 4 2.44772 4 3V4C4 4.55228 4.44772 5 5 5H6C6.55228 5 7 4.55228 7 4V3C7 2.44772 6.55228 2 6 2Z" fill="white"/>
                          <path d="M10 2H9C8.44772 2 8 2.44772 8 3V4C8 4.55228 8.44772 5 9 5H10C10.5523 5 11 4.55228 11 4V3C11 2.44772 10.5523 2 10 2Z" fill="white"/>
                        </svg>
                      </div>
                      <div className="room-title-section">
                        <h3 className="room-title">{room.name}</h3>
                        {room.isPrivate && (
                          <span className="private-badge">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M10 5H9V3.5C9 1.57 7.43 0 5.5 0C3.57 0 2 1.57 2 3.5V5H1C0.45 5 0 5.45 0 6V11C0 11.55 0.45 12 1 12H10C10.55 12 11 11.55 11 11V6C11 5.45 10.55 5 10 5ZM6.5 9H4.5V7H6.5V9ZM7.6 5H3.4V3.5C3.4 2.34 4.34 1.4 5.5 1.4C6.66 1.4 7.6 2.34 7.6 3.5V5Z" fill="currentColor"/>
                            </svg>
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                    {room.description && (
                      <p className="room-description">{room.description}</p>
                    )}
                    <div className="room-meta">
                      <div className="meta-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
                        </svg>
                        <span>{room.memberCount || 0} members</span>
                      </div>
                      <div className="meta-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/>
                        </svg>
                        <span>{room.creator}</span>
                      </div>
                    </div>
                    <button
                      className="join-room-button"
                      onClick={() => handleJoinRoom(room)}
                      disabled={!userName}
                    >
                      Join Space
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="rooms-footer">
          <Link to="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Quick Join
          </Link>
        </footer>
      </div>

      {/* Password Modal */}
      {selectedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enter Password</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedRoom(null)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <p className="modal-subtitle">
              This space is private. Enter the password to join <strong>{selectedRoom.name}</strong>
            </p>
            <form onSubmit={handlePrivateRoomSubmit} className="modal-form">
              <input
                type="password"
                placeholder="Enter password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="modal-input"
                autoFocus
                required
              />
              <div className="modal-actions">
                <button type="submit" className="modal-button primary">
                  Join Space
                </button>
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={() => {
                    setSelectedRoom(null);
                    setRoomPassword("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;
