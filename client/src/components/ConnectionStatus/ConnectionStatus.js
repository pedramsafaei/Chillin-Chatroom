import React, { useState } from 'react';
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
  const [isDismissed, setIsDismissed] = useState(false);

  // Show green dot indicator for connected state
  if (connectionState === ConnectionState.CONNECTED) {
    return (
      <div className="connection-status-indicator">
        <div className="status-dot connected"></div>
      </div>
    );
  }

  // Handle dismissal for reconnecting state
  if (isDismissed && connectionState === ConnectionState.RECONNECTING) {
    return null;
  }

  const getBannerContent = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
        return {
          type: 'info',
          icon: '⟳',
          message: 'Connecting to server...',
          showRetry: false,
          showDismiss: false,
          showProgress: false,
        };

      case ConnectionState.RECONNECTING:
        const progress = Math.min(((retryAttempt + 1) / maxRetryAttempts) * 100, 100);
        return {
          type: 'warning',
          icon: '⚠',
          message: `Connection lost. Reconnecting... (attempt ${retryAttempt + 1}/${maxRetryAttempts})`,
          showRetry: false,
          showDismiss: true,
          showProgress: true,
          progress,
        };

      case ConnectionState.OFFLINE:
        return {
          type: 'offline',
          icon: '⚠',
          message: "You're offline. Messages will be sent when you reconnect",
          showRetry: true,
          showDismiss: false,
          showProgress: false,
          retryLabel: 'Try Again',
        };

      case ConnectionState.SYNCING:
        return {
          type: 'syncing',
          icon: 'spinner',
          message: 'Syncing messages...',
          showRetry: false,
          showDismiss: false,
          showProgress: false,
        };

      case ConnectionState.DISCONNECTED:
        return {
          type: 'error',
          icon: '⚠',
          message: 'Disconnected from server',
          subMessage: error || 'Connection lost',
          showRetry: true,
          showDismiss: false,
          showProgress: false,
        };

      case ConnectionState.FAILED:
        return {
          type: 'error',
          icon: '✖',
          message: 'Connection failed',
          subMessage: error || 'Unable to connect after multiple attempts',
          showRetry: true,
          showDismiss: false,
          showProgress: false,
        };

      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className={`connection-status-banner ${content.type}`}>
      <div className="connection-status-content">
        <span className={`connection-status-icon ${content.icon === 'spinner' ? 'spinning' : ''}`}>
          {content.icon === 'spinner' ? '⟳' : content.icon}
        </span>
        <div className="connection-status-text">
          <div className="connection-status-message">{content.message}</div>
          {content.subMessage && (
            <div className="connection-status-submessage">{content.subMessage}</div>
          )}
          {content.showProgress && (
            <div className="connection-status-progress-container">
              <div 
                className="connection-status-progress-bar"
                style={{ width: `${content.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      <div className="connection-status-actions">
        {content.showRetry && onRetry && (
          <button 
            className="connection-status-retry-btn"
            onClick={onRetry}
            disabled={connectionState === ConnectionState.RECONNECTING}
          >
            {content.retryLabel || 'Retry Now'}
          </button>
        )}
        {content.showDismiss && (
          <button 
            className="connection-status-dismiss-btn"
            onClick={handleDismiss}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
