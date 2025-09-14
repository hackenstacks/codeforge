
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { generateImage } from '../services/llmService';
import { dbService } from '../db';
import type { ImageProject } from '../types';
import { Loader } from './Loader';
import { DownloadIcon } from './icons/DownloadIcon';
import { SaveIcon } from './icons/SaveIcon';
import { WandIcon } from './icons/WandIcon';
import { CheckIcon } from './icons/CheckIcon';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const aspectRatios: { value: AspectRatio, label: string }[] = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '3:4', label: 'Tall (3:4)' },
];


export const ImageGenerationView: React.FC = () => {
    const { settings } = useSettings();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageResult, setImageResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        
        setIsLoading(true);
        setError(null);
        setImageResult(null);
        setIsSaved(false);

        try {
            const result = await generateImage(settings, prompt, aspectRatio);
            setImageResult(result.base64Image);
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
        } catch (err) {
            console.error("Failed to save project:", err);
            setError("Could not save image to vault. Is it unlocked?");
        }
    };

    return (
        <div className="animate-fade-in h-full flex flex-col items-center p-4 md:p-8">
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
                                <img src={`data:image/png;base64,${imageResult}`} alt={prompt} className="object-contain" />
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
            </div>
        </div>
    );
};
