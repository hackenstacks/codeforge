import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-blue-400 mb-2 border-b border-gray-600 pb-1">{title}</h3>
        <div className="space-y-2 text-gray-300">{children}</div>
    </div>
);

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" 
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="w-full max-w-4xl h-[90vh] flex flex-col bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 animate-fade-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
            <h2 className="text-2xl font-bold text-white">User Manual</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold leading-none" aria-label="Close help">&times;</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
            <HelpSection title="Welcome to AI Forge">
                <p>AI Forge is your secure, AI-powered assistant for coding and creative tasks. You can chat with different AI personas, generate and review code, create images, and manage all your project files in an encrypted, local vault.</p>
            </HelpSection>

            <HelpSection title="The Encrypted Vault">
                <p>Security is paramount. On first launch, you will be asked to set a Master Password.</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><b>Encryption:</b> All your data—chats, personas, and workspace files—is encrypted on your local machine using this password.</li>
                    <li><b>Unlocking:</b> You must enter your password each time you open the app to decrypt and access your data.</li>
                    <li><b>Locking:</b> You can manually lock the vault at any time by clicking the lock icon in the header.</li>
                    <li><b>IMPORTANT:</b> Your password is never stored. If you forget it, your data cannot be recovered.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Main Interface">
                <p>The interface is a split view with two main panels:</p>
                 <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><b>Chat Panel (Left):</b> This is where you interact with the AI. You can switch AI personas, toggle tools like Web Search, and have conversations.</li>
                    <li><b>Workspace Panel (Right):</b> This is your sandbox for project files. You can create new documents or upload existing code, text, or images. You can then reference these files in your chat to provide context to the AI.</li>
                </ul>
            </HelpSection>

             <HelpSection title="The Forge Vault (Your Database)">
                <p>Click the database icon in the header to access your personal, searchable database of saved projects.</p>
                 <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><b>Saving:</b> Chats are saved automatically. You can add tags and manage them from the vault.</li>
                    <li><b>Searching:</b> Use the search bar to find projects by their content, prompt, filename, or tags.</li>
                     <li><b>Loading:</b> Click the "Load" button on any chat project to resume that conversation.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Configuration (Settings)">
                 <p>Click the gear icon in the header to configure your AI provider.</p>
                 <h4 className="font-bold mt-2">Google Gemini (Default)</h4>
                 <p>Go to Google AI Studio to get an API key. Select "Google Gemini", paste your key, and save.</p>
                 <h4 className="font-bold mt-2">Ollama & Local Models</h4>
                 <p>To use a local model via Ollama:</p>
                 <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Run the Ollama server on your machine.</li>
                    <li>In Settings, select "OpenAI-Compatible".</li>
                    <li>Set the API Endpoint to your Ollama URL (e.g., `http://localhost:11434/v1/chat/completions`).</li>
                    <li>Enter the name of the model you are running (e.g., `llama3`).</li>
                    <li>The API Key can often be left blank or set to `ollama`.</li>
                 </ol>
            </HelpSection>
        </div>
      </div>
    </div>
  );
};