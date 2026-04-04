import React from 'react';

interface Props {
  className?: string; // e.g. "w-8 h-8 text-primary"
}

export const LineLogo = ({ className = "w-6 h-6 text-primary" }: Props) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Left hook / L-shape with rounded bottom-left */}
      <path 
        d="M 10 10 V 60 Q 10 90 40 90 H 60 V 50 H 40 Q 30 50 30 40 V 10 Z" 
        fill="currentColor"
      />
      {/* Companion right square block */}
      <rect 
        x="65" 
        y="50" 
        width="25" 
        height="40" 
        fill="currentColor" 
      />
    </svg>
  );
};

export default LineLogo;
