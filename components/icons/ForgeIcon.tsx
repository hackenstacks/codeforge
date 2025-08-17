import React from 'react';

export const ForgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15.2 2.8a2 2 0 0 0-2.2 0L3.4 12.4a2 2 0 0 0 0 2.2l8.6 8.6a2 2 0 0 0 2.2 0l8.6-8.6a2 2 0 0 0 0-2.2Z"/>
    <path d="m9 9 6 6"/>
    <path d="M15 9h.01"/>
    <path d="M9.5 3.5 12 6"/>
    <path d="M6 12 3.5 9.5"/>
    <path d="M18.5 14.5 21 12"/>
    <path d="M12 18l-2.5 2.5"/>
  </svg>
);