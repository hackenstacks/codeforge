
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useImageHistory } from '../contexts/ImageHistoryContext';
import { generateImage } from '../services/llmService';
import { dbService } from '../db';
import type { ImageProject, AspectRatio, HistoryItem } from '../types';
import { Loader } from './Loader';
import { DownloadIcon } from './icons/DownloadIcon';
import { SaveIcon } from './icons/SaveIcon';
import { WandIcon } from './icons/WandIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ClockIcon } from './icons/ClockIcon';

const aspectRatios: { value: AspectRatio, label: string }[] = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '3:4', label: 'Tall (3:4)' },
];


export const ImageGenerationView: React.FC = () => {
    const { settings } = useSettings();
    const { history, addToHistory, markAsSaved } = useImageHistory();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageResult, setImageResult] = useState<string | null>(null);
    const [currentImageId, setCurrentImageId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        
        setIsLoading(true);
        setError(null);
        setImageResult(null);
        setCurrentImageId(null);
        setIsSaved(false);

        try {
            const result = await generateImage(settings, prompt, aspectRatio);
            const newId = Date.now().toString();
            setImageResult(result.base64Image);
            setCurrentImageId(newId);
            
            addToHistory({
                id: newId,
                prompt,
                base64Image: result.base64Image,
                aspectRatio,
                timestamp: Date.now(),
                isSaved: false
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!imageResult) return;
        const a = document.createElement('a');
        a.href = `data:image/png;base64,${imageResult}`;
        const safePrompt = prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `ai_forge_${safePrompt}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSave = async () => {
        if (!imageResult || !prompt) return;
        const projectData: Omit<ImageProject, 'id' | 'createdAt'> = {
            type: 'image',
            prompt: prompt,
            tags: ['generated-image'],
            data: {
                base64Image: imageResult,
            }
        };
        try {
            await dbService.addProject(projectData);
            setIsSaved(true);
            if (currentImageId) {
                markAsSaved(currentImageId);
            }
        } catch (err) {
            console.error("Failed to save project:", err);
            setError("Could not save image to vault. Is it unlocked?");
        }
    };

    const loadHistoryItem = (item: HistoryItem) => {
        setPrompt(item.prompt);
        setAspectRatio(item.aspectRatio);
        setImageResult(item.base64Image);
        setCurrentImageId(item.id);
        setIsSaved(item.isSaved);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="animate-fade-in h-full flex flex-col items-center p-4 md:p-8 overflow-y-auto">
            <div className="w-full max-w-4xl">
                <div className="bg-light-surface dark:bg-gray-800 p-6 rounded-lg border border-light-border dark:border-gray-700 shadow-md">
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-white mb-4">Generate an Image</h2>
                    <div className="space-y-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to create... e.g., 'A vibrant synthwave cityscape with a chrome sports car'"
                            className="w-full h-24 p-3 bg-light-bg dark:bg-gray-700 text-light-text-primary dark:text-gray-200 border border-light-border dark:border-gray-600 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 transition"
                            disabled={isLoading}
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="aspect-ratio" className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">Aspect Ratio</label>
                                <select
                                    id="aspect-ratio"
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                    className="w-full p-2 bg-light-bg dark:bg-gray-700 text-light-text-primary dark:text-gray-200 border border-light-border dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                >
                                    {aspectRatios.map(ratio => (
                                        <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 flex items-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading || !prompt.trim()}
                                    className="w-full inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader /> : <><WandIcon className="h-5 w-5 mr-2" /> Generate</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-8 bg-light-surface dark:bg-gray-800 rounded-lg border border-light-border dark:border-gray-700">
                            <Loader />
                            <p className="mt-4 text-light-text-secondary dark:text-gray-400">Generating your image... this can take a moment.</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md">
                            <h4 className="font-bold">Error</h4>
                            <p>{error}</p>
                        </div>
                    )}
                    {imageResult && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 flex justify-center" style={{ aspectRatio: aspectRatio.replace(':', ' / ') }}>
                                <img src={`data:image/png;base64,${imageResult}`} alt={prompt} className="object-contain max-h-[70vh]" />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                >
                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                    Download
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaved}
                                    className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-500 disabled:bg-green-800 disabled:cursor-not-allowed"
                                >
                                    {isSaved ? <><CheckIcon className="h-5 w-5 mr-2" /> Saved to Vault</> : <><SaveIcon className="h-5 w-5 mr-2" /> Save to Vault</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                     <div className="mt-12 border-t border-light-border dark:border-gray-700 pt-8 w-full">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-white mb-6 flex items-center gap-2">
                            <ClockIcon className="h-6 w-6 text-blue-500" /> Recent Generations
                            <span className="text-sm font-normal text-light-text-secondary dark:text-gray-500">(Session)</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {history.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => loadHistoryItem(item)}
                                    className={`cursor-pointer group relative aspect-square bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden border-2 transition-all ${currentImageId === item.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-light-border dark:border-gray-700 hover:border-gray-500'}`}
                                >
                                    <img src={`data:image/png;base64,${item.base64Image}`} alt={item.prompt} className="w-full h-full object-cover" />
                                    {item.isSaved && (
                                        <div className="absolute top-1 right-1 bg-green-600 text-white p-1 rounded-full shadow-md z-10" title="Saved to Vault">
                                            <CheckIcon className="h-3 w-3" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                        <p className="text-white text-xs text-center line-clamp-3 font-medium">{item.prompt}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
