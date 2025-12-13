import React from "react";
import "./Input.css";

const Input = ({ setMessage, sendMessage, message, handleTyping, isConnected }) => {
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

  return (
    <form className="input-container" onSubmit={sendMessage}>
      <button type="button" className="input-action-btn" title="Add attachment">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      
      <div className="input-wrapper">
        <input
          className="message-input"
          type="text"
          placeholder={isConnected ? "Message..." : "Connecting..."}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          autoComplete="off"
          maxLength={500}
        />
        {message.length > 400 && (
          <span className="char-count">{message.length}/500</span>
        )}
      </div>

      <button type="button" className="input-action-btn" title="Attach file">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3L10 13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 16H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <button type="button" className="input-action-btn" title="Add emoji">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="7" cy="8" r="1" fill="currentColor"/>
          <circle cx="13" cy="8" r="1" fill="currentColor"/>
          <path d="M6 12C6 12 7.5 14 10 14C12.5 14 14 12 14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      
      <button 
        className="send-button" 
        type="submit"
        disabled={!isConnected || !message.trim()}
        title="Send message"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor"/>
        </svg>
      </button>
    </form>
  );
};

export default Input;
