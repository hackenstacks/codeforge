import React from 'react';
import { ForgeIcon } from './icons/ForgeIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { HelpIcon } from './icons/HelpIcon';
import { LockIcon } from './icons/LockIcon';
import { UnlockIcon } from './icons/UnlockIcon';
import { Tooltip } from './Tooltip';
import { ThemeToggle } from './ThemeToggle';
import type { Persona } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onSettingsClick: () => void;
    onHelpClick: () => void;
    onVaultClick: () => void;
    onNewProjectClick: () => void;
    onPersonaClick: () => void;
    currentView: 'chat' | 'vault';
    activePersona: Persona;
}

export const Header: React.FC<HeaderProps> = ({ 
    onSettingsClick, 
    onHelpClick, 
    onVaultClick, 
    onNewProjectClick, 
    onPersonaClick,
    currentView,
    activePersona
}) => {
  const { isLocked, logout } = useAuth();
  return (
    <header className="bg-light-surface/80 dark:bg-gray-800/50 backdrop-blur-sm border-b border-light-border dark:border-gray-700 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
            <ForgeIcon className="h-8 w-8 text-blue-500" />
            <h1 className="ml-3 text-2xl font-bold text-light-text-primary dark:text-white">
                AI Forge 
                <span className="text-gray-500 text-lg font-normal">
                    {currentView === 'vault' ? '/ My Forge' : ''}
                </span>
            </h1>
            {currentView === 'vault' && (
                 <button onClick={onNewProjectClick} className="ml-6 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    + New Chat
                 </button>
            )}
        </div>
        <div className="flex items-center gap-2">
            <Tooltip text={`Change AI Persona (Current: ${activePersona.name})`}>
                <button onClick={onPersonaClick} className="flex items-center gap-2 p-2 rounded-lg text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-700 hover:text-light-text-primary dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-gray-800 focus:ring-blue-500" aria-label="Change AI Persona">
                    <span className="text-xl">{activePersona.avatar}</span>
                    <span className="text-sm font-medium hidden sm:inline">{activePersona.name}</span>
                </button>
            </Tooltip>
             <Tooltip text="My Forge">
                <button onClick={onVaultClick} className="p-2 rounded-full text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-700 hover:text-light-text-primary dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-gray-800 focus:ring-blue-500" aria-label="Open My Forge">
                    <DatabaseIcon className="h-6 w-6" />
                </button>
            </Tooltip>
            <Tooltip text="Help">
                 <button onClick={onHelpClick} className="p-2 rounded-full text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-700 hover:text-light-text-primary dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-gray-800 focus:ring-blue-500" aria-label="Open help manual">
                    <HelpIcon className="h-6 w-6" />
                </button>
            </Tooltip>
            <Tooltip text="Settings">
                <button onClick={onSettingsClick} className="p-2 rounded-full text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-700 hover:text-light-text-primary dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-gray-800 focus:ring-blue-500" aria-label="Open settings">
                    <SettingsIcon className="h-6 w-6" />
                </button>
            </Tooltip>
             <Tooltip text={isLocked ? "Unlock Vault" : "Lock Vault"}>
                <button onClick={logout} className="p-2 rounded-full text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-700 hover:text-light-text-primary dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-gray-800 focus:ring-blue-500" aria-label="Lock Vault">
                    {isLocked ? <LockIcon className="h-6 w-6"/> : <UnlockIcon className="h-6 w-6" />}
                </button>
            </Tooltip>
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
};