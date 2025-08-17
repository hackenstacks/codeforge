import React from 'react';
import { ForgeIcon } from './icons/ForgeIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <ForgeIcon className="h-8 w-8 text-blue-400" />
        <h1 className="ml-3 text-2xl font-bold text-white">Code Forge</h1>
      </div>
    </header>
  );
};