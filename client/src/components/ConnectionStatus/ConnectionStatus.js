import React from 'react';
import { ConnectionState } from '../../hooks/useSocketConnection';
import './ConnectionStatus.css';

const ConnectionStatus = ({ 
  connectionState, 
  error, 
  retryAttempt, 
  maxRetryAttempts,
  retryDelay,
  onRetry 
}) => {
  if (connectionState === ConnectionState.CONNECTED) {
    return null; // Don't show banner when connected
  }

  const getBannerContent = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
        return {
          type: 'info',
          icon: '⟳',
          message: 'Connecting to server...',
          showRetry: false,
        };

      case ConnectionState.RECONNECTING:
        return {
          type: 'warning',
          icon: '⟳',
          message: `Reconnecting... (attempt ${retryAttempt + 1}/${maxRetryAttempts})`,
          subMessage: `Next retry in ${Math.round(retryDelay / 1000)}s`,
          showRetry: true,
        };

      case ConnectionState.DISCONNECTED:
        return {
          type: 'error',
          icon: '⚠',
          message: 'Disconnected from server',
          subMessage: error || 'Connection lost',
          showRetry: true,
        };

      case ConnectionState.FAILED:
        return {
          type: 'error',
          icon: '✖',
          message: 'Connection failed',
          subMessage: error || 'Unable to connect after multiple attempts',
          showRetry: true,
        };

      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div className={`connection-status-banner ${content.type}`}>
      <div className="connection-status-content">
        <span className={`connection-status-icon ${connectionState === ConnectionState.RECONNECTING ? 'spinning' : ''}`}>
          {content.icon}
        </span>
        <div className="connection-status-text">
          <div className="connection-status-message">{content.message}</div>
          {content.subMessage && (
            <div className="connection-status-submessage">{content.subMessage}</div>
          )}
        </div>
      </div>
      {content.showRetry && onRetry && (
        <button 
          className="connection-status-retry-btn"
          onClick={onRetry}
          disabled={connectionState === ConnectionState.RECONNECTING}
        >
          Retry Now
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
