import React from "react";
import { Link } from "react-router-dom";
import "./ConsequencesList.css";

const ConsequencesList = () => {
  return (
    <div className="consequences-list-page">
      <h1>Consequences List</h1>
      <Link to="/" className="back-button">⬅ Back to Home</Link>
    </div>
  );
};

export default ConsequencesList;
