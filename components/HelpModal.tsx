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
            <HelpSection title="Welcome to Code Forge">
                <p>Code Forge is your AI-powered assistant for coding tasks. You can review existing code, generate new code from a prompt, or even create images. All your work can be saved, tagged, and searched in your private, local "Forge Vault".</p>
            </HelpSection>

            <HelpSection title="Core Features (Modes)">
                <p>Use the toggle at the top to switch between modes:</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><b>Review Code:</b> Paste or upload a code file. The AI will analyze it for bugs, style issues, and potential improvements, providing a diff view of the changes.</li>
                    <li><b>Generate Code:</b> Describe the functionality you need in the prompt box, and the AI will write the code for you.</li>
                    <li><b>Generate Image:</b> Describe a scene or concept, and the AI will generate an image. (This feature is provider-dependent, currently enabled for Gemini).</li>
                </ul>
            </HelpSection>

            <HelpSection title="Advanced Analysis">
                <p>When in Review or Generate mode, you can use these toggles:</p>
                 <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><b>Deep Scan:</b> A more thorough but slower analysis. The AI first corrects the code, then performs a "dry run" to validate its own changes for logical errors, refining it further.</li>
                    <li><b>Live Thinking:</b> See the AI's raw JSON response being built in real-time. This mode also provides an "Abort" button to stop the process if needed.</li>
                </ul>
            </HelpSection>

             <HelpSection title="The Forge Vault (Your Local Database)">
                <p>The Forge Vault is your personal, searchable database of saved projects, stored securely in your browser.</p>
                 <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><b>Saving:</b> After any task is completed, a "Save to Forge" panel appears. Add descriptive tags (e.g., "python", "api-client") and click "Save".</li>
                    <li><b>Accessing:</b> Click the database icon in the header to open your Vault.</li>
                    <li><b>Searching:</b> Use the search bar to find projects by their content, prompt, filename, or tags.</li>
                     <li><b>Loading:</b> Click the "Load" button on any project card to bring it back into the main workspace for viewing or further work.</li>
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