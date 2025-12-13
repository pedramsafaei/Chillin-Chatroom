import React from "react";
import ReactEmoji from "react-emoji";
import "./Message.css";

const Message = ({ message: { text, user }, name }) => {
  let isSentByCurrentUser = false;
  const trimmedName = name.trim().toLowerCase();
  const isAdminMessage = user === "admin";

  if (user === trimmedName) {
    isSentByCurrentUser = true;
  }

  // Admin/System messages
  if (isAdminMessage) {
    return (
      <div className="message-container-system">
        <div className="message-system">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 10c-1.93 0-3.62-1.17-4.33-2.83.03-.97 2.9-1.5 4.33-1.5s4.3.53 4.33 1.5C11.62 11.83 9.93 13 8 13z" fill="currentColor"/>
          </svg>
          <p className="message-system-text">{ReactEmoji.emojify(text)}</p>
        </div>
      </div>
    );
  }

  // User messages
  return isSentByCurrentUser ? (
    <div className="message-container message-sent">
      <div className="message-content">
        <div className="message-bubble message-bubble-sent">
          <p className="message-text">{ReactEmoji.emojify(text)}</p>
        </div>
        <div className="message-meta">
          <span className="message-sender">You</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="message-container message-received">
      <div className="message-avatar">
        <div className="avatar-circle gradient-purple">
          {user.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="message-content">
        <div className="message-meta">
          <span className="message-sender">{user}</span>
        </div>
        <div className="message-bubble message-bubble-received">
          <p className="message-text">{ReactEmoji.emojify(text)}</p>
        </div>
      </div>
    </div>
  );
};

export default Message;
