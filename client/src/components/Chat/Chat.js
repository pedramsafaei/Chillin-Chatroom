import React, { useState, useEffect, useRef, useCallback } from "react";
import queryString from "query-string";

import InfoBar from "../InfoBar/InfoBar";
import Input from "../Input/Input";
import Messages from "../Messages/Messages";
import TextContainer from "../TextContainer/TextContainer";
import ConnectionStatus from "../ConnectionStatus/ConnectionStatus";
import Sidebar from "../Sidebar/Sidebar";
import MembersPanel from "../MembersPanel/MembersPanel";

import { useSocketConnection, ConnectionState } from "../../hooks/useSocketConnection";
import { useOptimisticMessages, MessageState } from "../../hooks/useOptimisticMessages";

import "./Chat.css";

const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const typingTimeoutRef = useRef(null);
  const ENDPOINT = process.env.REACT_APP_ENDPOINT || "localhost:5000";

  // Use connection hook
  const {
    socket,
    connectionState,
    error: connectionError,
    retryAttempt,
    maxRetryAttempts,
    retryDelay,
    connect,
    reconnect,
    isConnected,
  } = useSocketConnection(ENDPOINT);

  // Use optimistic messages hook
  const {
    messages,
    addOptimisticMessage,
    confirmMessage,
    markMessageFailed,
    retryMessage,
    addReceivedMessage,
    queueMessage,
    getQueuedMessages,
    clearQueue,
    setAllMessages,
  } = useOptimisticMessages();

  // Initialize socket connection
  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    if (!name || !room) {
      window.location.href = "/";
      return;
    }

    setRoom(room);
    setName(name);

    // Connect socket
    const socketInstance = connect();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [location.search, connect]);

  // Join room when connected
  useEffect(() => {
    if (!socket || !isConnected || !name || !room) return;

    socket.emit("join", { name, room }, (error) => {
      if (error) {
        alert(error);
        window.location.href = "/";
      }
    });

    // Send queued messages after reconnection
    const queuedMessages = getQueuedMessages();
    if (queuedMessages.length > 0) {
      queuedMessages.forEach(queuedMsg => {
        socket.emit("sendMessage", { text: queuedMsg.text, tempId: queuedMsg.tempId }, (error) => {
          if (error) {
            markMessageFailed(queuedMsg.tempId, error);
          }
        });
      });
      clearQueue();
    }
  }, [socket, isConnected, name, room, getQueuedMessages, clearQueue, markMessageFailed]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Message history
    const handleMessageHistory = ({ messages }) => {
      setAllMessages(messages);
    };

    // New message from server
    const handleMessage = (message) => {
      // Check if this is our own message (already shown optimistically)
      if (message.user !== name.trim().toLowerCase()) {
        addReceivedMessage(message);
      }
    };

    // Message confirmation
    const handleMessageConfirmed = ({ tempId, id, timestamp }) => {
      confirmMessage(tempId, { id, timestamp });
    };

    // Room data
    const handleRoomData = ({ users }) => {
      setUsers(users);
    };

    // Typing indicators
    const handleUserTyping = ({ user }) => {
      setTypingUsers((prev) => {
        if (!prev.includes(user)) {
          return [...prev, user];
        }
        return prev;
      });
    };

    const handleUserStoppedTyping = ({ user }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    };

    // Register listeners
    socket.on("messageHistory", handleMessageHistory);
    socket.on("message", handleMessage);
    socket.on("messageConfirmed", handleMessageConfirmed);
    socket.on("roomData", handleRoomData);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    // Cleanup
    return () => {
      socket.off("messageHistory", handleMessageHistory);
      socket.off("message", handleMessage);
      socket.off("messageConfirmed", handleMessageConfirmed);
      socket.off("roomData", handleRoomData);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [socket, name, addReceivedMessage, confirmMessage, setAllMessages]);

  // Send message
  const sendMessage = useCallback((event) => {
    event.preventDefault();

    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage("");

    // Stop typing indicator
    if (socket && isConnected) {
      socket.emit("stopTyping");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }

    if (!socket || !isConnected) {
      // Queue message if not connected
      const tempId = queueMessage(messageText, name);
      addOptimisticMessage(messageText, name.trim().toLowerCase());
      return;
    }

    // Add optimistic message
    const tempId = addOptimisticMessage(messageText, name.trim().toLowerCase());

    // Send to server
    socket.emit("sendMessage", { text: messageText, tempId }, (error) => {
      if (error) {
        markMessageFailed(tempId, error);
      }
    });
  }, [message, socket, isConnected, name, addOptimisticMessage, markMessageFailed, queueMessage]);

  // Retry failed message
  const handleRetry = useCallback((tempId) => {
    const msg = retryMessage(tempId);
    if (msg && socket && isConnected) {
      socket.emit("sendMessage", { text: msg.text, tempId: msg.tempId }, (error) => {
        if (error) {
          markMessageFailed(msg.tempId, error);
        }
      });
    }
  }, [socket, isConnected, retryMessage, markMessageFailed]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit("typing");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isConnected) {
        socket.emit("stopTyping");
      }
    }, 1000);
  }, [socket, isConnected]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle reply
  const handleReply = useCallback((messageData) => {
    setReplyingTo(messageData);
  }, []);

  // Clear reply
  const handleClearReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Handle reaction
  const handleReact = useCallback((messageId, emoji) => {
    if (!socket || !isConnected) return;
    
    // TODO: Implement reaction logic with backend
    socket.emit("addReaction", { messageId, emoji });
  }, [socket, isConnected]);

  // Handle file upload
  const handleFileUpload = useCallback((file) => {
    if (!socket || !isConnected) return;
    
    // TODO: Implement file upload logic with backend
    console.log("File upload:", file);
  }, [socket, isConnected]);

  return (
    <div className="chat-page">
      <ConnectionStatus
        connectionState={connectionState}
        error={connectionError}
        retryAttempt={retryAttempt}
        maxRetryAttempts={maxRetryAttempts}
        retryDelay={retryDelay}
        onRetry={reconnect}
      />

      <div className="chat-layout">
        {/* Left Sidebar */}
        <Sidebar currentRoom={room} currentUser={name} />

        {/* Center Chat Area */}
        <div className="chat-center">
          <div className="chat-main">
            <InfoBar room={room} isConnected={isConnected} />
            <Messages 
              messages={messages} 
              name={name} 
              onRetry={handleRetry}
              onReply={handleReply}
              onReact={handleReact}
            />
            {typingUsers.length > 0 && (
              <div className="typing-indicator-bar">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              </div>
            )}
            <Input
              message={message}
              setMessage={setMessage}
              sendMessage={sendMessage}
              handleTyping={handleTyping}
              isConnected={isConnected}
              room={room}
              replyingTo={replyingTo}
              onClearReply={handleClearReply}
              onFileUpload={handleFileUpload}
            />
            <div className="connection-footer">
              <span className="connection-status">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Members Panel */}
        <MembersPanel users={users} currentUser={name} />
      </div>
    </div>
  );
};

export default Chat;
