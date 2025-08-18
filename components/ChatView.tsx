import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getChatResponse } from '../services/llmService';
import type { ChatMessage, Persona, Project, ChatProject, GroundingChunk } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { Loader } from './Loader';
import { UploadIcon } from './icons/UploadIcon';
import { SearchIcon } from './icons/SearchIcon';
import { PaperPlaneIcon } from './icons/PaperPlaneIcon';
import { FileIcon } from './icons/FileIcon';
import { WandIcon } from './icons/WandIcon';
import { Tooltip } from './Tooltip';
import { dbService } from '../db';
import { GenerateContentResponse } from '@google/genai';

interface ChatViewProps {
    projectId: number | null;
    activePersona: Persona;
}

export const ChatView: React.FC<ChatViewProps> = ({ projectId, activePersona }) => {
    const { settings } = useSettings();
    const { assets, activeAsset, loadAssets } = useWorkspace();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [useThinking, setUseThinking] = useState(true);
    const [currentProject, setCurrentProject] = useState<ChatProject | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentProjectRef = useRef(currentProject);

    const showThinkingToggle = settings.provider === 'gemini' && settings.model.includes('flash');

    useEffect(() => {
        currentProjectRef.current = currentProject;
    }, [currentProject]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        const loadProject = async () => {
            if (projectId) {
                const project = await dbService.getProject(projectId) as ChatProject;
                if (project && project.type === 'chat') {
                    setMessages(project.data.messages);
                    loadAssets(project.data.workspaceAssets || []);
                    setCurrentProject(project);
                } else {
                    console.log("New chat session started.");
                    setMessages([]);
                    loadAssets([]);
                    setCurrentProject(null);
                }
            } else {
                setMessages([]);
                loadAssets([]);
                setCurrentProject(null);
            }
        };
        loadProject();
    }, [projectId, loadAssets]);

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
                    if (typeof chunk === 'string') {
                         setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: msg.content + chunk } : msg));
                    } else { 
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
            await getChatResponse(settings, newMessages, activePersona, useWebSearch, useThinking, streamOptions);
            
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                const errorMessage = err.message;
                setError(errorMessage);
                setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Sorry, an error occurred: ${errorMessage}` }]);
            }
        } finally {
            setIsLoading(false);
            if (useWebSearch) setUseWebSearch(false); 
        }
    }, [isLoading, messages, settings, activePersona, useWebSearch, useThinking]);
    
    useEffect(() => {
        // Auto-save project
        if (!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content) {
            const title = messages[0].content.substring(0, 50);
            const projectData: Omit<ChatProject, 'id' | 'createdAt'> = {
                type: 'chat',
                prompt: title,
                tags: currentProjectRef.current?.tags || [],
                data: {
                    messages: messages,
                    persona: activePersona,
                    workspaceAssets: assets
                }
            };

            if (currentProjectRef.current?.id) {
                dbService.updateProject({ ...projectData, id: currentProjectRef.current.id, createdAt: currentProjectRef.current.createdAt } as Project);
            } else {
                dbService.addProject(projectData).then(id => {
                    setCurrentProject({ ...projectData, id, createdAt: new Date() } as ChatProject);
                });
            }
        }
    }, [messages, isLoading, activePersona, assets]);

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
    };

    const handleReferenceActiveAsset = () => {
        if (activeAsset) {
            const fileReference = `The user has referenced the file "${activeAsset.name}". Here is its content:\n\n\`\`\`\n${activeAsset.content}\n\`\`\`\n\nMy request is: ${input}`;
            setInput(fileReference);
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.focus();
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
                        className="w-full h-12 p-3 pl-12 pr-36 bg-light-surface dark:bg-gray-700 text-light-text-primary dark:text-gray-200 border border-light-border dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        rows={1}
                        disabled={isLoading}
                        style={{ height: 'auto', minHeight: '3rem', maxHeight: '12rem' }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
                        <Tooltip text="Reference Active File">
                             <button onClick={handleReferenceActiveAsset} className="p-2 rounded-full text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-600 disabled:opacity-50" disabled={!activeAsset}>
                                <FileIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {showThinkingToggle && (
                            <Tooltip text={useThinking ? "AI Thinking: On (Higher Quality)" : "AI Thinking: Off (Faster Response)"}>
                                <button
                                    onClick={() => setUseThinking(!useThinking)}
                                    className={`p-2 rounded-full transition-colors ${useThinking ? 'text-purple-500 bg-purple-500/20' : 'text-light-text-secondary dark:text-gray-400 hover:bg-black/10 dark:hover:bg-gray-600'}`}
                                    disabled={isLoading}
                                >
                                    <WandIcon className="h-5 w-5" />
                                </button>
                            </Tooltip>
                        )}
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
                    </div>
                </div>
            </div>
        </div>
    );
};