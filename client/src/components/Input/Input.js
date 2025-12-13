import React, { useState, useRef, useEffect } from "react";
import "./Input.css";

const Input = ({ 
  setMessage, 
  sendMessage, 
  message, 
  handleTyping, 
  isConnected,
  room,
  replyingTo,
  onClearReply,
  onFileUpload
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setMessage(value);
    if (value.trim()) {
      handleTyping();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleAttachmentClick = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
  };

  const handleFileSelect = (type) => {
    setShowAttachmentMenu(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(file);
    setUploadProgress(0);

    // Simulate file upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setTimeout(() => {
            setUploadingFile(null);
            setUploadProgress(null);
            if (onFileUpload) {
              onFileUpload(file);
            }
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const cancelUpload = () => {
    setUploadingFile(null);
    setUploadProgress(null);
  };

  const attachmentOptions = [
    { 
      icon: '📷', 
      label: 'Photo/Video', 
      type: 'media',
      accept: 'image/*,video/*'
    },
    { 
      icon: '📄', 
      label: 'Document', 
      type: 'document',
      accept: '.pdf,.doc,.docx,.txt'
    },
    { 
      icon: '🎤', 
      label: 'Voice Message', 
      type: 'voice',
      accept: 'audio/*'
    },
    { 
      icon: '📊', 
      label: 'Poll', 
      type: 'poll',
      accept: null
    },
    { 
      icon: '🔗', 
      label: 'Link Preview', 
      type: 'link',
      accept: null
    }
  ];

  return (
    <div className="input-section">
      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="reply-bar">
          <div className="reply-bar-content">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2v5h5l-6 7V9H2l6-7z"/>
            </svg>
            <div className="reply-bar-text">
              <span className="reply-bar-label">Replying to <strong>{replyingTo.user}</strong></span>
              <span className="reply-bar-message">
                {replyingTo.text?.substring(0, 50)}
                {replyingTo.text?.length > 50 ? '...' : ''}
              </span>
            </div>
          </div>
          <button 
            className="reply-bar-close"
            onClick={onClearReply}
            aria-label="Cancel reply"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* File Upload Progress */}
      {uploadingFile && uploadProgress !== null && (
        <div className="upload-progress-bar">
          <div className="upload-info">
            <span className="upload-filename">{uploadingFile.name}</span>
            <span className="upload-percentage">{uploadProgress}%</span>
          </div>
          <div className="upload-progress">
            <div 
              className="upload-progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <button 
            className="upload-cancel"
            onClick={cancelUpload}
            aria-label="Cancel upload"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input Container */}
      <form className="input-container" onSubmit={sendMessage}>
        <div className="input-left-actions">
          <button 
            type="button" 
            className="input-action-btn" 
            title="Add attachment"
            onClick={handleAttachmentClick}
            aria-label="Add attachment"
            aria-expanded={showAttachmentMenu}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Attachment Menu */}
          {showAttachmentMenu && (
            <div 
              className="attachment-menu" 
              ref={attachmentMenuRef}
              role="menu"
            >
              {attachmentOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  className="attachment-option"
                  onClick={() => handleFileSelect(option.type)}
                  role="menuitem"
                  aria-label={option.label}
                >
                  <span className="attachment-icon">{option.icon}</span>
                  <span className="attachment-label">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className={`input-wrapper ${isFocused ? 'input-focused' : ''}`}>
          <input
            ref={inputRef}
            className="message-input"
            type="text"
            placeholder={isConnected ? `Message #${room || ''}...` : "Connecting..."}
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={!isConnected}
            autoComplete="off"
            maxLength={500}
            aria-label="Message input"
          />
          {message.length > 400 && (
            <span className="char-count" aria-live="polite">
              {message.length}/500
            </span>
          )}
        </div>

        <button 
          type="button" 
          className="input-action-btn" 
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3L10 13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <button 
          type="button" 
          className="input-action-btn" 
          title="Add emoji"
          aria-label="Add emoji"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="7" cy="8" r="1" fill="currentColor"/>
            <circle cx="13" cy="8" r="1" fill="currentColor"/>
            <path d="M6 12C6 12 7.5 14 10 14C12.5 14 14 12 14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button 
          className={`send-button ${message.trim() ? 'send-button-active' : ''}`}
          type="submit"
          disabled={!isConnected || !message.trim()}
          title="Send message"
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor"/>
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </form>
    </div>
  );
};

export default Input;
