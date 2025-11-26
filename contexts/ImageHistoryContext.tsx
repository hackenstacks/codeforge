
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { HistoryItem } from '../types';

interface ImageHistoryContextType {
    history: HistoryItem[];
    addToHistory: (item: HistoryItem) => void;
    markAsSaved: (id: string) => void;
    clearHistory: () => void;
}

const ImageHistoryContext = createContext<ImageHistoryContextType | undefined>(undefined);

export const ImageHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const addToHistory = (item: HistoryItem) => {
        setHistory(prev => [item, ...prev]);
    };

    const markAsSaved = (id: string) => {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, isSaved: true } : item));
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return (
        <ImageHistoryContext.Provider value={{ history, addToHistory, markAsSaved, clearHistory }}>
            {children}
        </ImageHistoryContext.Provider>
    );
};

export const useImageHistory = () => {
    const context = useContext(ImageHistoryContext);
    if (!context) throw new Error("useImageHistory must be used within ImageHistoryProvider");
    return context;
};
