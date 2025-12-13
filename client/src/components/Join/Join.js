import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import "./Join.css";

const EMOJIS = ["😊", "🚀", "🎮", "🎨", "🌙", "🔥", "💜", "🌊", "🌲", "⚡"];

const Join = () => {
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestNickname, setGuestNickname] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [validationError, setValidationError] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const pageRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const validateNickname = (value) => {
    if (value.length < 3) {
      return "Nickname must be at least 3 characters";
    }
    if (value.length > 20) {
      return "Nickname must be less than 20 characters";
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return "Only letters and numbers allowed";
    }
    return "";
  };

  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setGuestNickname(value);
    setValidationError(validateNickname(value));
  };

  const handleGuestEnter = () => {
    const error = validateNickname(guestNickname);
    if (error) {
      setValidationError(error);
      return;
    }
    // Navigate to default room as guest
    window.location.href = `/chat?name=${guestNickname}&room=lobby`;
  };

  const orbTransform = (index) => {
    const factor = (index + 1) * 0.02;
    const offsetX = (mousePosition.x - window.innerWidth / 2) * factor;
    const offsetY = (mousePosition.y - window.innerHeight / 2) * factor;
    return { transform: `translate(${offsetX}px, ${offsetY}px)` };
  };

  return (
    <div className="join-page" ref={pageRef}>
      {/* Animated Background with Grid */}
      <div className="join-background">
        <div className="animated-grid"></div>
        <div className="gradient-orb gradient-orb-1" style={orbTransform(0)}></div>
        <div className="gradient-orb gradient-orb-2" style={orbTransform(1)}></div>
        <div className="gradient-orb gradient-orb-3" style={orbTransform(2)}></div>
      </div>
      
      <div className="join-container">
        {/* Header with Logo */}
        <div className="join-header stagger-item">
          <div className="brand-logo">
            <div className="logo-icon gradient-blue pulse-animation">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 4H4C2.89543 4 2 4.89543 2 6V10C2 11.1046 2.89543 12 4 12H8C9.10457 12 10 11.1046 10 10V6C10 4.89543 9.10457 4 8 4Z" fill="white"/>
                <path d="M20 4H16C14.8954 4 14 4.89543 14 6V10C14 11.1046 14.8954 12 16 12H20C21.1046 12 22 11.1046 22 10V6C22 4.89543 21.1046 4 20 4Z" fill="white"/>
                <path d="M28 4H24C22.8954 4 22 4.89543 22 6V10C22 11.1046 22.8954 12 24 12H28C29.1046 12 30 11.1046 30 10V6C30 4.89543 29.1046 4 28 4Z" fill="white"/>
                <path d="M8 16H4C2.89543 16 2 16.8954 2 18V22C2 23.1046 2.89543 24 4 24H8C9.10457 24 10 23.1046 10 22V18C10 16.8954 9.10457 16 8 16Z" fill="white"/>
                <path d="M20 16H16C14.8954 16 14 16.8954 14 18V22C14 23.1046 14.8954 24 16 24H20C21.1046 24 22 23.1046 22 22V18C22 16.8954 21.1046 16 20 16Z" fill="white"/>
                <path d="M28 16H24C22.8954 16 22 16.8954 22 18V22C22 23.1046 22.8954 24 24 24H28C29.1046 24 30 23.1046 30 22V18C30 16.8954 29.1046 16 28 16Z" fill="white"/>
              </svg>
            </div>
            <h1 className="brand-name">SPACES</h1>
          </div>
          <p className="brand-tagline">Where conversations come alive</p>
        </div>

        {/* Authentication Buttons */}
        <div className="auth-actions stagger-item">
          <Link to="/auth" className="auth-button auth-button-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 7L10 2L17 7M4 8V17H7V13H13V17H16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Continue with Email
          </Link>
          
          <button className="auth-button auth-button-google">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.17 8.36H10V12H14.96C14.37 14.65 12.04 16 10 16C7.24 16 5 13.76 5 11C5 8.24 7.24 6 10 6C11.27 6 12.41 6.47 13.29 7.24L15.84 4.69C14.27 3.22 12.25 2 10 2C5.03 2 1 6.03 1 11C1 15.97 5.03 20 10 20C14.97 20 19 15.97 19 11C19 10.11 18.91 9.24 18.73 8.41L18.17 8.36Z" fill="currentColor"/>
            </svg>
            Continue with Google
          </button>

          <button 
            className="auth-button auth-button-guest"
            onClick={() => setShowGuestModal(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10ZM10 12C7.33 12 2 13.34 2 16V18H18V16C18 13.34 12.67 12 10 12Z" fill="currentColor"/>
            </svg>
            Continue as Guest
          </button>

          <Link to="/rooms" className="auth-button auth-button-browse">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM15 15l3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Browse Public Rooms
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="trust-badges stagger-item">
          <div className="badge">
            <span className="badge-icon">🟢</span>
            <span className="badge-text">Live rooms</span>
          </div>
          <div className="badge">
            <span className="badge-icon">🔒</span>
            <span className="badge-text">E2E Secure</span>
          </div>
          <div className="badge">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">Fast sync</span>
          </div>
          <div className="badge">
            <span className="badge-icon">🌐</span>
            <span className="badge-text">Open Source</span>
          </div>
        </div>
      </div>

      {/* Guest Entry Modal */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div className="modal-content guest-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowGuestModal(false)}
            >
              ×
            </button>
            
            <h2 className="modal-title">👋 Join as Guest</h2>
            
            <div className="modal-body">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Your nickname"
                  className={`form-input ${validationError ? 'error' : ''}`}
                  value={guestNickname}
                  onChange={handleNicknameChange}
                  autoFocus
                />
                {validationError && (
                  <span className="validation-error">{validationError}</span>
                )}
              </div>

              <div className="emoji-picker">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button 
                className="modal-button primary"
                onClick={handleGuestEnter}
                disabled={!!validationError || !guestNickname}
              >
                Enter the Space →
              </button>

              <p className="modal-info">
                Guest sessions last 24h. Sign up to save your conversations and customize your profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Join;
