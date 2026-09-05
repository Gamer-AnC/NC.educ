import React, { useState, useRef } from 'react';

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number; // Max tilt angle in degrees
  glareOpacity?: number; // Specular shine intensity
  id?: string;
}

export function ThreeDCard({ 
  children, 
  className = '', 
  depth = 12, 
  glareOpacity = 0.45,
  id
}: ThreeDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    
    // Get cursor coordinate relative to the card element
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    // Convert coordinate to range [-1, 1] relative to center
    const rx = (yc - y) / yc;
    const ry = (x - xc) / xc;
    
    // Dynamic perspective rotate angles
    setRotateX(rx * depth);
    setRotateY(ry * depth);
    
    // Convert cursor position to percentages for the specular glare gradient
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      id={id}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl transition-transform duration-200 ease-out overflow-hidden select-none ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
        transition: isHovered ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isHovered 
          ? `${-rotateY * 1.5}px ${rotateX * 1.5}px 35px rgba(0, 0, 0, 0.18), 0 10px 20px rgba(0, 0, 0, 0.08)`
          : '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Specular glare shine overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
        style={{
          opacity: isHovered ? glareOpacity : 0,
          background: `radial-gradient(circle 180px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 80%)`,
        }}
      />
      
      {/* Depth container (pushes child layers forward in z-axis if they opt-in) */}
      <div 
        className="w-full h-full"
        style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
}
