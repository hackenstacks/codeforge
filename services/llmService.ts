import type { Settings, CodeReview, CodeGeneration } from '../types';
import { callGeminiApi, callGeminiApiForGeneration } from './geminiService';
import { callOpenAICompatibleApi, callOpenAICompatibleApiForGeneration } from './openaiCompatibleService';

export const reviewCode = async (
    settings: Settings,
    code: string,
    customPrompt?: string,
    deepScan?: boolean,
    streamOptions?: { signal: AbortSignal, onChunk: (chunk: string) => void }
): Promise<CodeReview> => {
    switch (settings.provider) {
        case 'gemini':
            return callGeminiApi(settings, code, customPrompt, deepScan, streamOptions);
        case 'openai':
            return callOpenAICompatibleApi(settings, code, customPrompt, deepScan, streamOptions);
        default:
            throw new Error(`Unsupported provider: ${settings.provider}`);
    }
};

export const generateCode = async (
    settings: Settings,
    prompt: string,
    streamOptions?: { signal: AbortSignal, onChunk: (chunk: string) => void }
): Promise<CodeGeneration> => {
     switch (settings.provider) {
        case 'gemini':
            return callGeminiApiForGeneration(settings, prompt, streamOptions);
        case 'openai':
            return callOpenAICompatibleApiForGeneration(settings, prompt, streamOptions);
        default:
            throw new Error(`Unsupported provider: ${settings.provider}`);
    }
};