import type { CodeReview, Settings } from '../types';

const extractJsonFromText = (text: string): any => {
    if (!text) {
      throw new Error("The AI returned an empty content string.");
    }
    
    let jsonText = text.trim();

    const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        jsonText = match[1].trim();
    } else {
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1).trim();
        }
    }
    
    if (!jsonText) {
      throw new Error("The AI returned an empty content string.");
    }

    try {
      return JSON.parse(jsonText);
    } catch(e) {
      console.error("Failed to parse JSON response from OpenAI-compatible API. Raw content received:", text);
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`The AI returned an invalid JSON response. Error: ${errorMessage}. This can sometimes happen with complex code. Please check the browser's developer console for the raw API output.`);
    }
};

export const callOpenAICompatibleApi = async (settings: Settings, code: string, customPrompt?: string, deepScan?: boolean, streamOptions?: { signal: AbortSignal, onChunk: (chunk: string) => void }): Promise<CodeReview> => {
  if (!settings.endpoint) {
    throw new Error("OpenAI-compatible API endpoint not provided in settings.");
  }

  let codeReviewInterface = `
    interface Correction {
      line?: number;
      problematicCode: string;
      suggestedFix: string;
      explanation: string;
    }
    interface Recommendation {
      area: string;
      suggestion: string;
      explanation: string;
    }
    interface CodeReview {
      summary: string;
      corrections: Correction[];
      recommendations: Recommendation[];
      correctedCode: string;
      ${deepScan ? 'validationSummary: string;' : ''}
    }
  `;

  let userPrompt = `
    Please act as an expert code reviewer. Analyze the following code snippet for bugs, style issues, and potential improvements.
  `;

  if (customPrompt && customPrompt.trim() !== '') {
    userPrompt += `
    
    The user has provided the following specific instructions. Please prioritize them in your review:
    ---
    ${customPrompt}
    ---
    `;
  }

  userPrompt += `
  
    Code to review:
    \`\`\`
    ${code}
    \`\`\`
  `;
  
  let systemPrompt = `
    You are an expert code review assistant. Your task is to analyze user-provided code and return a detailed review.
    You MUST return your response as a single, valid JSON object that strictly adheres to the following TypeScript interface.
    Do NOT include any other text, explanations, or markdown formatting like \`\`\`json outside of the JSON object itself.
  `;
  
  if (deepScan) {
      systemPrompt += `
      Your review process must be in two steps:
      1.  **Initial Review**: First, identify all issues and generate a corrected version of the code.
      2.  **Validation & Refinement**: After generating the corrected code, perform a critical "dry run" analysis on it. Pretend to execute the code and check for potential runtime errors, logic flaws, or unhandled edge cases. Refine the code further based on this validation. Your final 'correctedCode' output must be this refined, validated version.
      
      You must provide a summary of your validation process in the 'validationSummary' field.
      `;
  }
  
   systemPrompt += `
    CRITICAL: The 'correctedCode' field must contain the entire code as a SINGLE JSON STRING.
    This requires escaping special characters correctly.
    - All double quotes (") inside the code must become (\\"). Example: {"key": "value with \\"quotes\\""}.
    - All backslashes (\\) inside the code must become (\\\\). Example: {"path": "C:\\\\Users\\\\Test"}.
    - All newline characters must become (\\n). Example: {"code": "line1\\nline2"}.
    This is MANDATORY for the JSON to be valid.

    TypeScript interface for your response:
    ${codeReviewInterface}
  `;

  try {
    const response = await fetch(settings.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
            model: settings.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: true,
        }),
        signal: streamOptions?.signal,
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

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
                        streamOptions?.onChunk(delta);
                    }
                } catch (e) {
                    console.warn("Could not parse stream chunk:", dataStr);
                }
            }
        }
    }

    const reviewData = extractJsonFromText(accumulatedText);
    return reviewData as CodeReview;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
        throw error;
    }
    console.error("Error calling OpenAI-compatible API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get code review from OpenAI-compatible API. ${errorMessage}`);
  }
};