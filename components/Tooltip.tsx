import React, { ReactNode } from 'react';

interface TooltipProps {
    children: ReactNode;
    text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
    return (
        <div className="relative group flex items-center">
            {children}
            <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-700 border border-gray-600 rounded-md shadow-lg
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20
                            transform -translate-x-1/2 left-1/2">
                {text}
                <svg className="absolute text-gray-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                    <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                </svg>
            </div>
        </div>
    );
};