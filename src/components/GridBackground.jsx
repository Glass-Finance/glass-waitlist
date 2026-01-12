import React from 'react';

export default function GridBackground({ children, className = "bg-white", variant = "default" }) {
  // Determine grid style based on variant
  const getGridStyle = () => {
    switch (variant) {
      case 'light':
        return {
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        };
      case 'alternate':
        // For gray backgrounds - very subtle grid
        return {
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        };
      case 'primary':
        return {
          backgroundImage: `
            linear-gradient(to right, rgba(23, 161, 229, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(23, 161, 229, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        };
      default:
        // Default for white backgrounds - very subtle
        return {
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        };
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={getGridStyle()}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}