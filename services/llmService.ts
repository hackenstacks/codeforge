import type { Settings, CodeReview } from '../types';
import { callGeminiApi } from './geminiService';
import { callOpenAICompatibleApi } from './openaiCompatibleService';

export const reviewCode = async (
    settings: Settings,
    code: string,
    customPrompt?: string,
    deepScan?: boolean
): Promise<CodeReview> => {
    switch (settings.provider) {
        case 'gemini':
            return callGeminiApi(settings, code, customPrompt, deepScan);
        case 'openai':
            return callOpenAICompatibleApi(settings, code, customPrompt, deepScan);
        default:
            throw new Error(`Unsupported provider: ${settings.provider}`);
    }
};