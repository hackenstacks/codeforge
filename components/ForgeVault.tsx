import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../db';
import type { Project } from '../types';
import { ProjectCard } from './ProjectCard';
import { Loader } from './Loader';
import { useAuth } from '../contexts/AuthContext';

interface ForgeVaultProps {
    setView: (view: 'chat') => void;
    onLoadProject: (project: Project) => void;
}

export const ForgeVault: React.FC<ForgeVaultProps> = ({ setView, onLoadProject }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { isLocked } = useAuth();

    const fetchProjects = useCallback(async () => {
        if (isLocked) return;
        setIsLoading(true);
        try {
            const results = await dbService.searchProjects(searchTerm);
            setProjects(results);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, isLocked]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProjects();
        }, 300); // Debounce search input

        return () => clearTimeout(handler);
    }, [searchTerm, fetchProjects]);
    
    const handleDeleteProject = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            try {
                await dbService.deleteProject(id);
                fetchProjects(); // Refresh the list
            } catch (error) {
                console.error("Failed to delete project:", error);
            }
        }
    };


    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-6">My Forge</h2>
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search projects by content, prompt, or tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader />
                 </div>
            ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map(project => (
                        <ProjectCard 
                            key={project.id} 
                            project={project} 
                            onLoad={onLoadProject} 
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    <h3 className="text-xl font-semibold">Your Forge is Empty</h3>
                    <p className="mt-2">Save a chat, persona, or file to get started.</p>
                </div>
            )}
        </div>
    );
};