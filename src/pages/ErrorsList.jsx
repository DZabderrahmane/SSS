import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ErrorsList.css";

// Add consequences for each error
const errorsData = {
  red: { 
    title: "High Danger", 
    errors: [
      { name: "Human error", consequences: "Pollution, Fire, Explosion, Human Casualties" },
      { name: "Sabotage", consequences: "Pollution, Fire, Explosion" }
    ] 
  },
  orange: { 
    title: "Medium-High Danger", 
    errors: [
      { name: "Shock", consequences: "Pollution, Fire, Explosion" },
      { name: "Corrosion", consequences: "Pollution, Fire, Explosion" },
      { name: "Connection error", consequences: "Pollution, Fire, Explosion" },
      { name: "Faulty electric grounding", consequences: "Fire, Explosion, Human Casualties" },
      { name: "Leakage", consequences: "Pollution, Fire, Explosion" },
      { name: "MR diminution", consequences: "Pollution, Fire, Explosion" }
    ]
  },
  yellow: { 
    title: "Medium Danger", 
    errors: [
      { name: "Break of the loading arms", consequences: "Pollution, Fire" },
      { name: "Product leak", consequences: "Pollution, Fire" },
      { name: "Faulty degassing", consequences: "Pollution, Explosion " },
      { name: "Earthquake, storm, thunderstorm", consequences: "Pollution, Fire, Explosion " },
      { name: "Thermal flow", consequences: "Fire, Explosion" }
    ]
  },
  green: { 
    title: "Low Danger", 
    errors: [
      { name: "Wear", consequences: "Pollution" },
      { name: "Level detectors failure", consequences: "Fire, Explosion, Human Casualties" },
      { name: "Fire nearby", consequences: "Explosion" },
      { name: "Valves failure", consequences: "Explosion" },
      { name: "Suppression", consequences: "Explosion" },
      { name: "Worn or rigid mooring line", consequences: "Human Casualties" },
      { name: "Wear of scales", consequences: "Human Casualties" },
      { name: "Tiredness", consequences: "Human Casualties" },
      { name: "Lack of training", consequences: "Human Casualties" },
      { name: "Dangerous context", consequences: "Human Casualties" },
      { name: "Vessel movement", consequences: "Pollution" },
      { name: "Filling error", consequences: "Pollution" }
    ]
  },
};

const priorityColors = ["red", "orange", "yellow", "green"];

const ErrorsList = ({ onSelectError }) => {
  const [selectedErrors, setSelectedErrors] = useState([]);

  const handleSelect = (error, color) => {
    let updatedSelection;
    if (selectedErrors.some((e) => e.name === error.name)) {
      updatedSelection = selectedErrors.filter((e) => e.name !== error.name);
    } else {
      updatedSelection = [...selectedErrors, { ...error, color }];
    }
    setSelectedErrors(updatedSelection);
    
    // Determine highest priority color
    const selectedColors = updatedSelection.map((e) => e.color);
    const highestDanger = priorityColors.find((color) =>
      selectedColors.includes(color)
    );
    
    onSelectError(highestDanger || "green"); // Update navbar color
  };

  const handleClearSelections = () => {
    setSelectedErrors([]); // Reset selected errors
    onSelectError("green"); // Reset danger level to green
  };

  return (
    <div className="error-list-container">
      {/* LEFT SIDE: Error List */}
      <div className="error-list">
        {priorityColors.map((color) => (
          <div key={color} className="error-group">
            <h3 className={`error-title ${color}`}>{errorsData[color].title}</h3>
            <div className={`divider ${color}`}></div>
            <ul>
              {errorsData[color].errors.map((error) => {
                const isSelected = selectedErrors.some((e) => e.name === error.name);
                return (
                  <li
                    key={error.name}
                    className={`error-item ${color} ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(error, color)}
                  >
                    {error.name}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE: Selected Errors Table & Back Button */}
      <div className="selected-errors-section">
        {/* Selected Errors Table */}
        {selectedErrors.length > 0 && (
          <div className="selected-errors-table">
            <h3>Selected Errors</h3>
            <table>
              <thead>
                <tr>
                  <th>Error Name</th>
                  <th>Danger Level</th>
                  <th>Consequences</th> {/* New Column */}
                </tr>
              </thead>
              <tbody>
                {selectedErrors.map((error, index) => (
                  <tr key={index}>
                    <td>{error.name}</td>
                    <td className={error.color}>{error.color.toUpperCase()}</td>
                    <td>{error.consequences}</td> {/* Display Consequences */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Selections Button */}
      {selectedErrors.length > 0 && (
        <div className="clear-selections">
          <button onClick={handleClearSelections}>Clear Selections</button>
        </div>
      )}

      <Link to="/" className="back-button">⬅ Back to Home</Link>
    </div>
  );
};

export default ErrorsList;
