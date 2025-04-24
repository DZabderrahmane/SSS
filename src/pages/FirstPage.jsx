import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import './FirstPage.css';

const images = [
  { src: "/img1.png", title: "Port d’Arzew" },
  { src: "/img2.png", title: "Présentation du port d’Arzew " },
  { src: "/img3.png", title: "Le port de Bethioua" },
  { src: "/img4.png", title: "Présentation du port de BETHIOUA " },
];

const FirstPage = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false); // Track hover state

  // Start the carousel timer
  useEffect(() => {
    if (isHovered) return; // If hovered, do not start the interval
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isHovered]);

  // Handle mouse enter and leave events
  const handleMouseEnter = () => {
    setIsHovered(true); // Stop the slider
  };

  const handleMouseLeave = () => {
    setIsHovered(false); // Resume the slider
  };

  return (
    <div className='first-page-container'>
    <div className="carousel-container">
      <div className="carousel" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <img
          src={images[current].src}
          alt={images[current].title}
          className="carousel-image"
        />
        <div className="image-title">{images[current].title}</div>

        <div className="carousel-dots">
          {images.map((_, index) => (
            <span
              key={index}
              className={`carousel-dot ${index === current ? 'active' : ''}`}
              onClick={() => setCurrent(index)}
            />
          ))}
        </div>
      </div>
      
    </div>
    <ul>
        <li>
          <Link to="/errors" className="first-p-btn" >
            Errors List
          </Link>
        </li>
        <li>
          <Link to="/scenarios" className="first-p-btn" >
            Create Scenarios
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default FirstPage;
