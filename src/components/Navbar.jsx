import React, { useState } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import "./Navbar.css";
import Sidebar from "./Sidebar";

const Navbar = ({ dangerColor }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation(); // Get the current route

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if the current route is "/errors" (or whatever your ErrorList route is)
  const isErrorPage = location.pathname === "/errors";

  return (
    <>
      <nav className="navbar">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          ☰
        </button>

        {/* Conditionally render the danger level section */}
        {isErrorPage && (
          <>
            <span className="danger-level">Danger Level</span>
            <div className="danger-circle" style={{ backgroundColor: dangerColor }}></div>
          </>
        )}
      </nav>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
    </>
  );
};

export default Navbar;

