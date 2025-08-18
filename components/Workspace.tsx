import React, { useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { FileIcon } from './icons/FileIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { UploadIcon } from './icons/UploadIcon';
import { Tooltip } from './Tooltip';

const getFileTypeFromName = (fileName: string): 'code' | 'image' | 'text' => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension)) return 'image';
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'md'].includes(extension)) return 'code';
    return 'text';
}

export const Workspace: React.FC = () => {
    const { assets, activeAsset, addAsset, removeAsset, updateAsset, setActiveAssetId } = useWorkspace();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddTextFile = () => {
        addAsset({ name: 'untitled.txt', type: 'text', content: '' });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            const type = getFileTypeFromName(file.name);
            addAsset({
                name: file.name,
                type: type,
                content: type === 'image' ? result.split(',')[1] : result, // store base64 for image, text for others
                mimeType: type === 'image' ? file.type : undefined,
            });
        };
        reader.onerror = () => console.error("Failed to read the file.");

        if (getFileTypeFromName(file.name) === 'image') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-light-surface dark:bg-gray-800 rounded-lg border border-light-border dark:border-gray-700 shadow-md">
            {/* Header / Tab Bar */}
            <div className="flex items-center border-b border-light-border dark:border-gray-700">
                <div className="flex-grow flex items-center overflow-x-auto">
                    {assets.map(asset => (
                        <button
                            key={asset.id}
                            onClick={() => setActiveAssetId(asset.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-light-border dark:border-gray-700 whitespace-nowrap ${activeAsset?.id === asset.id ? 'bg-light-bg dark:bg-gray-900/50 text-blue-500' : 'text-light-text-secondary dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <FileIcon className="h-4 w-4" />
                            <span>{asset.name}</span>
                            <span onClick={(e) => { e.stopPropagation(); removeAsset(asset.id);}} className="ml-2 text-gray-500 hover:text-red-500 text-lg">&times;</span>
                        </button>
                    ))}
                </div>
                <div className="flex p-1">
                     <Tooltip text="New Document">
                        <button onClick={handleAddTextFile} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-gray-600"><FilePlusIcon className="h-5 w-5"/></button>
                    </Tooltip>
                    <Tooltip text="Upload File">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-gray-600"><UploadIcon className="h-5 w-5"/></button>
                    </Tooltip>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                {activeAsset ? (
                    activeAsset.type === 'image' ? (
                        <div className="p-4 flex items-center justify-center h-full bg-gray-900/20">
                            <img 
                                src={`data:${activeAsset.mimeType};base64,${activeAsset.content}`} 
                                alt={activeAsset.name} 
                                className="max-w-full max-h-full object-contain rounded-md"
                            />
                        </div>
                    ) : (
                        <textarea
                            value={activeAsset.content}
                            onChange={(e) => updateAsset(activeAsset.id, e.target.value)}
                            placeholder={`Content for ${activeAsset.name}...`}
                            className="w-full h-full p-4 bg-transparent text-light-text-primary dark:text-gray-200 resize-none font-mono text-sm leading-relaxed focus:outline-none"
                        />
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-light-text-secondary dark:text-gray-500">
                        <FilePlusIcon className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">Workspace</h3>
                        <p>Create a new document or upload a file to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
