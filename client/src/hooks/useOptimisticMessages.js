import { useState, useCallback, useRef } from 'react';

// Message states
export const MessageState = {
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
};

let tempIdCounter = 0;

export const useOptimisticMessages = () => {
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState(new Map());
  const messageQueueRef = useRef([]);

  // Generate unique temporary ID
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${tempIdCounter++}`;
  }, []);

  // Add optimistic message
  const addOptimisticMessage = useCallback((text, username) => {
    const tempId = generateTempId();
    const optimisticMessage = {
      id: tempId,
      tempId,
      user: username,
      text,
      timestamp: new Date().toISOString(),
      state: MessageState.SENDING,
      isOptimistic: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setPendingMessages(prev => new Map(prev).set(tempId, optimisticMessage));

    return tempId;
  }, [generateTempId]);

  // Confirm message (replace temp ID with real ID)
  const confirmMessage = useCallback((tempId, serverData) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.tempId === tempId
          ? {
              ...msg,
              id: serverData.id,
              timestamp: serverData.timestamp,
              state: MessageState.SENT,
              isOptimistic: false,
            }
          : msg
      )
    );

    setPendingMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(tempId);
      return newMap;
    });
  }, []);

  // Mark message as failed
  const markMessageFailed = useCallback((tempId, error) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.tempId === tempId
          ? {
              ...msg,
              state: MessageState.FAILED,
              error,
            }
          : msg
      )
    );

    setPendingMessages(prev => {
      const newMap = new Map(prev);
      const message = newMap.get(tempId);
      if (message) {
        newMap.set(tempId, { ...message, state: MessageState.FAILED, error });
      }
      return newMap;
    });
  }, []);

  // Retry failed message
  const retryMessage = useCallback((tempId) => {
    const message = pendingMessages.get(tempId);
    if (message && message.state === MessageState.FAILED) {
      setMessages(prev =>
        prev.map(msg =>
          msg.tempId === tempId
            ? { ...msg, state: MessageState.SENDING, error: undefined }
            : msg
        )
      );
      return message;
    }
    return null;
  }, [pendingMessages]);

  // Add received message (from other users)
  const addReceivedMessage = useCallback((message) => {
    // Check if this message is already in the list (avoid duplicates)
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, { ...message, state: MessageState.SENT }];
    });
  }, []);

  // Add message to queue (for offline sending)
  const queueMessage = useCallback((text, username) => {
    const tempId = generateTempId();
    const queuedMessage = {
      tempId,
      text,
      username,
      timestamp: new Date().toISOString(),
    };
    messageQueueRef.current.push(queuedMessage);
    return tempId;
  }, [generateTempId]);

  // Get queued messages
  const getQueuedMessages = useCallback(() => {
    return [...messageQueueRef.current];
  }, []);

  // Clear message queue
  const clearQueue = useCallback(() => {
    messageQueueRef.current = [];
  }, []);

  // Set all messages (for initial load)
  const setAllMessages = useCallback((newMessages) => {
    setMessages(newMessages.map(msg => ({ ...msg, state: MessageState.SENT })));
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingMessages(new Map());
    messageQueueRef.current = [];
  }, []);

  return {
    messages,
    pendingMessages,
    addOptimisticMessage,
    confirmMessage,
    markMessageFailed,
    retryMessage,
    addReceivedMessage,
    queueMessage,
    getQueuedMessages,
    clearQueue,
    setAllMessages,
    clearMessages,
  };
};
