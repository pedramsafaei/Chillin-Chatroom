import React from "react";
import "./TextContainer.css";

const TextContainer = ({ users, typingUsers }) => (
  <div className="textContainer">
    {users ? (
      <div>
        <h1>People currently chatting:</h1>
        <div className="activeContainer">
          <h2>
            {users.map(({ name }) => (
              <div key={name} className="activeItem">
                {name}
                <img
                  alt="Online Icon"
                  src="https://img.icons8.com/color/48/000000/filled-circle.png"
                />
              </div>
            ))}
          </h2>
        </div>
        {typingUsers && typingUsers.length > 0 && (
          <div className="typingContainer">
            <p className="typingText">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
              typing...
            </p>
          </div>
        )}
      </div>
    ) : null}
  </div>
);

export default TextContainer;
