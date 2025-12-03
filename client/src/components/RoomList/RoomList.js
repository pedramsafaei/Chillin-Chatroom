import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./RoomList.css";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    password: "",
  });
  const [userName, setUserName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomPassword, setRoomPassword] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/rooms");
      const data = await response.json();
      setRooms(data.rooms);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newRoom,
          creator: userName || "anonymous",
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Room created successfully!");
        setShowCreateForm(false);
        setNewRoom({ name: "", description: "", password: "" });
        fetchRooms();
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room!");
    }
  };

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      setSelectedRoom(room);
    } else {
      joinRoom(room.name, "");
    }
  };

  const joinRoom = async (roomName, password) => {
    if (!userName) {
      alert("Please enter your name!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName, password }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        window.location.href = `/chat?name=${userName}&room=${roomName}`;
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room!");
    }
  };

  const handlePrivateRoomSubmit = (e) => {
    e.preventDefault();
    if (selectedRoom) {
      joinRoom(selectedRoom.name, roomPassword);
      setSelectedRoom(null);
      setRoomPassword("");
    }
  };

  return (
    <div className="roomListContainer">
      <div className="roomListHeader">
        <h1>Available Chat Rooms</h1>
        <button
          className="createRoomBtn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "Create New Room"}
        </button>
      </div>

      <div className="userNameInput">
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="nameInput"
        />
      </div>

      {showCreateForm && (
        <form className="createRoomForm" onSubmit={handleCreateRoom}>
          <h2>Create New Room</h2>
          <input
            type="text"
            placeholder="Room Name"
            value={newRoom.name}
            onChange={(e) =>
              setNewRoom({ ...newRoom, name: e.target.value })
            }
            required
          />
          <textarea
            placeholder="Room Description (optional)"
            value={newRoom.description}
            onChange={(e) =>
              setNewRoom({ ...newRoom, description: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password (optional - for private room)"
            value={newRoom.password}
            onChange={(e) =>
              setNewRoom({ ...newRoom, password: e.target.value })
            }
          />
          <button type="submit" className="submitBtn">
            Create Room
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading rooms...</div>
      ) : (
        <div className="roomGrid">
          {rooms.length === 0 ? (
            <div className="noRooms">
              <p>No rooms available. Create one to get started!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.name} className="roomCard">
                <div className="roomCardHeader">
                  <h3>{room.name}</h3>
                  {room.isPrivate && <span className="privateBadge">🔒 Private</span>}
                </div>
                {room.description && <p className="roomDescription">{room.description}</p>}
                <div className="roomMeta">
                  <span>👥 {room.memberCount || 0} members</span>
                  <span>👤 Created by {room.creator}</span>
                </div>
                <button
                  className="joinRoomBtn"
                  onClick={() => handleJoinRoom(room)}
                >
                  Join Room
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {selectedRoom && (
        <div className="modal">
          <div className="modalContent">
            <h2>Enter Password for {selectedRoom.name}</h2>
            <form onSubmit={handlePrivateRoomSubmit}>
              <input
                type="password"
                placeholder="Room Password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                required
              />
              <div className="modalButtons">
                <button type="submit" className="submitBtn">
                  Join
                </button>
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={() => {
                    setSelectedRoom(null);
                    setRoomPassword("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="backLink">
        <Link to="/">← Back to Simple Join</Link>
      </div>
    </div>
  );
};

export default RoomList;
