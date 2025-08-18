export interface Correction {
  line?: number;
  problematicCode: string;
  suggestedFix: string;
  explanation: string;
}

export interface Recommendation {
  area: string;
  suggestion: string;
  explanation: string;
}

export interface CodeReview {
  summary: string;
  corrections: Correction[];
  recommendations: Recommendation[];
  correctedCode: string;
  validationSummary?: string;
}

export interface CodeGeneration {
  generatedCode: string;
}

export type ProviderType = 'gemini' | 'openai';

export interface Settings {
    provider: ProviderType;
    apiKey: string;
    model: string;
    endpoint: string;
}