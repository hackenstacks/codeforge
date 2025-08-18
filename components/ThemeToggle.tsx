import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { Tooltip } from './Tooltip';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip text={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-700 hover:text-light-text-primary dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-gray-800 focus:ring-blue-500"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
        </button>
    </Tooltip>
  );
};
