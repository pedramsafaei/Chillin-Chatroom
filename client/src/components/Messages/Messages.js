import React from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import Message from "./Message/Message";
import "./Messages.css";

const Messages = ({ messages, name, onRetry }) => (
  <ScrollToBottom className="messages">
    {messages.map((message, i) => (
      <div key={message.id || message.tempId || i}>
        <Message 
          message={message} 
          name={name} 
          onRetry={onRetry}
          tempId={message.tempId}
        />
      </div>
    ))}
  </ScrollToBottom>
);

export default Messages;
