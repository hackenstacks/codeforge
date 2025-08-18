import React, { useState, useEffect } from 'react';
import type { Persona } from '../types';
import { defaultPersonas } from '../personas';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  personas: Persona[];
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  activePersona: Persona;
  setActivePersona: (persona: Persona) => void;
}

const emptyPersona: Omit<Persona, 'id'> = {
    name: '',
    description: '',
    systemInstruction: '',
    avatar: '🤖',
};

export const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, personas, setPersonas, activePersona, setActivePersona }) => {
  const [editingPersona, setEditingPersona] = useState<Partial<Persona> | null>(null);

  useEffect(() => {
    if (!isOpen) {
        setEditingPersona(null);
    }
  }, [isOpen]);

  const handleSelectAndClose = (persona: Persona) => {
    setActivePersona(persona);
    onClose();
  };

  const handleSave = () => {
    if (!editingPersona || !editingPersona.name || !editingPersona.systemInstruction) return;
    
    let savedPersona: Persona;

    if (editingPersona.id) { // Update existing
        savedPersona = editingPersona as Persona;
        setPersonas(personas.map(p => p.id === savedPersona.id ? savedPersona : p));
    } else { // Create new
        savedPersona = {
            ...editingPersona,
            id: `custom-${Date.now()}`
        } as Persona;
        setPersonas(prev => [...prev, savedPersona]);
    }
    setEditingPersona(savedPersona); // Keep the saved persona in view
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this persona?")) {
        if (activePersona.id === id) {
            setActivePersona(defaultPersonas[0]);
        }
        setPersonas(personas.filter(p => p.id !== id));

        // If the deleted persona was being edited, clear the editor
        if (editingPersona?.id === id) {
            setEditingPersona(null);
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-light-surface dark:bg-gray-800 border border-light-border dark:border-gray-600 rounded-lg shadow-lg z-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-gray-700">
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-white">AI Personas</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold leading-none">&times;</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Persona List */}
            <div className="w-1/3 border-r border-light-border dark:border-gray-700 overflow-y-auto">
                <div className="p-2">
                    <button onClick={() => setEditingPersona(emptyPersona)} className="w-full flex items-center justify-center gap-2 p-2 mb-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4" /> Create New Persona
                    </button>
                </div>
                <ul>
                    {personas.map(p => (
                        <li key={p.id} onClick={() => setEditingPersona(p)} className={`p-4 cursor-pointer border-l-4 ${editingPersona?.id === p.id ? 'bg-blue-500/10 border-blue-500' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{p.avatar}</span>
                                    <div>
                                        <h3 className="font-semibold text-light-text-primary dark:text-gray-200">{p.name}</h3>
                                        <p className="text-xs text-light-text-secondary dark:text-gray-400">{p.description}</p>
                                    </div>
                                </div>
                                {activePersona.id === p.id && <CheckIcon className="h-5 w-5 text-green-500" />}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right Panel: Editor/Viewer */}
            <div className="w-2/3 p-6 overflow-y-auto">
                {editingPersona ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-white">{editingPersona.id ? "Edit Persona" : "Create New Persona"}</h3>
                         <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">Avatar (Emoji)</label>
                            <input type="text" value={editingPersona.avatar || '🤖'} onChange={e => setEditingPersona({...editingPersona, avatar: e.target.value})} maxLength={2} className="p-2 w-16 text-2xl bg-light-bg dark:bg-gray-700 border border-light-border dark:border-gray-600 rounded-md text-center"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">Name</label>
                            <input type="text" value={editingPersona.name || ''} onChange={e => setEditingPersona({...editingPersona, name: e.target.value})} className="w-full p-2 bg-light-bg dark:bg-gray-700 border border-light-border dark:border-gray-600 rounded-md"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">Description</label>
                            <input type="text" value={editingPersona.description || ''} onChange={e => setEditingPersona({...editingPersona, description: e.target.value})} className="w-full p-2 bg-light-bg dark:bg-gray-700 border border-light-border dark:border-gray-600 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">System Instruction (The AI's core directive)</label>
                            <textarea value={editingPersona.systemInstruction || ''} onChange={e => setEditingPersona({...editingPersona, systemInstruction: e.target.value})} rows={10} className="w-full p-2 bg-light-bg dark:bg-gray-700 border border-light-border dark:border-gray-600 rounded-md font-mono text-sm"/>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                {editingPersona.id && !editingPersona.id.startsWith('default-') && (
                                    <button onClick={() => handleDelete(editingPersona.id!)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingPersona(null)} className="px-4 py-2 text-sm font-medium text-light-text-secondary dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                                <button onClick={handleSave} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-light-text-secondary dark:text-gray-500">
                        <p>Select a persona on the left to view or edit.</p>
                        <p>Or, create a new one!</p>
                    </div>
                )}
            </div>
        </div>
         <div className="p-4 border-t border-light-border dark:border-gray-700 flex justify-end">
            <button 
                onClick={() => {
                    const personaToActivate = editingPersona?.id
                        ? (personas.find(p => p.id === editingPersona.id) || activePersona)
                        : activePersona;
                    handleSelectAndClose(personaToActivate);
                }} 
                className="px-6 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
                Set as Active & Close
            </button>
        </div>
      </div>
    </div>
  );
};