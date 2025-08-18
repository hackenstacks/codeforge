import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import type { Settings, ImageGenerationResult, ChatMessage, Persona } from '../types';

// Helper to convert our ChatMessage array to Gemini's Content array
const buildGeminiHistory = (messages: ChatMessage[]): Content[] => {
    return messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
};


export const callGeminiApiForChat = async (
    settings: Settings,
    messages: ChatMessage[],
    persona: Persona,
    useWebSearch: boolean,
    streamOptions: { signal: AbortSignal, onChunk: (chunk: GenerateContentResponse) => void }
): Promise<GenerateContentResponse> => {
    if (!settings.apiKey) {
        throw new Error("Google API Key not provided. Please check your settings.");
    }
    
    const ai = new GoogleGenAI({ apiKey: settings.apiKey });

    // The last message is the new prompt
    const currentMessages = [...messages];
    const latestMessage = currentMessages.pop();
    if (!latestMessage) {
        throw new Error("No message to send.");
    }

    // The rest of the messages are history
    const history = buildGeminiHistory(currentMessages);
    
    try {
        const model = ai.chats.create({
            model: settings.model || "gemini-2.5-flash",
            config: {
                systemInstruction: persona.systemInstruction,
                tools: useWebSearch ? [{ googleSearch: {} }] : undefined,
            },
            history: history,
        });

        const stream = await model.sendMessageStream({
            message: latestMessage.content,
        });

        let finalResponse: GenerateContentResponse | null = null;
        for await (const chunk of stream) {
            streamOptions.onChunk(chunk);
            finalResponse = chunk;
        }

        if (!finalResponse) {
             throw new Error("Received an empty stream from the API.");
        }
        
        return finalResponse;

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        console.error("Error calling Gemini API for chat:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get response from Gemini API. ${errorMessage}`);
    }
};


export const callGeminiApiForImageGeneration = async (settings: Settings, prompt: string): Promise<ImageGenerationResult> => {
    if (!settings.apiKey) {
        throw new Error("Google API Key not provided in settings.");
    }
    const ai = new GoogleGenAI({ apiKey: settings.apiKey });

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("API did not return any images.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return { base64Image: base64ImageBytes };
    } catch (error) {
        console.error("Error calling Gemini API for image generation:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to generate image from Gemini API. ${errorMessage}`);
    }
};