import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

// Connection states
export const ConnectionState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  FAILED: 'FAILED',
};

// Exponential backoff configuration
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 10;

export const useSocketConnection = (endpoint, options = {}) => {
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [error, setError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const socketRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY);

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback((attempt) => {
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
    // Add jitter (random 0-1000ms) to prevent thundering herd
    return delay + Math.random() * 1000;
  }, []);

  // Connect to socket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    setConnectionState(ConnectionState.CONNECTING);
    setError(null);

    const socket = io(endpoint, {
      reconnection: false, // We'll handle reconnection manually
      transports: ['websocket', 'polling'],
      ...options,
    });

    // Connection successful
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnectionState(ConnectionState.CONNECTED);
      setError(null);
      setRetryAttempt(0);
      retryDelayRef.current = INITIAL_RETRY_DELAY;
    });

    // Connection error
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(err.message);
      
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        setConnectionState(ConnectionState.RECONNECTING);
        scheduleReconnect();
      } else {
        setConnectionState(ConnectionState.FAILED);
        setError('Failed to connect after maximum retry attempts');
      }
    });

    // Disconnection
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState(ConnectionState.DISCONNECTED);
      
      // Only reconnect if disconnection was not intentional
      if (reason !== 'io client disconnect' && retryAttempt < MAX_RETRY_ATTEMPTS) {
        setConnectionState(ConnectionState.RECONNECTING);
        scheduleReconnect();
      }
    });

    socketRef.current = socket;
    return socket;
  }, [endpoint, options, retryAttempt]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const delay = getRetryDelay(retryAttempt);
    retryDelayRef.current = delay;

    console.log(`Reconnecting in ${Math.round(delay / 1000)}s (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})`);

    retryTimeoutRef.current = setTimeout(() => {
      setRetryAttempt(prev => prev + 1);
      if (socketRef.current) {
        socketRef.current.connect();
      } else {
        connect();
      }
    }, delay);
  }, [retryAttempt, getRetryDelay, connect]);

  // Manual reconnect (reset retry count)
  const reconnect = useCallback(() => {
    setRetryAttempt(0);
    retryDelayRef.current = INITIAL_RETRY_DELAY;
    setError(null);
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    } else {
      connect();
    }
  }, [connect]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setConnectionState(ConnectionState.DISCONNECTED);
    setRetryAttempt(0);
    retryDelayRef.current = INITIAL_RETRY_DELAY;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    connectionState,
    error,
    retryAttempt,
    retryDelay: retryDelayRef.current,
    maxRetryAttempts: MAX_RETRY_ATTEMPTS,
    connect,
    reconnect,
    disconnect,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    isFailed: connectionState === ConnectionState.FAILED,
  };
};
