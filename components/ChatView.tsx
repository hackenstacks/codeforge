import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { getChatResponse } from '../services/llmService';
import type { ChatMessage, Persona, Project, ChatProject, GroundingChunk } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { Loader } from './Loader';
import { UploadIcon } from './icons/UploadIcon';
import { SearchIcon } from './icons/SearchIcon';
import { PaperPlaneIcon } from './icons/PaperPlaneIcon';
import { Tooltip } from './Tooltip';
import { db } from '../db';
import { GenerateContentResponse } from '@google/genai';

interface ChatViewProps {
    projectId: number | null;
    activePersona: Persona;
}

export const ChatView: React.FC<ChatViewProps> = ({ projectId, activePersona }) => {
    const { settings } = useSettings();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [currentProject, setCurrentProject] = useState<ChatProject | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        const loadProject = async () => {
            if (projectId) {
                const project = await db.getProject(projectId) as ChatProject;
                if (project && project.type === 'chat') {
                    setMessages(project.data.messages);
                    setCurrentProject(project);
                } else {
                    console.log("New chat session started.");
                    setMessages([]);
                    setCurrentProject(null);
                }
            } else {
                setMessages([]);
                setCurrentProject(null);
            }
        };
        loadProject();
    }, [projectId]);

    const handleSendMessage = useCallback(async (content: string) => {
        if (isLoading || !content.trim()) return;

        setError(null);
        setIsLoading(true);
        abortControllerRef.current = new AbortController();

        const userMessage: ChatMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const streamOptions = {
                signal: abortControllerRef.current.signal,
                onChunk: (chunk: GenerateContentResponse | string) => {
                    // Handle different chunk types from different services
                    if (typeof chunk === 'string') { // OpenAI compatible
                         setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: msg.content + chunk } : msg));
                    } else { // Gemini
                        const text = chunk.text;
                        if (text) {
                            setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: msg.content + text } : msg));
                        }
                        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
                        if (groundingMetadata?.groundingChunks) {
                            const appGroundingChunks: GroundingChunk[] = groundingMetadata.groundingChunks
                                .filter(c => c.web?.uri)
                                .map(c => ({
                                    web: {
                                        uri: c.web!.uri!,
                                        title: c.web!.title || 'Untitled Source',
                                    }
                                }));

                            if (appGroundingChunks.length > 0) {
                                setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, groundingChunks: appGroundingChunks } : msg));
                            }
                        }
                    }
                },
            };
            await getChatResponse(settings, newMessages, activePersona, useWebSearch, streamOptions);
            
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Don't show an error if the user aborted the request
            } else {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(errorMessage);
                setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Sorry, an error occurred: ${errorMessage}` }]);
            }
        } finally {
            setIsLoading(false);
            if (useWebSearch) setUseWebSearch(false); // Reset after use
        }
    }, [isLoading, messages, settings, activePersona, useWebSearch]);
    
    useEffect(() => {
        // Save project state whenever messages change after a response is complete
        if (!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length-1].content) {
            const title = messages[0].content.substring(0, 50);
            const projectData: Omit<ChatProject, 'id' | 'createdAt'> = {
                type: 'chat',
                prompt: title,
                tags: currentProject?.tags || [],
                data: {
                    messages: messages,
                    persona: activePersona
                }
            };
            
            if (currentProject && currentProject.id) {
                 db.updateProject({ ...projectData, id: currentProject.id, createdAt: currentProject.createdAt } as Project);
            } else {
                 db.addProject(projectData).then(id => {
                     setCurrentProject({ ...projectData, id, createdAt: new Date() } as ChatProject);
                 });
            }
        }
    }, [messages, isLoading, activePersona, currentProject]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const fileContent = `The user has uploaded a file named "${file.name}". Here is its content:\n\n\`\`\`\n${text}\n\`\`\`\n\nMy request is: ${input}`;
                    setInput(fileContent);
                }
            };
            reader.onerror = () => setError("Failed to read the file.");
            reader.readAsText(file);
        }
        if (event.target) event.target.value = ''; // Reset file input
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
            setInput('');
        }
    };
    
    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-light-surface dark:bg-gray-800 rounded-lg border border-light-border dark:border-gray-700 shadow-md">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-light-text-secondary dark:text-gray-500">
                        <span className="text-5xl mb-4">{activePersona.avatar}</span>
                        <h2 className="text-2xl font-bold text-light-text-primary dark:text-gray-300">Chat with {activePersona.name}</h2>
                        <p className="mt-2 text-center">{activePersona.description}</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <ChatMessageBubble key={index} message={msg} persona={activePersona} />
                ))}
                 {isLoading && messages[messages.length - 1]?.role === 'assistant' && (
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">
                            {activePersona.avatar}
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-light-bg dark:bg-gray-700">
                             <Loader />
                        </div>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>

            {error && <div className="p-4 m-4 border border-red-500/30 bg-red-500/10 text-red-400 rounded-md text-sm">{error}</div>}

            <div className="p-4 border-t border-light-border dark:border-gray-700 bg-light-bg dark:bg-gray-900/50 rounded-b-lg">
                {isLoading && (
                    <div className="flex justify-center mb-2">
                        <button onClick={stopGeneration} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Stop Generating</button>
                    </div>
                )}
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${activePersona.name}... (Shift+Enter for new line)`}
                        className="w-full h-12 p-3 pr-28 bg-light-surface dark:bg-gray-700 text-light-text-primary dark:text-gray-200 border border-light-border dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        rows={1}
                        disabled={isLoading}
                        style={{ height: 'auto', minHeight: '3rem', maxHeight: '12rem' }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                         <Tooltip text="Upload File">
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-600" disabled={isLoading}>
                                <UploadIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                        <Tooltip text={useWebSearch ? "Web Search Enabled" : "Enable Web Search"}>
                            <button onClick={() => setUseWebSearch(!useWebSearch)} className={`p-2 rounded-full transition-colors ${useWebSearch ? 'text-blue-500 bg-blue-500/20' : 'text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-600'}`} disabled={isLoading}>
                                <SearchIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Send Message">
                             <button onClick={() => { handleSendMessage(input); setInput(''); }} disabled={isLoading || !input.trim()} className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-500">
                                <PaperPlaneIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                </div>
            </div>
        </div>
    );
};