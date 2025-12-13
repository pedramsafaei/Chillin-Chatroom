import React from "react";
import "./TextContainer.css";

const TextContainer = ({ users, room }) => (
  <div className="text-container">
    <div className="sidebar-header">
      <h3 className="sidebar-title">Space Info</h3>
    </div>

    <div className="sidebar-section">
      <div className="section-header">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
        </svg>
        <h4 className="section-title">
          Members ({users ? users.length : 0})
        </h4>
      </div>

      {users && users.length > 0 ? (
        <div className="users-list">
          {users.map(({ name }, index) => (
            <div key={`${name}-${index}`} className="user-item">
              <div className={`user-avatar gradient-${getAvatarColor(index)}`}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{name}</span>
                <div className="user-status">
                  <span className="status-dot online"></span>
                  <span className="status-label">Online</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 24C29.52 24 34 19.52 34 14C34 8.48 29.52 4 24 4C18.48 4 14 8.48 14 14C14 19.52 18.48 24 24 24ZM24 28C17.34 28 4 31.34 4 38V42H44V38C44 31.34 30.66 28 24 28Z" fill="currentColor"/>
          </svg>
          <p className="empty-text">No members online</p>
        </div>
      )}
    </div>

    <div className="sidebar-footer">
      <div className="room-badge">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2H1C0.447715 2 0 2.44772 0 3V4C0 4.55228 0.447715 5 1 5H2C2.55228 5 3 4.55228 3 4V3C3 2.44772 2.55228 2 2 2Z" fill="white"/>
          <path d="M6 2H5C4.44772 2 4 2.44772 4 3V4C4 4.55228 4.44772 5 5 5H6C6.55228 5 7 4.55228 7 4V3C7 2.44772 6.55228 2 6 2Z" fill="white"/>
          <path d="M10 2H9C8.44772 2 8 2.44772 8 3V4C8 4.55228 8.44772 5 9 5H10C10.5523 5 11 4.55228 11 4V3C11 2.44772 10.5523 2 10 2Z" fill="white"/>
        </svg>
        <span className="room-name">{room}</span>
      </div>
    </div>
  </div>
);

// Helper function to get avatar color based on index
const getAvatarColor = (index) => {
  const colors = ['blue', 'purple', 'green', 'orange', 'cyan', 'rose'];
  return colors[index % colors.length];
};

export default TextContainer;
