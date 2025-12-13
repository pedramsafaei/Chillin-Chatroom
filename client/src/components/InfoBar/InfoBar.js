import React from "react";
import { Link } from "react-router-dom";
import "./InfoBar.css";

const InfoBar = ({ room, isConnected }) => (
  <div className="info-bar">
    <div className="info-bar-left">
      <div className="room-header-info">
        <h3 className="room-title">#{room}</h3>
        <div className="room-meta">
          <span className="meta-item">👥 127 online</span>
          <span className="meta-divider">•</span>
          <span className="meta-item">Created by Admin</span>
        </div>
      </div>
    </div>
    <div className="info-bar-right">
      <button className="header-icon-btn" title="Search">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM15 15l3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className="header-icon-btn" title="Settings">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="10" cy="10" r="3" fill="currentColor"/>
        </svg>
      </button>
      <Link to="/" className="header-icon-btn close-btn" title="Leave space">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  </div>
);

export default InfoBar;
