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
      <div className="input-wrapper">
        <input
          className="message-input"
          type="text"
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
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
      <button 
        className="send-button" 
        type="submit"
        disabled={!isConnected || !message.trim()}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 10L18 2L10 18L8 11L2 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="button-text">Send</span>
      </button>
    </form>
  );
};

export default Input;
