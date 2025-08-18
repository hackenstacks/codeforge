import React, { useState, useRef, useCallback, ReactNode } from 'react';

interface ResizablePanelProps {
    children: [ReactNode, ReactNode]; // Expects exactly two children
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({ children }) => {
    const [panelWidth, setPanelWidth] = useState(50); // Initial width in percentage
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        // Clamp the width between 20% and 80%
        setPanelWidth(Math.max(20, Math.min(80, newWidth)));
    }, []);
    
    React.useEffect(() => {
        const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
        const mouseUpHandler = () => handleMouseUp();

        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('mousemove', mouseMoveHandler);
                window.removeEventListener('mouseup', mouseUpHandler);
            }
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div ref={containerRef} className="flex h-full w-full gap-4">
            <div style={{ width: `${panelWidth}%` }}>
                {children[0]}
            </div>
            <div
                className="w-2 cursor-col-resize flex items-center justify-center group"
                onMouseDown={handleMouseDown}
            >
               <div className="w-0.5 h-1/4 bg-light-border dark:bg-gray-700 rounded-full group-hover:bg-blue-500 transition-colors"></div>
            </div>
            <div style={{ width: `${100 - panelWidth}%` }}>
                {children[1]}
            </div>
        </div>
    );
};