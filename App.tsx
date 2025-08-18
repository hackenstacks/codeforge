import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { Loader } from './components/Loader';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { WandIcon } from './components/icons/WandIcon';
import { CorrectedCodeView } from './components/CorrectedCodeView';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { reviewCode, generateCode } from './services/llmService';
import { ThinkingBox } from './components/ThinkingBox';
import type { CodeReview } from './types';

type Mode = 'review' | 'generate';

const AppContent: React.FC = () => {
  const [mode, setMode] = useState<Mode>('review');
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
  const [showLiveThinking, setShowLiveThinking] = useState<boolean>(false);
  const [streamingResponse, setStreamingResponse] = useState<string>('');


  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!settings.apiKey && settings.provider === 'gemini') {
        setError('Please set your Google API Key in the settings.');
        setIsSettingsOpen(true);
        return;
    }
    if (!customPrompt.trim()) {
      setError('Please describe the code you want to generate.');
      return;
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    setReview(null);
    setOriginalCode('');
    setCode('');
    setStreamingResponse('');

    try {
      setLoadingStage('Generating your code...');
      
      const streamOptions = showLiveThinking ? {
          signal: abortControllerRef.current.signal,
          onChunk: (chunk: string) => {
              setStreamingResponse(prev => prev + chunk);
          }
      } : undefined;

      const result = await generateCode(settings, customPrompt, streamOptions);
      
      setCode(result.generatedCode);
      setFileName(`generated-code.${Date.now()}.txt`);
      setMode('review');
      setCustomPrompt('');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Code generation aborted by user.");
      } else {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`An error occurred while generating the code. Please check your settings and console for details. Error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  }, [customPrompt, settings, showLiveThinking]);


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
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    setReview(null);
    setOriginalCode(code);
    setStreamingResponse('');

    try {
      setLoadingStage(deepScan ? 'Stage 1/2: Analyzing...' : 'Analyzing your code...');
      
      const streamOptions = showLiveThinking ? {
          signal: abortControllerRef.current.signal,
          onChunk: (chunk: string) => {
              setStreamingResponse(prev => prev + chunk);
          }
      } : undefined;

      const result = await reviewCode(settings, code, customPrompt, deepScan, streamOptions);

      if(deepScan) setLoadingStage('Stage 2/2: Validating...');
      setReview(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Code review aborted by user.");
      } else {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`An error occurred while reviewing the code. Please check your settings and console for details. Error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  }, [code, customPrompt, settings, deepScan, showLiveThinking]);
  
  const handleAbort = () => {
    abortControllerRef.current?.abort();
  }
  
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
        
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 p-1 rounded-lg flex space-x-1 border border-gray-700">
            <button
              onClick={() => setMode('review')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'review' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`}
              aria-pressed={mode === 'review'}
            >
              Review Code
            </button>
            <button
              onClick={() => setMode('generate')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'generate' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`}
              aria-pressed={mode === 'generate'}
            >
              Generate Code
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col">
            {mode === 'review' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Enter Code to Review</h2>
                  {fileName && <p className="text-sm text-gray-400 truncate" title={fileName}>File: {fileName}</p>}
                </div>
                <CodeInput value={code} onChange={setCode} />
              </div>
            )}
            
            <div className="mt-4">
              <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-400 mb-2">
                {mode === 'review' ? 'Optional Instructions for the AI' : 'Describe the code you want to generate'}
              </label>
              <textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={mode === 'review' ? "e.g., 'Focus on performance improvements'" : "e.g., 'Create a Python function that fetches data from an API and saves it to a CSV file'"}
                className="w-full h-24 p-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                spellCheck="false"
                aria-label="Instructions for the AI"
              />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.php,.rb,.html,.css,.json,.md,.*" />
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={mode === 'review' ? handleReview : handleGenerate}
                disabled={isLoading}
                className="flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader />
                    <span className="ml-2">{loadingStage || (mode === 'review' ? 'Reviewing...' : 'Generating...')}</span>
                  </>
                ) : mode === 'review' ? (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Review Code
                  </>
                ) : (
                   <>
                    <WandIcon className="h-5 w-5 mr-2" />
                    Generate Code
                  </>
                )}
              </button>
              {mode === 'review' && (
                <button
                  onClick={handleUploadClick}
                  disabled={isLoading}
                  title="Upload File"
                  aria-label="Upload file for code review"
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  <UploadIcon className="h-5 w-5" />
                </button>
              )}
            </div>
             {mode === 'review' && (
              <div className="flex items-center justify-center mt-4 space-x-6">
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
                        Deep Scan
                      </div>
                  </label>
                  <label htmlFor="live-thinking-toggle" className="flex items-center cursor-pointer">
                      <div className="relative">
                          <input 
                              type="checkbox" 
                              id="live-thinking-toggle" 
                              className="sr-only" 
                              checked={showLiveThinking} 
                              onChange={() => setShowLiveThinking(!showLiveThinking)}
                              disabled={isLoading}
                          />
                          <div className={`block w-14 h-8 rounded-full transition ${showLiveThinking ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showLiveThinking ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-gray-400 text-sm font-medium">
                        Live Thinking
                      </div>
                  </label>
              </div>
            )}
          </div>

          <div className="flex flex-col">
             <h2 className="text-xl font-semibold mb-3 text-gray-300">AI Feedback</h2>
             <div className="bg-gray-800 rounded-lg p-6 min-h-[500px] border border-gray-700">
                {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
                {isLoading && showLiveThinking ? (
                    <ThinkingBox response={streamingResponse} onAbort={handleAbort} />
                ) : isLoading ? (
                   <div className="flex flex-col items-center justify-center h-full">
                       <Loader />
                       <p className="mt-4 text-gray-400">{loadingStage || (mode === 'review' ? 'Analyzing your code...' : 'Generating your code...')}</p>
                   </div>
                ) : review ? (
                    <ReviewOutput review={review} />
                ) : (
                    !error && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>Your AI results will appear here.</p>
                        </div>
                    )
                )}
             </div>
          </div>
        </div>
        
        {review?.correctedCode && originalCode && !isLoading && (
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