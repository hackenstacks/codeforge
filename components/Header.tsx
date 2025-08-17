import React from 'react';
import { ForgeIcon } from './icons/ForgeIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
    onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <ForgeIcon className="h-8 w-8 text-blue-400" />
            <h1 className="ml-3 text-2xl font-bold text-white">Code Forge</h1>
        </div>
        <button
            onClick={onSettingsClick}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-label="Open settings"
            title="Settings"
        >
            <SettingsIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};
