import React from 'react';

export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M15 4V2" />
    <path d="M15 10V8" />
    <path d="M12.5 7.5L11 6" />
    <path d="M19 7.5L20.5 6" />
    <path d="M15 22v-4" />
    <path d="M22 15h-4" />
    <path d="M8 15H4" />
    <path d="M15 15h-4" />
    <path d="M5.5 5.5L4 4" />
    <path d="m20 20-2-2" />
    <path d="M4 20l2-2" />
  </svg>
);
