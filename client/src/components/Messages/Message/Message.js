import React from "react";
import ReactEmoji from "react-emoji";
import "./Message.css";
import { MessageState } from "../../../hooks/useOptimisticMessages";

const Message = ({ message: { text, user, state, error, timestamp, replyTo, reactions }, name, onRetry, tempId }) => {
  let isSentByCurrentUser = false;
  const trimmedName = name.trim().toLowerCase();
  const isAdminMessage = user === "admin";

  if (user === trimmedName) {
    isSentByCurrentUser = true;
  }

  // Format timestamp
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Determine animation class based on message state
  const getAnimationClass = () => {
    if (isSentByCurrentUser) {
      if (state === MessageState.SENDING) return 'message-sending';
      if (state === MessageState.SENT) return 'message-confirmed';
    } else {
      return 'message-incoming';
    }
    return '';
  };

  // Render message state indicator
  const renderStateIndicator = () => {
    if (!isSentByCurrentUser) return null;

    switch (state) {
      case MessageState.SENDING:
        return (
          <span className="message-state sending" title="Sending...">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
            </svg>
          </span>
        );
      case MessageState.SENT:
        return (
          <span className="message-state sent checkmark-icon" title="Sent">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.5 3L6 10.5L2.5 7" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </span>
        );
      case MessageState.FAILED:
        return (
          <span className="message-state failed" title={error || "Failed to send"}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm1 10H7V9h2v2zm0-3H7V5h2v3z"/>
            </svg>
          </span>
        );
      default:
        return null;
    }
  };

  // Render reactions
  const renderReactions = () => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    
    return (
      <div className="message-reactions">
        {Object.entries(reactions).map(([emoji, count]) => (
          <button key={emoji} className="reaction-badge">
            <span className="reaction-emoji">{emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        ))}
      </div>
    );
  };

  // Admin/System messages
  if (isAdminMessage) {
    return (
      <div className="message-container-system">
        <div className="message-system message-incoming">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 10c-1.93 0-3.62-1.17-4.33-2.83.03-.97 2.9-1.5 4.33-1.5s4.3.53 4.33 1.5C11.62 11.83 9.93 13 8 13z" fill="currentColor"/>
          </svg>
          <p className="message-system-text">{ReactEmoji.emojify(text)}</p>
        </div>
      </div>
    );
  }

  const animationClass = getAnimationClass();

  // User messages
  return isSentByCurrentUser ? (
    <div className={`message-container message-sent ${animationClass} ${state === MessageState.FAILED ? 'message-failed' : ''}`}>
      <div className="message-content">
        {replyTo && (
          <div className="reply-indicator">
            ↳ Replying to <span className="reply-user">{replyTo.user}</span>
          </div>
        )}
        <div className="message-bubble message-bubble-sent">
          <p className="message-text">{ReactEmoji.emojify(text)}</p>
        </div>
        {renderReactions()}
        <div className="message-meta">
          <span className="message-time">{formatTime(timestamp)}</span>
          {renderStateIndicator()}
          {state === MessageState.FAILED && onRetry && (
            <button 
              className="message-retry-btn" 
              onClick={() => onRetry(tempId)}
              title="Retry sending message"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className={`message-container message-received ${animationClass}`}>
      <div className="message-avatar">
        <div className="avatar-circle gradient-purple">
          {user.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">{user}</span>
          <span className="message-time">{formatTime(timestamp)}</span>
        </div>
        {replyTo && (
          <div className="reply-indicator">
            ↳ Replying to <span className="reply-user">{replyTo.user}</span>
          </div>
        )}
        <div className="message-bubble message-bubble-received">
          <p className="message-text">{ReactEmoji.emojify(text)}</p>
        </div>
        {renderReactions()}
      </div>
    </div>
  );
};

export default Message;
