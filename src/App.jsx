import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ErrorsList from "./pages/ErrorsList";
import ConsequencesList from "./pages/ConsequencesList";
import Scenarios from "./pages/Scenarios";
import First from "./pages/FirstPage";

const App = () => {
  const [selectedColor, setSelectedColor] = useState("green"); // Default color

  return (
    
    <Router>
       <Navbar dangerColor={selectedColor} />
      <Routes>
        <Route path="/" element={<First />} />
        <Route path="/errors" element={<ErrorsList onSelectError={setSelectedColor} />} />
        <Route path="/consequences" element={<ConsequencesList />} />
        <Route path="/scenarios" element={<Scenarios />} />
      </Routes>
    </Router>
  );
};

export default App;


