import React from 'react';
import type { Project } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { WandIcon } from './icons/WandIcon';
import { ImageIcon } from './icons/ImageIcon';

interface ProjectCardProps {
    project: Project;
    onLoad: (project: Project) => void;
    onDelete: (id: number) => void;
}

const ProjectIcon: React.FC<{ type: Project['type'] }> = ({ type }) => {
    switch (type) {
        case 'review': return <SparklesIcon className="h-5 w-5 text-blue-400" />;
        case 'code': return <WandIcon className="h-5 w-5 text-purple-400" />;
        case 'image': return <ImageIcon className="h-5 w-5 text-green-400" />;
        default: return null;
    }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onLoad, onDelete }) => {

    const getTitle = () => {
        if (project.type === 'review') return project.fileName || 'Code Review';
        if (project.type === 'code') return 'Generated Code';
        if (project.type === 'image') return 'Generated Image';
        return 'Project';
    };
    
    const getDescription = () => {
        if (project.prompt) return `Prompt: "${project.prompt.substring(0, 50)}..."`;
        if (project.type === 'review') return project.data.review.summary.substring(0, 50) + '...';
        if (project.type === 'code') return project.data.generatedCode.substring(0, 50) + '...';
        return 'No description available.';
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg flex flex-col transition-shadow hover:shadow-lg hover:border-blue-500/50">
            <div className="p-4 flex-grow">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <ProjectIcon type={project.type} />
                       <h3 className="font-semibold text-white truncate" title={getTitle()}>{getTitle()}</h3>
                    </div>
                    <button 
                        onClick={() => onDelete(project.id!)} 
                        className="text-gray-500 hover:text-red-400 text-xl leading-none"
                        title="Delete project"
                    >
                        &times;
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-3 h-10">{getDescription()}</p>
                {project.type === 'image' && (
                    <div className="mb-3 aspect-video bg-gray-900 rounded overflow-hidden">
                        <img src={`data:image/png;base64,${project.data.base64Image}`} alt="Generated image" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                    {project.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-lg flex justify-between items-center">
                <span className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                <button onClick={() => onLoad(project)} className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Load
                </button>
            </div>
        </div>
    );
};