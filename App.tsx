import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { Loader } from './components/Loader';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { CorrectedCodeView } from './components/CorrectedCodeView';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { reviewCode } from './services/llmService';
import type { CodeReview } from './types';

const AppContent: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [originalCode, setOriginalCode] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [review, setReview] = useState<CodeReview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deepScan, setDeepScan] = useState<boolean>(false);

  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReview = useCallback(async () => {
    if (!settings.apiKey && settings.provider === 'gemini') {
        setError('Please set your Google API Key in the settings.');
        setIsSettingsOpen(true);
        return;
    }
    if (!code.trim()) {
      setError('Please enter some code or upload a file to review.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReview(null);
    setOriginalCode(code); 
    try {
      setLoadingStage(deepScan ? 'Stage 1/2: Analyzing...' : 'Analyzing your code...');
      const result = await reviewCode(settings, code, customPrompt, deepScan);
      if(deepScan) setLoadingStage('Stage 2/2: Validating...');
      setReview(result);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`An error occurred while reviewing the code. Please check your settings and console for details. Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  }, [code, customPrompt, settings, deepScan]);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setCode(text);
          setOriginalCode(text);
          setFileName(file.name);
          setReview(null); 
          setError(null);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      }
      reader.readAsText(file);
    }
    if(event.target) {
      event.target.value = '';
    }
  };

  const handleDiscard = () => {
    setCode('');
    setOriginalCode('');
    setCustomPrompt('');
    setReview(null);
    setError(null);
    setFileName(null);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-300">Enter Code to Review</h2>
              {fileName && <p className="text-sm text-gray-400 truncate" title={fileName}>File: {fileName}</p>}
            </div>
            <CodeInput value={code} onChange={setCode} />
            
            <div className="mt-4">
              <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-400 mb-2">
                Optional Instructions for the AI
              </label>
              <textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., 'Focus on performance improvements' or 'Convert this to an async function'"
                className="w-full h-24 p-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                spellCheck="false"
                aria-label="Optional instructions for the AI code reviewer"
              />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.php,.rb,.html,.css,.json,.md,.*" />
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleReview}
                disabled={isLoading}
                className="flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader />
                    <span className="ml-2">{loadingStage || 'Reviewing...'}</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Review Code
                  </>
                )}
              </button>
              <button
                onClick={handleUploadClick}
                disabled={isLoading}
                title="Upload File"
                aria-label="Upload file for code review"
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <UploadIcon className="h-5 w-5" />
              </button>
            </div>
             <div className="flex items-center justify-center mt-4">
                <label htmlFor="deep-scan-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="deep-scan-toggle" 
                            className="sr-only" 
                            checked={deepScan} 
                            onChange={() => setDeepScan(!deepScan)}
                            disabled={isLoading}
                        />
                        <div className={`block w-14 h-8 rounded-full transition ${deepScan ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${deepScan ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-gray-400 text-sm font-medium">
                       Deep Scan <span className="text-gray-500">(Validate & Refine)</span>
                    </div>
                </label>
            </div>
          </div>

          <div className="flex flex-col">
             <h2 className="text-xl font-semibold mb-3 text-gray-300">AI Review Feedback</h2>
             <div className="bg-gray-800 rounded-lg p-6 min-h-[500px] border border-gray-700">
                {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
                {isLoading && (
                   <div className="flex flex-col items-center justify-center h-full">
                       <Loader />
                       <p className="mt-4 text-gray-400">{loadingStage || 'Analyzing your code...'}</p>
                   </div>
                )}
                {review ? (
                    <ReviewOutput review={review} />
                ) : (
                    !isLoading && !error && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>Your code review results will appear here.</p>
                        </div>
                    )
                )}
             </div>
          </div>
        </div>
        
        {review?.correctedCode && originalCode && (
          <div className="mt-12 animate-fade-in">
            <CorrectedCodeView 
              review={review}
              originalCode={originalCode}
              originalFileName={fileName}
              onDiscard={handleDiscard}
            />
          </div>
        )}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <AppContent />
  </SettingsProvider>
);


export default App;