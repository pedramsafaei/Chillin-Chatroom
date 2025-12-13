import React from "react";
import { Link } from "react-router-dom";
import "./InfoBar.css";

const InfoBar = ({ room, isConnected }) => (
  <div className="info-bar">
    <div className="info-bar-left">
      <div className="space-icon gradient-blue">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 2H2C1.44772 2 1 2.44772 1 3V4C1 4.55228 1.44772 5 2 5H3C3.55228 5 4 4.55228 4 4V3C4 2.44772 3.55228 2 3 2Z" fill="white"/>
          <path d="M8 2H7C6.44772 2 6 2.44772 6 3V4C6 4.55228 6.44772 5 7 5H8C8.55228 5 9 4.55228 9 4V3C9 2.44772 8.55228 2 8 2Z" fill="white"/>
          <path d="M13 2H12C11.4477 2 11 2.44772 11 3V4C11 4.55228 11.4477 5 12 5H13C13.5523 5 14 4.55228 14 4V3C14 2.44772 13.5523 2 13 2Z" fill="white"/>
          <path d="M3 7H2C1.44772 7 1 7.44772 1 8V9C1 9.55228 1.44772 10 2 10H3C3.55228 10 4 9.55228 4 9V8C4 7.44772 3.55228 7 3 7Z" fill="white"/>
          <path d="M8 7H7C6.44772 7 6 7.44772 6 8V9C6 9.55228 6.44772 10 7 10H8C8.55228 10 9 9.55228 9 9V8C9 7.44772 8.55228 7 8 7Z" fill="white"/>
          <path d="M13 7H12C11.4477 7 11 7.44772 11 8V9C11 9.55228 11.4477 10 12 10H13C13.5523 10 14 9.55228 14 9V8C14 7.44772 13.5523 7 13 7Z" fill="white"/>
        </svg>
      </div>
      <div className="space-info">
        <h3 className="space-name">{room}</h3>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
    <div className="info-bar-right">
      <Link to="/" className="close-button" title="Leave space">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  </div>
);

export default InfoBar;
