import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage, Persona } from '../types';
import { UserIcon } from './icons/UserIcon';
import { LinkIcon } from './icons/LinkIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface ChatMessageBubbleProps {
    message: ChatMessage;
    persona: Persona;
}

const CodeBlock = memo(({ node, inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return !inline && match ? (
        <div className="relative my-2">
            <div className="bg-gray-900 text-gray-400 text-xs px-3 py-1 rounded-t-md flex justify-between items-center">
                <span>{match[1]}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-white"
                    aria-label="Copy code to clipboard"
                >
                    {isCopied ? (
                        <>
                            <CheckIcon className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="h-4 w-4" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className="bg-gray-200 dark:bg-gray-700 text-red-500 dark:text-red-400 rounded px-1 py-0.5 font-mono text-sm" {...props}>
            {children}
        </code>
    );
});

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, persona }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">
                    {persona.avatar}
                </div>
            )}
            <div className={`max-w-2xl w-fit ${isUser ? 'order-1' : 'order-2'}`}>
                <div className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-light-bg dark:bg-gray-700 text-light-text-primary dark:text-gray-200 rounded-bl-lg'}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-pre:bg-transparent prose-pre:p-0">
                         <ReactMarkdown
                            children={message.content}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{ code: CodeBlock }}
                        />
                    </div>
                </div>
                {message.groundingChunks && message.groundingChunks.length > 0 && (
                    <div className="mt-2 text-xs text-light-text-secondary dark:text-gray-400">
                        <h4 className="font-bold mb-1">Sources from the web:</h4>
                        <ul className="space-y-1">
                            {message.groundingChunks.map((chunk, index) => (
                                <li key={index} className="flex items-center gap-1">
                                    <LinkIcon className="h-3 w-3 flex-shrink-0" />
                                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" title={chunk.web.title}>
                                        {chunk.web.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center flex-shrink-0 order-2">
                    <UserIcon className="h-5 w-5" />
                </div>
            )}
        </div>
    );
};