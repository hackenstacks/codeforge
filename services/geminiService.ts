import { GoogleGenAI, Type } from "@google/genai";
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

export const callGeminiApi = async (settings: Settings, code: string, customPrompt?: string): Promise<CodeReview> => {
  if (!settings.apiKey) {
    throw new Error("Google API Key not provided in settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  let prompt = `
    Please act as an expert code reviewer. Analyze the following code snippet for bugs, style issues, and potential improvements.
    Provide a detailed review in the specified JSON format.
    Most importantly, provide the full, corrected version of the code in the 'correctedCode' field. This corrected code should be ready to be copied and used directly, incorporating all your suggested fixes.
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
    const response = await ai.models.generateContent({
      model: settings.model || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reviewSchema,
      },
    });

    const jsonText = response.text.trim();
    const reviewData = JSON.parse(jsonText);
    return reviewData as CodeReview;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get code review from Gemini API. Check API key and model name.");
  }
};