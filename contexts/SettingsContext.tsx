import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Settings } from '../types';

const defaultSettings: Settings = {
    provider: 'gemini',
    apiKey: process.env.API_KEY || '',
    model: 'gemini-2.5-flash',
    endpoint: '',
};

interface SettingsContextType {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useLocalStorage<Settings>('ai-forge-settings', defaultSettings);

    return (
        <SettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};