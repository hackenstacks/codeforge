
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { PersonaModal } from './components/PersonaModal';
import { ForgeVault } from './components/ForgeVault';
import { ChatView } from './components/ChatView';
import type { Project, Persona } from './types';
import { defaultPersonas } from './personas';
import useLocalStorage from './hooks/useLocalStorage';

type View = 'chat' | 'vault';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPersonaModalOpen, setPersonaModalOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);

  const [personas, setPersonas] = useLocalStorage<Persona[]>('code-forge-personas', defaultPersonas);
  const [activePersona, setActivePersona] = useLocalStorage<Persona>('code-forge-active-persona', defaultPersonas[0]);
  
  const handleNewChat = () => {
    setCurrentChatId(null);
    setView('chat');
  };

  const handleLoadProject = (project: Project) => {
    if (project.type === 'chat' && project.id) {
        setCurrentChatId(project.id);
    } else {
        // Handle legacy project types or create a new chat from them
        console.warn("Legacy project type loaded, starting a new chat instead.");
        setCurrentChatId(null); 
    }
    setView('chat');
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-gray-900 text-light-text-primary dark:text-gray-200 font-sans">
      <Header 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onHelpClick={() => setIsHelpOpen(true)}
        onVaultClick={() => setView('vault')} 
        onNewProjectClick={handleNewChat}
        onPersonaClick={() => setPersonaModalOpen(true)}
        currentView={view}
        activePersona={activePersona}
      />
      <main className="container mx-auto p-4 md:px-8 h-[calc(100vh-69px)]">
        {view === 'chat' ? (
            <ChatView 
                key={currentChatId} // Force re-mount on new chat
                projectId={currentChatId}
                activePersona={activePersona}
            />
        ) : (
            <ForgeVault setView={setView} onLoadProject={handleLoadProject} />
        )}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <PersonaModal 
        isOpen={isPersonaModalOpen} 
        onClose={() => setPersonaModalOpen(false)}
        personas={personas}
        setPersonas={setPersonas}
        activePersona={activePersona}
        setActivePersona={setActivePersona}
      />
    </div>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <ThemeProvider>
        <AppContent />
    </ThemeProvider>
  </SettingsProvider>
);

export default App;