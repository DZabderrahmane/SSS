import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <span className="close-btn" onClick={toggleSidebar}>×</span>
      <ul>
        <li>
          <Link to="/errors" className="sidebar-btn" onClick={toggleSidebar}>
            Errors List
          </Link>
        </li>
        <li>
          <Link to="/consequences" className="sidebar-btn" onClick={toggleSidebar}>
            Consequences List
          </Link>
        </li>
        <li>
          <Link to="/scenarios" className="sidebar-btn" onClick={toggleSidebar}>
            Create Scenarios
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;

