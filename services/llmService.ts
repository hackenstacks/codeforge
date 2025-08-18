import type { Settings, CodeReview } from '../types';
import { callGeminiApi } from './geminiService';
import { callOpenAICompatibleApi } from './openaiCompatibleService';

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