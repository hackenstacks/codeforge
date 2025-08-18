import type { Settings, ImageGenerationResult, ChatMessage, Persona } from '../types';
import { callGeminiApiForChat, callGeminiApiForImageGeneration } from './geminiService';
import { callOpenAICompatibleApiForChat } from './openaiCompatibleService';
import { GenerateContentResponse } from '@google/genai';

export const getChatResponse = async (
    settings: Settings,
    messages: ChatMessage[],
    persona: Persona,
    useWebSearch: boolean,
    streamOptions: { signal: AbortSignal, onChunk: (chunk: any) => void }
): Promise<any> => {
     switch (settings.provider) {
        case 'gemini':
            return callGeminiApiForChat(settings, messages, persona, useWebSearch, streamOptions as { signal: AbortSignal, onChunk: (chunk: GenerateContentResponse) => void });
        case 'openai':
            // The OpenAI service will need to be adapted to return a compatible response or this needs a transformer
            return callOpenAICompatibleApiForChat(settings, messages, persona, useWebSearch, streamOptions);
        default:
            throw new Error(`Unsupported provider: ${settings.provider}`);
    }
}


export const generateImage = async (
    settings: Settings,
    prompt: string,
): Promise<ImageGenerationResult> => {
    switch (settings.provider) {
        case 'gemini':
            return callGeminiApiForImageGeneration(settings, prompt);
        case 'openai':
            // You would need to implement this in the openaiCompatibleService
            throw new Error("Image generation for OpenAI-compatible providers is not implemented yet.");
        default:
            throw new Error(`Unsupported provider: ${settings.provider}`);
    }
}