import React, { useState } from "react";
import { Link } from "react-router-dom";

import "./Join.css";

const Join = () => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    if (!name || !room) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <div className="join-page">
      <div className="join-background">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>
      
      <div className="join-container">
        <div className="join-header">
          <div className="brand-logo">
            <div className="logo-icon gradient-blue">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 4H4C2.89543 4 2 4.89543 2 6V10C2 11.1046 2.89543 12 4 12H8C9.10457 12 10 11.1046 10 10V6C10 4.89543 9.10457 4 8 4Z" fill="white"/>
                <path d="M20 4H16C14.8954 4 14 4.89543 14 6V10C14 11.1046 14.8954 12 16 12H20C21.1046 12 22 11.1046 22 10V6C22 4.89543 21.1046 4 20 4Z" fill="white"/>
                <path d="M28 4H24C22.8954 4 22 4.89543 22 6V10C22 11.1046 22.8954 12 24 12H28C29.1046 12 30 11.1046 30 10V6C30 4.89543 29.1046 4 28 4Z" fill="white"/>
                <path d="M8 16H4C2.89543 16 2 16.8954 2 18V22C2 23.1046 2.89543 24 4 24H8C9.10457 24 10 23.1046 10 22V18C10 16.8954 9.10457 16 8 16Z" fill="white"/>
                <path d="M20 16H16C14.8954 16 14 16.8954 14 18V22C14 23.1046 14.8954 24 16 24H20C21.1046 24 22 23.1046 22 22V18C22 16.8954 21.1046 16 20 16Z" fill="white"/>
                <path d="M28 16H24C22.8954 16 22 16.8954 22 18V22C22 23.1046 22.8954 24 24 24H28C29.1046 24 30 23.1046 30 22V18C30 16.8954 29.1046 16 28 16Z" fill="white"/>
              </svg>
            </div>
            <h1 className="brand-name">Spaces</h1>
          </div>
          <p className="brand-tagline">Where conversations come alive</p>
        </div>

        <div className="join-card">
          <div className="card-header">
            <h2>Join a Space</h2>
            <p className="card-subtitle">Enter your details to start chatting</p>
          </div>

          <form className="join-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Display Name</label>
              <input
                id="name"
                placeholder="Enter your name"
                className="form-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="room" className="form-label">Space Name</label>
              <input
                id="room"
                placeholder="Enter space name"
                className="form-input"
                type="text"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <Link
              onClick={handleSubmit}
              to={`/chat?name=${name}&room=${room}`}
              className={`join-button ${(!name || !room) ? 'disabled' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Joining...
                </>
              ) : (
                <>
                  Join Space
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </Link>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="additional-actions">
            <Link to="/rooms" className="action-link action-link-primary">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 7H17M3 12H17M7 2V5M13 2V5M6.8 17H13.2C14.8802 17 15.7202 17 16.362 16.673C16.9265 16.3854 17.3854 15.9265 17.673 15.362C18 14.7202 18 13.8802 18 12.2V7.8C18 6.11984 18 5.27976 17.673 4.63803C17.3854 4.07354 16.9265 3.6146 16.362 3.32698C15.7202 3 14.8802 3 13.2 3H6.8C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8V12.2C2 13.8802 2 14.7202 2.32698 15.362C2.6146 15.9265 3.07354 16.3854 3.63803 16.673C4.27976 17 5.11984 17 6.8 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Browse Spaces
            </Link>
            <Link to="/auth" className="action-link action-link-secondary">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 11C12.2091 11 14 9.20914 14 7C14 4.79086 12.2091 3 10 3C7.79086 3 6 4.79086 6 7C6 9.20914 7.79086 11 10 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18C3 15.2386 5.68629 13 9 13H11C14.3137 13 17 15.2386 17 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Login / Register
            </Link>
          </div>
        </div>

        <footer className="join-footer">
          <p className="footer-text">Join thousands of teams collaborating in real-time</p>
        </footer>
      </div>
    </div>
  );
};

export default Join;
