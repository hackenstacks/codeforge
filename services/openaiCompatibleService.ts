import type { Settings, ImageGenerationResult, ChatMessage, Persona } from '../types';

const processStream = async (response: Response, onChunk: (chunk: string) => void): Promise<string> => {
    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';

    while(true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value);
        const lines = textChunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();
                if (dataStr === '[DONE]') {
                    break;
                }
                try {
                    const parsed = JSON.parse(dataStr);
                    const delta = parsed.choices[0]?.delta?.content;
                    if(delta) {
                        accumulatedText += delta;
                        // For OpenAI, we send raw text chunks
                        onChunk(delta);
                    }
                } catch (e) {
                    console.warn("Could not parse stream chunk:", dataStr);
                }
            }
        }
    }
    return accumulatedText;
}


export const callOpenAICompatibleApiForChat = async (
    settings: Settings,
    messages: ChatMessage[],
    persona: Persona,
    useWebSearch: boolean, // Note: Web search is a Gemini-specific feature via the API. This is a placeholder.
    streamOptions: { signal: AbortSignal, onChunk: (chunk: string) => void }
): Promise<{ text: string }> => {
  if (!settings.endpoint) {
    throw new Error("OpenAI-compatible API endpoint not provided. Please check your settings.");
  }
  if (useWebSearch) {
      console.warn("Web search is not natively supported by the OpenAI-compatible endpoint and is being ignored.");
  }

  const apiMessages = [
      { role: 'system', content: persona.systemInstruction },
      ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const response = await fetch(settings.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
            model: settings.model,
            messages: apiMessages,
            stream: true,
        }),
        signal: streamOptions.signal,
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const accumulatedText = await processStream(response, streamOptions.onChunk);
    
    // The final response object for OpenAI will be simpler than Gemini's
    return { text: accumulatedText };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.error("Error calling OpenAI-compatible API for chat:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get response from OpenAI-compatible API. ${errorMessage}`);
  }
};