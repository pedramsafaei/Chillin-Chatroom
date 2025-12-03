import React from "react";

import Chat from "./components/Chat/Chat";
import Join from "./components/Join/Join";
import Auth from "./components/Auth/Auth";
import RoomList from "./components/RoomList/RoomList";

import { BrowserRouter as Router, Route } from "react-router-dom";

const App = () => (
  <Router>
    <Route path="/" exact component={Join} />
    <Route path="/chat" component={Chat} />
    <Route path="/auth" component={Auth} />
    <Route path="/rooms" component={RoomList} />
  </Router>
);

export default App;
