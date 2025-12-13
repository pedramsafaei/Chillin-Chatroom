import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const SAMPLE_ROOMS = [
  { name: 'General', emoji: '💬', online: 42, status: 'active' },
  { name: 'Gaming', emoji: '🎮', online: 18, status: 'active' },
  { name: 'Tech Talk', emoji: '💻', online: 7, status: 'idle' },
  { name: 'Random', emoji: '🎲', online: 0, status: 'offline' },
];

const SAMPLE_DMS = [
  { name: 'Alice', status: 'active' },
  { name: 'Bob', status: 'idle' },
  { name: 'Charlie', status: 'offline' },
];

const Sidebar = ({ currentRoom, currentUser }) => {
  const getStatusIndicator = (status) => {
    if (status === 'active') return '🟢';
    if (status === 'idle') return '🟡';
    return '⚫';
  };

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <div className="logo-icon gradient-blue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 1H1C0.447715 1 0 1.44772 0 2V3C0 3.55228 0.447715 4 1 4H2C2.55228 4 3 3.55228 3 3V2C3 1.44772 2.55228 1 2 1Z" fill="white"/>
              <path d="M6 1H5C4.44772 1 4 1.44772 4 2V3C4 3.55228 4.44772 4 5 4H6C6.55228 4 7 3.55228 7 3V2C7 1.44772 6.55228 1 6 1Z" fill="white"/>
              <path d="M10 1H9C8.44772 1 8 1.44772 8 2V3C8 3.55228 8.44772 4 9 4H10C10.5523 4 11 3.55228 11 3V2C11 1.44772 10.5523 1 10 1Z" fill="white"/>
            </svg>
          </div>
          <span className="brand-text">SPACES</span>
        </Link>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="section-header">
            <span className="section-title">ROOMS</span>
          </div>
          <div className="rooms-list">
            {SAMPLE_ROOMS.map((room, index) => (
              <div 
                key={index} 
                className={`room-item ${room.name === currentRoom ? 'active' : ''}`}
              >
                <span className="room-emoji">{room.emoji}</span>
                <div className="room-item-info">
                  <span className="room-name">{room.name}</span>
                  <div className="room-meta">
                    <span className="status-indicator">{getStatusIndicator(room.status)}</span>
                    <span className="room-online">{room.online} online</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <span className="section-title">DIRECT MESSAGES</span>
          </div>
          <div className="dms-list">
            {SAMPLE_DMS.map((dm, index) => (
              <div key={index} className="dm-item">
                <div className="dm-avatar">
                  <span className="avatar-text">{dm.name.charAt(0)}</span>
                  <span className="dm-status">{getStatusIndicator(dm.status)}</span>
                </div>
                <span className="dm-name">{dm.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <Link to="/rooms" className="add-room-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Add Room</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
