import React, { useState, useEffect } from "react";
import queryString from "query-string";
import io from "socket.io-client";

import InfoBar from "../InfoBar/InfoBar";
import Input from "../Input/Input";
import Messages from "../Messages/Messages";
import TextContainer from "../TextContainer/TextContainer";

import "./Chat.css";

let socket;

const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const ENDPOINT = "localhost:5000";

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    socket = io(ENDPOINT);

    setRoom(room);
    setName(name);

    socket.emit("join", { name, room }, (error) => {
      if (error) {
        alert(error);
        window.location.href = "/";
      }
    });
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on("message", (message) => {
      setMessages((messages) => [...messages, message]);
    });

    socket.on("messageHistory", ({ messages }) => {
      setMessages(messages);
    });

    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });

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

    return () => {
      socket.off("message");
      socket.off("messageHistory");
      socket.off("roomData");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, []);

  const sendMessage = (event) => {
    event.preventDefault();

    if (message) {
      socket.emit("sendMessage", message, (error) => {
        if (error) {
          alert(error);
        }
      });
      setMessage("");
      socket.emit("stopTyping");
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const handleTyping = () => {
    socket.emit("typing");

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      socket.emit("stopTyping");
    }, 1000);

    setTypingTimeout(timeout);
  };

  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} />
        <Input
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          handleTyping={handleTyping}
        />
      </div>
      <TextContainer users={users} typingUsers={typingUsers} />
    </div>
  );
};

export default Chat;
