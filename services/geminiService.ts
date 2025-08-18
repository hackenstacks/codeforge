import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { CodeReview, Settings } from '../types';

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
  },
  required: ["summary", "corrections", "recommendations", "correctedCode"],
};

const extractJsonFromText = (text: string): string => {
    if (!text) return '';
    let jsonText = text.trim();

    // 1. Try to find JSON within ```json ... ```
    const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        jsonText = match[1].trim();
    } else {
        // 2. If not found, find the first '{' and last '}'
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1).trim();
        }
    }
    return jsonText;
};


export const callGeminiApi = async (settings: Settings, code: string, customPrompt?: string): Promise<CodeReview> => {
  if (!settings.apiKey) {
    throw new Error("Google API Key not provided in settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  let prompt = `
    Please act as an expert code reviewer. Analyze the following code snippet for bugs, style issues, and potential improvements.
    Provide a detailed review in the specified JSON format.
    Most importantly, provide the full, corrected version of the code in the 'correctedCode' field. This corrected code should be ready to be copied and used directly, incorporating all your suggested fixes.
    
    CRITICAL: The value for 'correctedCode' must be a single, valid JSON string. All special characters, especially double quotes (") and backslashes (\\), within the code must be properly escaped (e.g., \\" and \\\\). Failure to do so will result in an invalid JSON object.
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
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: settings.model || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reviewSchema,
      },
    });

    const rawText = response?.text;

    if (!rawText) {
        let reason = "The API returned an empty or invalid response.";
        const candidates = (response as any)?.candidates;
        const promptFeedback = (response as any)?.promptFeedback;

        if (promptFeedback?.blockReason) {
            reason = `The prompt was blocked due to safety settings. Reason: ${promptFeedback.blockReason}.`;
        } else if (candidates?.[0]?.finishReason && candidates?.[0]?.finishReason !== 'STOP') {
            reason = `The response was incomplete, possibly due to safety filters or other issues. Finish reason: ${candidates[0].finishReason}.`;
        }
        
        throw new Error(reason);
    }

    const jsonText = extractJsonFromText(rawText);
    try {
        const reviewData = JSON.parse(jsonText);
        return reviewData as CodeReview;
    } catch (parseError) {
        console.error("Failed to parse JSON response from Gemini API. Raw response text:", rawText);
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`The AI returned an invalid JSON response. Error: ${errorMessage}. This can sometimes happen with complex code. Please check the browser's developer console for the raw API output.`);
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get code review from Gemini API. ${errorMessage}`);
  }
};