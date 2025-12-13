import React from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import Message from "./Message/Message";
import "./Messages.css";

const Messages = ({ messages, name, onRetry, onReply, onReact }) => {
  // Check if messages are consecutive (same user within 5 minutes)
  const isConsecutiveMessage = (currentMsg, previousMsg) => {
    if (!previousMsg || !currentMsg) return false;
    if (currentMsg.user !== previousMsg.user) return false;
    if (currentMsg.user === 'admin') return false;
    
    const timeDiff = new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp);
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeDiff < fiveMinutes;
  };

  return (
    <ScrollToBottom className="messages">
      {messages.map((message, i) => {
        const previousMessage = i > 0 ? messages[i - 1] : null;
        const isConsecutive = isConsecutiveMessage(message, previousMessage);
        
        return (
          <div key={message.id || message.tempId || i}>
            <Message 
              message={message} 
              name={name} 
              onRetry={onRetry}
              onReply={onReply}
              onReact={onReact}
              tempId={message.tempId}
              previousMessage={previousMessage}
              isConsecutive={isConsecutive}
            />
          </div>
        );
      })}
    </ScrollToBottom>
  );
};

export default Messages;
