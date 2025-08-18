import React from 'react';
import { ForgeIcon } from './icons/ForgeIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { HelpIcon } from './icons/HelpIcon';
import { Tooltip } from './Tooltip';

interface HeaderProps {
    onSettingsClick: () => void;
    onHelpClick: () => void;
    onVaultClick: () => void;
    onNewProjectClick: () => void;
    currentView: 'main' | 'vault';
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onHelpClick, onVaultClick, onNewProjectClick, currentView }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <ForgeIcon className="h-8 w-8 text-blue-400" />
            <h1 className="ml-3 text-2xl font-bold text-white">
                Code Forge <span className="text-gray-500 text-lg font-normal">{currentView === 'vault' && '/ My Forge'}</span>
            </h1>
            {currentView === 'vault' && (
                 <button onClick={onNewProjectClick} className="ml-6 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    + New Project
                 </button>
            )}
        </div>
        <div className="flex items-center gap-2">
            <Tooltip text="My Forge">
                <button onClick={onVaultClick} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" aria-label="Open My Forge">
                    <DatabaseIcon className="h-6 w-6" />
                </button>
            </Tooltip>
            <Tooltip text="Help">
                 <button onClick={onHelpClick} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" aria-label="Open help manual">
                    <HelpIcon className="h-6 w-6" />
                </button>
            </Tooltip>
            <Tooltip text="Settings">
                <button onClick={onSettingsClick} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" aria-label="Open settings">
                    <SettingsIcon className="h-6 w-6" />
                </button>
            </Tooltip>
        </div>
      </div>
    </header>
  );
};