import React, { useRef, useEffect } from 'react';
import { StopIcon } from './icons/StopIcon';

interface ThinkingBoxProps {
    response: string;
    onAbort: () => void;
}

export const ThinkingBox: React.FC<ThinkingBoxProps> = ({ response, onAbort }) => {
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        if (preRef.current) {
            preRef.current.scrollTop = preRef.current.scrollHeight;
        }
    }, [response]);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-3">
                 <h3 className="text-lg font-semibold text-blue-400">AI Live Feed</h3>
                 <button
                    onClick={onAbort}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
                >
                    <StopIcon className="h-5 w-5 mr-2" />
                    Abort
                </button>
            </div>
            <div className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-auto border border-gray-700">
                <pre ref={preRef} className="text-sm text-gray-400 whitespace-pre-wrap font-mono">
                    <code>{response}</code>
                </pre>
            </div>
        </div>
    );
};
