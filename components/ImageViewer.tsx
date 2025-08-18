import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface ImageViewerProps {
    base64Image: string;
    prompt: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ base64Image, prompt }) => {
    const imageUrl = `data:image/png;base64,${base64Image}`;

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = imageUrl;
        const safePrompt = prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `code_forge_${safePrompt}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="relative aspect-square w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                <img src={imageUrl} alt={prompt} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col items-center gap-4">
                 <p className="text-sm text-gray-400 italic text-center">Prompt: "{prompt}"</p>
                 <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                 >
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Download Image
                 </button>
            </div>
        </div>
    );
};