import type { CodeReview, Settings } from '../types';

const extractJsonFromText = (text: string): any => {
    if (!text) {
      throw new Error("The AI returned an empty content string.");
    }
    
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

    CRITICAL: The value for the 'correctedCode' field must be a single, valid JSON string. All special characters within the code, especially double quotes (") and backslashes (\\), must be properly escaped (e.g., \\" and \\\\) to ensure the final output is a valid JSON object.

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

    const reviewData = extractJsonFromText(content);
    return reviewData as CodeReview;

  } catch (error) {
    console.error("Error calling OpenAI-compatible API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get code review from OpenAI-compatible API. ${errorMessage}`);
  }
};