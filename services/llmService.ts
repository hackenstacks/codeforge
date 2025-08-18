import type { Settings, CodeReview, CodeGeneration, ImageGenerationResult } from '../types';
import { callGeminiApi, callGeminiApiForGeneration, callGeminiApiForImageGeneration } from './geminiService';
import { callOpenAICompatibleApi, callOpenAICompatibleApiForGeneration, callOpenAICompatibleApiForImageGeneration } from './openaiCompatibleService';

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

export const generateImage = async (
    settings: Settings,
    prompt: string,
): Promise<ImageGenerationResult> => {
    switch (settings.provider) {
        case 'gemini':
            return callGeminiApiForImageGeneration(settings, prompt);
        case 'openai':
            return callOpenAICompatibleApiForImageGeneration(settings, prompt);
        default:
            throw new Error(`Unsupported provider: ${settings.provider}`);
    }
}