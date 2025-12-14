import React from "react";
import "./MembersPanel.css";

const MembersPanel = ({ users, currentUser }) => {
  const onlineUsers = users.filter(user => user.status !== 'offline');
  const offlineUsers = users.filter(user => user.status === 'offline');

  const getStatusDot = (status) => {
    if (status === 'active') return '🟢';
    if (status === 'idle') return '🟡';
    return '⚫';
  };

  const getUserRole = (user) => {
    if (user.role === 'owner') return 'Owner';
    if (user.role === 'mod') return 'Mod';
    return null;
  };

  return (
    <div className="members-panel">
      <div className="members-header">
        <h3 className="members-title">MEMBERS</h3>
      </div>

      <div className="members-section">
        <div className="members-section-header">
          <span className="section-title">ONLINE</span>
          <span className="section-count">{onlineUsers.length}</span>
        </div>
        <div className="members-list">
          {onlineUsers.map((user, index) => (
            <div key={index} className="member-card user-online">
              <div className="member-avatar">
                <span className="status-dot status-dot-online">{getStatusDot(user.status || 'active')}</span>
                <span className="avatar-text">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="member-info">
                <span className="member-name">{user.name}</span>
                {getUserRole(user) && (
                  <span className="member-role">{getUserRole(user)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {offlineUsers.length > 0 && (
        <div className="members-section">
          <div className="members-section-header">
            <span className="section-title">OFFLINE</span>
            <span className="section-count">{offlineUsers.length}</span>
          </div>
          <div className="members-list">
            {offlineUsers.map((user, index) => (
              <div key={index} className="member-card offline user-offline">
                <div className="member-avatar">
                  <span className="status-dot status-dot-offline">⚫</span>
                  <span className="avatar-text">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="member-info">
                  <span className="member-name">{user.name}</span>
                  {getUserRole(user) && (
                    <span className="member-role">{getUserRole(user)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPanel;
