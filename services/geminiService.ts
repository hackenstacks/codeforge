import { GoogleGenAI, Type } from "@google/genai";
import type { CodeReview, Settings, CodeGeneration } from '../types';

const reviewSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief, high-level summary of the code's quality.",
    },
    corrections: {
      type: Type.ARRAY,
      description: "A list of specific corrections for bugs or critical issues.",
      items: {
        type: Type.OBJECT,
        properties: {
          line: {
            type: Type.INTEGER,
            description: "The line number of the issue, if applicable.",
          },
          problematicCode: {
            type: Type.STRING,
            description: "The exact code snippet that needs fixing.",
          },
          suggestedFix: {
            type: Type.STRING,
            description: "The corrected version of the code.",
          },
          explanation: {
            type: Type.STRING,
            description: "A clear explanation of why the change is needed.",
          },
        },
        required: ["problematicCode", "suggestedFix", "explanation"],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      description: "A list of suggestions for improving code style, performance, or best practices.",
      items: {
        type: Type.OBJECT,
        properties: {
          area: {
            type: Type.STRING,
            description: "The area of improvement (e.g., 'Performance', 'Readability', 'Security').",
          },
          suggestion: {
            type: Type.STRING,
            description: "The detailed recommendation.",
          },
          explanation: {
            type: Type.STRING,
            description: "The reasoning behind the suggestion.",
          },
        },
        required: ["area", "suggestion", "explanation"],
      },
    },
    correctedCode: {
      type: Type.STRING,
      description: "The full, complete code snippet with all corrections applied. This should be a single block of text representing the entire corrected file or snippet.",
    },
    validationSummary: {
        type: Type.STRING,
        description: "A summary of the AI's validation process. Explain if any potential runtime errors, logic flaws, or edge cases were found in the initially corrected code and how they were fixed in the final version. If no issues were found, state that the code was validated."
    }
  },
  required: ["summary", "corrections", "recommendations", "correctedCode"],
};

const generationSchema = {
    type: Type.OBJECT,
    properties: {
        generatedCode: {
            type: Type.STRING,
            description: "The complete, functional code generated based on the user's prompt. This should be a single block of text representing the entire file or snippet.",
        },
    },
    required: ["generatedCode"],
};


const extractJsonFromText = (text: string): string => {
    if (!text) return '';
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
    return jsonText;
};

const processStream = async (stream: any, onChunk: (chunk: string) => void): Promise<string> => {
    let accumulatedText = '';
    for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
            accumulatedText += chunkText;
            onChunk(chunkText);
        }
    }
    return accumulatedText;
}


export const callGeminiApiForGeneration = async (settings: Settings, prompt: string, streamOptions?: { signal: AbortSignal, onChunk: (chunk: string) => void }): Promise<CodeGeneration> => {
  if (!settings.apiKey) {
    throw new Error("Google API Key not provided in settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  const generationPrompt = `
    Please act as an expert software engineer. Based on the user's request, generate a complete and functional code snippet.
    The code should be well-structured, follow best practices, and include comments where necessary.
    You MUST return your response as a single, valid JSON object adhering to the specified schema.

    CRITICAL: The 'generatedCode' field must contain the entire code as a SINGLE JSON STRING.
    This requires escaping all special characters. For example:
    - Double quotes (") must be escaped as (\\").
    - Backslashes (\\) must be escaped as (\\\\).
    - Newline characters must be escaped as (\\n).
    This is MANDATORY for the JSON to be valid.

    User's request:
    ---
    ${prompt}
    ---
  `;

  try {
    const params: any = {
      model: settings.model || "gemini-2.5-flash",
      contents: generationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generationSchema,
      },
    };

    if (streamOptions?.signal) {
      params.signal = streamOptions.signal;
    }
    
    const stream = await ai.models.generateContentStream(params);

    const accumulatedText = await processStream(stream, streamOptions?.onChunk || (() => {}));
    
    if (!accumulatedText) {
        throw new Error("The API returned an empty or invalid response.");
    }
    
    const jsonText = extractJsonFromText(accumulatedText);
    try {
        const generationData = JSON.parse(jsonText);
        return generationData as CodeGeneration;
    } catch (parseError) {
        console.error("Failed to parse JSON response from Gemini API. Raw response text:", accumulatedText);
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`The AI returned an invalid JSON response. Error: ${errorMessage}. This can sometimes happen with complex code. Please check the browser's developer console for the raw API output.`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.error("Error calling Gemini API for generation:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate code from Gemini API. ${errorMessage}`);
  }
};


export const callGeminiApi = async (settings: Settings, code: string, customPrompt?: string, deepScan?: boolean, streamOptions?: { signal: AbortSignal, onChunk: (chunk: string) => void }): Promise<CodeReview> => {
  if (!settings.apiKey) {
    throw new Error("Google API Key not provided in settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  let prompt = `
    Please act as an expert code reviewer. Analyze the following code snippet for bugs, style issues, and potential improvements.
    Provide a detailed review in the specified JSON format.
  `;
  
  if (deepScan) {
      prompt += `
      Follow this two-step process:
      1.  **Initial Review**: First, identify all issues and generate a corrected version of the code.
      2.  **Validation & Refinement**: After generating the corrected code, perform a critical "dry run" analysis on it. Pretend to execute the code and check for potential runtime errors, logic flaws, or unhandled edge cases. Refine the code further based on this validation. Your final 'correctedCode' output must be this refined, validated version.
      
      Provide a summary of your validation process in the 'validationSummary' field.
      `;
  }

  prompt += `
    Most importantly, provide the full, corrected version of the code in the 'correctedCode' field.
    
    CRITICAL: The 'correctedCode' field must contain the entire code as a SINGLE JSON STRING.
    This requires escaping all special characters. For example:
    - Double quotes (") must be escaped as (\\").
    - Backslashes (\\) must be escaped as (\\\\).
    - Newline characters must be escaped as (\\n).
    This is MANDATORY for the JSON to be valid.
  `;

  if (customPrompt && customPrompt.trim() !== '') {
    prompt += `
    
    The user has provided the following specific instructions. Please prioritize them in your review:
    ---
    ${customPrompt}
    ---
    `;
  }

  prompt += `

    Code to review:
    \`\`\`
    ${code}
    \`\`\`
  `;

  try {
    const params: any = {
      model: settings.model || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reviewSchema,
      },
    };

    if (streamOptions?.signal) {
      params.signal = streamOptions.signal;
    }

    const stream = await ai.models.generateContentStream(params);

    const accumulatedText = await processStream(stream, streamOptions?.onChunk || (() => {}));

    if (!accumulatedText) {
        throw new Error("The API returned an empty or invalid response. This may be due to safety filters or other issues.");
    }
    
    const jsonText = extractJsonFromText(accumulatedText);
    try {
        const reviewData = JSON.parse(jsonText);
        return reviewData as CodeReview;
    } catch (parseError) {
        console.error("Failed to parse JSON response from Gemini API. Raw response text:", accumulatedText);
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`The AI returned an invalid JSON response. Error: ${errorMessage}. This can sometimes happen with complex code. Please check the browser's developer console for the raw API output.`);
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
        throw error;
    }
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get code review from Gemini API. ${errorMessage}`);
  }
};