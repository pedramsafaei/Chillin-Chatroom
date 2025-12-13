import React, { useState, useEffect, useRef } from "react";
import queryString from "query-string";
import io from "socket.io-client";

import InfoBar from "../InfoBar/InfoBar";
import Input from "../Input/Input";
import Messages from "../Messages/Messages";
import TextContainer from "../TextContainer/TextContainer";

import "./Chat.css";

const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const ENDPOINT = process.env.REACT_APP_ENDPOINT || "localhost:5000";

  // Initialize socket connection
  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    if (!name || !room) {
      window.location.href = "/";
      return;
    }

    setRoom(room);
    setName(name);

    // Create socket connection
    socketRef.current = io(ENDPOINT, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection status handlers
    socket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      
      // Join room after connection
      socket.emit("join", { name, room }, (error) => {
        if (error) {
          alert(error);
          window.location.href = "/";
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError("Connection lost. Trying to reconnect...");
      setIsConnecting(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);
      
      // Rejoin room after reconnection
      socket.emit("join", { name, room }, (error) => {
        if (error) {
          console.error("Error rejoining room:", error);
        }
      });
    });

    // Message handlers
    socket.on("message", (message) => {
      setMessages((messages) => [...messages, message]);
    });

    socket.on("messageHistory", ({ messages }) => {
      setMessages(messages);
    });

    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });

    // Typing indicators
    socket.on("userTyping", ({ user }) => {
      setTypingUsers((prev) => {
        if (!prev.includes(user)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    socket.on("userStoppedTyping", ({ user }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("reconnect");
        socketRef.current.off("message");
        socketRef.current.off("messageHistory");
        socketRef.current.off("roomData");
        socketRef.current.off("userTyping");
        socketRef.current.off("userStoppedTyping");
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [ENDPOINT, location.search]);

  const sendMessage = (event) => {
    event.preventDefault();

    if (!socketRef.current) {
      alert("Not connected to server. Please refresh the page.");
      return;
    }

    if (message.trim()) {
      socketRef.current.emit("sendMessage", message, (error) => {
        if (error) {
          alert(error);
        }
      });
      setMessage("");
      socketRef.current.emit("stopTyping");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("typing");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit("stopTyping");
      }
    }, 1000);
  };

  return (
    <div className="chat-page">
      {connectionError && (
        <div className="connection-banner error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-.5-9h1v5h-1V5zm0 6h1v1h-1v-1z" fill="currentColor"/>
          </svg>
          {connectionError}
        </div>
      )}
      
      {isConnecting && (
        <div className="connection-banner connecting">
          <span className="spinner-small"></span>
          Connecting to server...
        </div>
      )}

      <div className="chat-container">
        <div className="chat-main">
          <InfoBar room={room} isConnected={isConnected} />
          <Messages messages={messages} name={name} />
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
          />
        </div>
        <TextContainer users={users} room={room} />
      </div>
    </div>
  );
};

export default Chat;
