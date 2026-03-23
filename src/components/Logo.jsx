import React from 'react';

const Logo = ({ className = "" }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <h1 
      className="text-6xl font-serif italic leading-none"
      style={{ 
        fontFamily: "'Playfair Display', serif",
        color: 'var(--ink)',
        letterSpacing: '-0.02em'
      }}
    >
      Sticker
    </h1>
    <span 
      className="text-xs font-medium mt-1 tracking-[0.3em] uppercase opacity-60"
      style={{ 
        fontFamily: 'var(--font)',
        color: 'var(--ink)'
      }}
    >
      Custom Studio
    </span>
  </div>
);

export default Logo;
