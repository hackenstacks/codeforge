
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { Loader } from './components/Loader';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { WandIcon } from './components/icons/WandIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { CorrectedCodeView } from './components/CorrectedCodeView';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { reviewCode, generateCode, generateImage } from './services/llmService';
import { ThinkingBox } from './components/ThinkingBox';
import { ForgeVault } from './components/ForgeVault';
import { ImageViewer } from './components/ImageViewer';
import { TagInput } from './components/TagInput';
import { TagIcon } from './components/icons/TagIcon';
import { Tooltip } from './components/Tooltip';
import { HelpModal } from './components/HelpModal';
import { db } from './db';
import type { CodeReview, Project, CodeProject, ImageProject, ReviewProject } from './types';

type Mode = 'review' | 'generate' | 'image';
type View = 'main' | 'vault';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [mode, setMode] = useState<Mode>('review');
  const [code, setCode] = useState<string>('');
  const [originalCode, setOriginalCode] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [review, setReview] = useState<CodeReview | null>(null);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [deepScan, setDeepScan] = useState<boolean>(false);
  const [showLiveThinking, setShowLiveThinking] = useState<boolean>(false);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);

  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isImageGenerationSupported = settings.provider === 'gemini'; // Extend this if openai service supports it

  useEffect(() => {
    if (!isImageGenerationSupported && mode === 'image') {
      setMode('review');
    }
  }, [isImageGenerationSupported, mode]);

  const clearState = () => {
    setCode('');
    setOriginalCode('');
    setCustomPrompt('');
    setReview(null);
    setImageResult(null);
    setError(null);
    setFileName(null);
    setStreamingResponse('');
    setCurrentProject(null);
    setTags([]);
  };
  
  const handleTaskCompletion = (result: Partial<Project>) => {
    setCurrentProject(result);
  };
  
  const handleGenerateImage = useCallback(async () => {
    if (!isImageGenerationSupported) {
        setError('Image generation is currently only supported by the Google Gemini provider.');
        return;
    }
    if (!settings.apiKey) {
        setError('Please set your Google API Key in the settings.');
        setIsSettingsOpen(true);
        return;
    }
    if (!customPrompt.trim()) {
      setError('Please describe the image you want to generate.');
      return;
    }

    clearState();
    setIsLoading(true);

    try {
        setLoadingStage('Generating your image...');
        const result = await generateImage(settings, customPrompt);
        setImageResult(result.base64Image);
        handleTaskCompletion({
            type: 'image',
            prompt: customPrompt,
            data: { base64Image: result.base64Image },
        } as Partial<ImageProject>);
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`An error occurred while generating the image. Error: ${errorMessage}`);
    } finally {
        setIsLoading(false);
        setLoadingStage('');
    }
  }, [customPrompt, settings, isImageGenerationSupported]);

  const handleGenerate = useCallback(async () => {
    if (!customPrompt.trim()) {
      setError('Please describe the code you want to generate.');
      return;
    }
    
    abortControllerRef.current = new AbortController();
    
    clearState();
    setIsLoading(true);

    try {
      setLoadingStage('Generating your code...');
      
      const streamOptions = showLiveThinking ? {
          signal: abortControllerRef.current.signal,
          onChunk: (chunk: string) => setStreamingResponse(prev => prev + chunk),
      } : undefined;

      const result = await generateCode(settings, customPrompt, streamOptions);
      
      setCode(result.generatedCode);
      setFileName(`generated-code.${Date.now()}.txt`);
      handleTaskCompletion({
        type: 'code',
        prompt: customPrompt,
        data: { generatedCode: result.generatedCode },
      } as Partial<CodeProject>);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') setError("Code generation aborted.");
      else {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Code generation failed. Error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  }, [customPrompt, settings, showLiveThinking]);


  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code or upload a file to review.');
      return;
    }
    
    abortControllerRef.current = new AbortController();
    
    clearState();
    setOriginalCode(code);
    setIsLoading(true);

    try {
      setLoadingStage(deepScan ? 'Stage 1/2: Analyzing...' : 'Analyzing your code...');
      
      const streamOptions = showLiveThinking ? {
          signal: abortControllerRef.current.signal,
          onChunk: (chunk: string) => setStreamingResponse(prev => prev + chunk),
      } : undefined;

      const result = await reviewCode(settings, code, customPrompt, deepScan, streamOptions);

      if(deepScan) setLoadingStage('Stage 2/2: Validating...');
      setReview(result);
      handleTaskCompletion({
          type: 'review',
          prompt: customPrompt,
          data: { review: result, originalCode: code },
          fileName: fileName || undefined
      } as Partial<ReviewProject>);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') setError("Code review aborted.");
      else {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Code review failed. Error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  }, [code, customPrompt, settings, deepScan, showLiveThinking, fileName]);
  
  const handleAbort = () => abortControllerRef.current?.abort();
  
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      clearState();
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') setCode(text);
      };
      reader.onerror = () => setError("Failed to read the file.");
      reader.readAsText(file);
      setFileName(file.name);
    }
    if(event.target) event.target.value = '';
  };

  const handleSaveToForge = async () => {
    if (!currentProject || !currentProject.type || !currentProject.data) {
        console.error("Attempted to save an incomplete project.", currentProject);
        setError("Cannot save project: essential data is missing.");
        return;
    }
    try {
        const id = await db.addProject({ ...currentProject, tags } as Omit<Project, 'id' | 'createdAt'>);
        console.log(`Project saved with id: ${id}`);
        // Maybe show a success toast here
        setView('vault');
    } catch(err) {
        console.error("Failed to save project:", err);
        setError("Failed to save project to the local database.");
    }
  };
  
  const handleLoadProject = (project: Project) => {
    clearState();
    setTags(project.tags || []);
    setCurrentProject(project);

    if (project.type === 'review') {
        const { review: loadedReview, originalCode: loadedOriginalCode } = project.data;
        setReview(loadedReview);
        setCode(loadedOriginalCode);
        setOriginalCode(loadedOriginalCode);
        setCustomPrompt(project.prompt || '');
        setFileName(project.fileName || null);
        setMode('review');
    } else if (project.type === 'code') {
        const { generatedCode } = project.data;
        setCode(generatedCode);
        setCustomPrompt(project.prompt || '');
        setFileName(`generated-code.txt`);
        setMode('review'); // Switch to review mode to view/edit the code
    } else if (project.type === 'image') {
        const { base64Image } = project.data;
        setImageResult(base64Image);
        setCustomPrompt(project.prompt || '');
        setMode('image');
    }
    setView('main');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onHelpClick={() => setIsHelpOpen(true)}
        onVaultClick={() => setView('vault')} 
        onNewProjectClick={() => { clearState(); setView('main'); setMode('review'); }}
        currentView={view}
      />
      <main className="container mx-auto p-4 md:p-8">
        {view === 'main' ? (
        <>
            <div className="flex justify-center mb-6">
              <div className="bg-gray-800 p-1 rounded-lg flex space-x-1 border border-gray-700">
                <Tooltip text="Analyze code for bugs and improvements.">
                    <button onClick={() => setMode('review')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'review' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`} aria-pressed={mode === 'review'}>Review Code</button>
                </Tooltip>
                <Tooltip text="Generate new code from a description.">
                    <button onClick={() => setMode('generate')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'generate' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`} aria-pressed={mode === 'generate'}>Generate Code</button>
                </Tooltip>
                 {isImageGenerationSupported && (
                    <Tooltip text="Create an image from a text prompt.">
                        <button onClick={() => setMode('image')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'image' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`} aria-pressed={mode === 'image'}>Generate Image</button>
                    </Tooltip>
                )}
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
                    {mode === 'review' ? 'Optional Instructions for the AI' : mode === 'generate' ? 'Describe the code you want to generate' : 'Describe the image you want to generate'}
                  </label>
                  <textarea
                    id="custom-prompt" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={mode === 'review' ? "e.g., 'Focus on performance improvements'" : mode === 'generate' ? "e.g., 'A Python function to fetch API data and save to CSV'" : "e.g., 'A photorealistic cat astronaut on Mars'"}
                    className="w-full h-24 p-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                    spellCheck="false" aria-label="Instructions for the AI"
                  />
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.php,.rb,.html,.css,.json,.md,.*" />
                <div className="flex items-center gap-4 mt-4">
                    <Tooltip text={mode === 'review' ? 'Submit code for AI analysis' : (mode === 'generate' ? 'Generate new code based on your prompt' : 'Create a new image based on your prompt')}>
                      <button onClick={mode === 'review' ? handleReview : (mode === 'generate' ? handleGenerate : handleGenerateImage)} disabled={isLoading} className="flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                        {isLoading ? <><Loader /><span className="ml-2">{loadingStage || 'Processing...'}</span></> : 
                          mode === 'review' ? <><SparklesIcon className="h-5 w-5 mr-2" />Review Code</> : 
                          mode === 'generate' ? <><WandIcon className="h-5 w-5 mr-2" />Generate Code</> :
                          <><ImageIcon className="h-5 w-5 mr-2" />Generate Image</>}
                      </button>
                    </Tooltip>
                    {mode === 'review' && (
                        <Tooltip text="Upload a code file from your computer.">
                            <button onClick={handleUploadClick} disabled={isLoading} aria-label="Upload file" className="inline-flex items-center justify-center px-4 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                                <UploadIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    )}
                </div>
                 {mode !== 'image' && (
                  <div className="flex items-center justify-center mt-4 space-x-6">
                      <Tooltip text="A more thorough but slower analysis where the AI validates its own corrections.">
                          <label htmlFor="deep-scan-toggle" className="flex items-center cursor-pointer">
                              <div className="relative"><input type="checkbox" id="deep-scan-toggle" className="sr-only" checked={deepScan} onChange={() => setDeepScan(!deepScan)} disabled={isLoading}/>
                                <div className={`block w-14 h-8 rounded-full transition ${deepScan ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${deepScan ? 'transform translate-x-6' : ''}`}></div>
                              </div><div className="ml-3 text-gray-400 text-sm font-medium">Deep Scan</div>
                          </label>
                      </Tooltip>
                      <Tooltip text="Show the AI's raw output stream in real-time. Includes an abort button.">
                          <label htmlFor="live-thinking-toggle" className="flex items-center cursor-pointer">
                              <div className="relative"><input type="checkbox" id="live-thinking-toggle" className="sr-only" checked={showLiveThinking} onChange={() => setShowLiveThinking(!showLiveThinking)} disabled={isLoading}/>
                                  <div className={`block w-14 h-8 rounded-full transition ${showLiveThinking ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showLiveThinking ? 'transform translate-x-6' : ''}`}></div>
                              </div><div className="ml-3 text-gray-400 text-sm font-medium">Live Thinking</div>
                          </label>
                      </Tooltip>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                 <h2 className="text-xl font-semibold mb-3 text-gray-300">AI Feedback</h2>
                 <div className="bg-gray-800 rounded-lg p-6 min-h-[500px] border border-gray-700">
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
                    {isLoading && showLiveThinking ? <ThinkingBox response={streamingResponse} onAbort={handleAbort} /> :
                     isLoading ? <div className="flex flex-col items-center justify-center h-full"><Loader /><p className="mt-4 text-gray-400">{loadingStage || 'Processing...'}</p></div> :
                     review ? <ReviewOutput review={review} /> :
                     imageResult ? <ImageViewer base64Image={imageResult} prompt={customPrompt} /> :
                     (currentProject?.type === 'code' && currentProject.data) ? <CodeInput value={currentProject.data.generatedCode} onChange={setCode} /> :
                     !error && <div className="flex items-center justify-center h-full text-gray-500"><p>Your AI results will appear here.</p></div>
                    }
                 </div>
              </div>
            </div>
            
            {!isLoading && review?.correctedCode && originalCode && (
              <div className="mt-12 animate-fade-in"><CorrectedCodeView review={review} originalCode={originalCode} originalFileName={fileName} /></div>
            )}
            {!isLoading && currentProject && (
                <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700 animate-fade-in">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center"><TagIcon className="h-5 w-5 mr-2" />Add Tags & Save</h3>
                    <TagInput tags={tags} setTags={setTags} />
                    <div className="mt-4 flex justify-end gap-4">
                        <button onClick={clearState} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Discard</button>
                        <button onClick={handleSaveToForge} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save to Forge</button>
                    </div>
                </div>
            )}
        </>
        ) : (
            <ForgeVault setView={setView} onLoadProject={handleLoadProject} />
        )}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <AppContent />
  </SettingsProvider>
);

export default App;
