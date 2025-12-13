import React, { useState } from "react";
import ReactEmoji from "react-emoji";
import "./Message.css";
import { MessageState } from "../../../hooks/useOptimisticMessages";

const Message = ({ 
  message: { text, user, state, error, timestamp, replyTo, reactions, attachment, type }, 
  name, 
  onRetry, 
  tempId,
  onReply,
  onReact,
  userOnlineStatus = false,
  previousMessage,
  isConsecutive
}) => {
  const [showActions, setShowActions] = useState(false);
  const [expandedImage, setExpandedImage] = useState(false);

  let isSentByCurrentUser = false;
  const trimmedName = name.trim().toLowerCase();
  const isAdminMessage = user === "admin";
  const isSystemMessage = type === "system";

  if (user === trimmedName) {
    isSentByCurrentUser = true;
  }

  // Format timestamp
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
          <span className="message-state sent" title="Sent">
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
          <button 
            key={emoji} 
            className="reaction-badge"
            onClick={() => onReact && onReact(tempId, emoji)}
            aria-label={`React with ${emoji}`}
          >
            <span className="reaction-emoji">{emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        ))}
        <button 
          className="reaction-badge add-reaction"
          onClick={() => onReact && onReact(tempId)}
          aria-label="Add reaction"
        >
          <span className="reaction-emoji">+</span>
        </button>
      </div>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    if (!showActions || isAdminMessage || isSystemMessage) return null;

    return (
      <div className="message-actions">
        <button 
          className="message-action-btn"
          onClick={() => onReply && onReply({ text, user, tempId })}
          title="Reply"
          aria-label="Reply to message"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v5h5l-6 7V9H2l6-7z"/>
          </svg>
        </button>
        <button 
          className="message-action-btn"
          title="More"
          aria-label="More actions"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5"/>
            <circle cx="8" cy="8" r="1.5"/>
            <circle cx="13" cy="8" r="1.5"/>
          </svg>
        </button>
      </div>
    );
  };

  // Render attachment (image/video)
  const renderAttachment = () => {
    if (!attachment) return null;

    const { type: attachmentType, url, filename, size, thumbnail } = attachment;

    if (attachmentType === 'image' || attachmentType === 'video') {
      return (
        <div className="message-attachment">
          <div 
            className={`attachment-preview ${expandedImage ? 'expanded' : ''}`}
            onClick={() => setExpandedImage(!expandedImage)}
            role="button"
            tabIndex={0}
            aria-label={expandedImage ? "Collapse image" : "Expand image"}
            onKeyPress={(e) => e.key === 'Enter' && setExpandedImage(!expandedImage)}
          >
            {attachmentType === 'image' ? (
              <img src={thumbnail || url} alt={filename || "Attachment"} />
            ) : (
              <video src={url} controls>
                Your browser does not support the video tag.
              </video>
            )}
            <div className="attachment-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            </div>
          </div>
          <div className="attachment-info">
            <span className="attachment-name">{filename || 'Attachment'}</span>
            {size && <span className="attachment-size">{formatFileSize(size)}</span>}
          </div>
        </div>
      );
    }

    return null;
  };

  // Render reply preview
  const renderReplyPreview = () => {
    if (!replyTo) return null;

    return (
      <div className="reply-preview">
        <div className="reply-preview-header">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v5h5l-6 7V9H2l6-7z"/>
          </svg>
          <span>Replying to <strong>{replyTo.user}</strong></span>
        </div>
        <div className="reply-preview-content">
          {replyTo.text && replyTo.text.length > 100 
            ? replyTo.text.substring(0, 100) + '...' 
            : replyTo.text}
        </div>
      </div>
    );
  };

  // Get system emoji for event types
  const getSystemEmoji = (eventText) => {
    if (eventText.includes('joined')) return '👋';
    if (eventText.includes('left')) return '👋';
    if (eventText.includes('created')) return '✨';
    return 'ℹ️';
  };

  // System messages with divider lines
  if (isAdminMessage || isSystemMessage) {
    return (
      <div className="message-container-system">
        <div className="system-divider"></div>
        <div className="message-system">
          <span className="system-emoji" role="img" aria-label="system icon">
            {getSystemEmoji(text)}
          </span>
          <p className="message-system-text">{ReactEmoji.emojify(text)}</p>
        </div>
        <div className="system-divider"></div>
      </div>
    );
  }

  // Consecutive messages (collapsed)
  if (isConsecutive && !isSentByCurrentUser) {
    return (
      <div 
        className="message-container message-received message-consecutive"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="message-avatar message-avatar-placeholder"></div>
        <div className="message-content">
          {renderReplyPreview()}
          <div className="message-bubble message-bubble-received">
            <p className="message-text">{ReactEmoji.emojify(text)}</p>
          </div>
          {renderAttachment()}
          {renderReactions()}
          <div className="message-meta">
            <span className="message-time">{formatTime(timestamp)}</span>
          </div>
        </div>
        {renderActionButtons()}
      </div>
    );
  }

  // User messages
  return isSentByCurrentUser ? (
    <div 
      className={`message-container message-sent ${state === MessageState.FAILED ? 'message-failed' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {renderActionButtons()}
      <div className="message-content">
        {renderReplyPreview()}
        <div className="message-bubble message-bubble-sent">
          <p className="message-text">{ReactEmoji.emojify(text)}</p>
        </div>
        {renderAttachment()}
        {renderReactions()}
        <div className="message-meta">
          <span className="message-time">{formatTime(timestamp)}</span>
          {renderStateIndicator()}
          {state === MessageState.FAILED && onRetry && (
            <button 
              className="message-retry-btn" 
              onClick={() => onRetry(tempId)}
              title="Retry sending message"
              aria-label="Retry sending message"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div 
      className="message-container message-received"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message-avatar">
        <div className="avatar-circle gradient-purple" role="img" aria-label={`${user}'s avatar`}>
          {user.charAt(0).toUpperCase()}
          {userOnlineStatus && <span className="status-indicator status-online" aria-label="Online"></span>}
        </div>
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">{user}</span>
          <span className="message-time">{formatTime(timestamp)}</span>
        </div>
        {renderReplyPreview()}
        <div className="message-bubble message-bubble-received">
          <p className="message-text">{ReactEmoji.emojify(text)}</p>
        </div>
        {renderAttachment()}
        {renderReactions()}
      </div>
      {renderActionButtons()}
    </div>
  );
};

export default Message;
