import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    setSettings(localSettings);
    onClose();
  };
  
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as Settings['provider'];
    if (newProvider === 'gemini') {
      setLocalSettings(prev => ({ ...prev, provider: newProvider, model: 'gemini-2.5-flash', endpoint: '' }));
    } else {
      setLocalSettings(prev => ({ ...prev, provider: newProvider, model: 'llama3', endpoint: 'http://localhost:11434/v1/chat/completions' }));
    }
  };


  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" 
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="w-full max-w-2xl p-6 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 animate-fade-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold leading-none" aria-label="Close settings">&times;</button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-2">AI Provider</label>
            <select
              id="provider"
              value={localSettings.provider}
              onChange={handleProviderChange}
              className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI-Compatible (Ollama, etc.)</option>
            </select>
          </div>
          
          {localSettings.provider === 'openai' && (
             <div>
                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-300 mb-2">API Endpoint</label>
                <input
                  type="url"
                  id="endpoint"
                  value={localSettings.endpoint}
                  onChange={(e) => setLocalSettings(s => ({ ...s, endpoint: e.target.value }))}
                  placeholder="e.g., http://localhost:11434/v1/chat/completions"
                  className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md font-mono text-sm"
                />
             </div>
          )}

          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
            <input
              type="password"
              id="api-key"
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings(s => ({ ...s, apiKey: e.target.value }))}
              placeholder={localSettings.provider === 'openai' ? "Optional for most local models" : "Enter your Google API Key"}
              className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
            <input
              type="text"
              id="model"
              value={localSettings.model}
              onChange={(e) => setLocalSettings(s => ({ ...s, model: e.target.value }))}
              placeholder="e.g., gemini-2.5-flash or llama3"
              className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md font-mono text-sm"
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};
