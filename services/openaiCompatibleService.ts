import type { CodeReview, Settings } from '../types';

const getJsonFromResponse = (text: string): any => {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return JSON.parse(match[1]);
    }
    try {
      return JSON.parse(text);
    } catch(e) {
      console.error("Failed to parse JSON response directly, and no markdown block found.", e);
      throw new Error("The AI response was not valid JSON.");
    }
};

export const callOpenAICompatibleApi = async (settings: Settings, code: string, customPrompt?: string): Promise<CodeReview> => {
  if (!settings.endpoint) {
    throw new Error("OpenAI-compatible API endpoint not provided in settings.");
  }

  const codeReviewInterface = `
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
    }
  `;

  let userPrompt = `
    Please act as an expert code reviewer. Analyze the following code snippet for bugs, style issues, and potential improvements.
    Provide the full, corrected version of the code in the 'correctedCode' field. This corrected code should be ready to be copied and used directly, incorporating all your suggested fixes.
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

  const systemPrompt = `
    You are an expert code review assistant. Your task is to analyze user-provided code and return a detailed review.
    You MUST return your response as a single, valid JSON object that strictly adheres to the following TypeScript interface.
    Do NOT include any other text, explanations, or markdown formatting like \`\`\`json outside of the JSON object itself.

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
            response_format: { type: "json_object" } // For models that support it
        })
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Received an empty response from the API.");
    }

    const reviewData = getJsonFromResponse(content);
    return reviewData as CodeReview;

  } catch (error) {
    console.error("Error calling OpenAI-compatible API:", error);
    throw new Error("Failed to get code review. Check endpoint, API key, and model name.");
  }
};
