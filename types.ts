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

export interface ImageGenerationResult {
    base64Image: string;
}

export type ProviderType = 'gemini' | 'openai';

export interface Settings {
    provider: ProviderType;
    apiKey: string;
    model: string;
    endpoint: string;
}

// ---- Database Project Types ----

export type ProjectType = 'review' | 'code' | 'image';

export interface ProjectDataReview {
    review: CodeReview;
    originalCode: string;
}

export interface ProjectDataCode {
    generatedCode: string;
}

export interface ProjectDataImage {
    base64Image: string;
}

interface BaseProject {
    id?: number;
    prompt?: string;
    tags: string[];
    createdAt: Date;
    fileName?: string;
}

export interface ReviewProject extends BaseProject {
    type: 'review';
    data: ProjectDataReview;
}

export interface CodeProject extends BaseProject {
    type: 'code';
    data: ProjectDataCode;
}

export interface ImageProject extends BaseProject {
    type: 'image';
    data: ProjectDataImage;
}

export type Project = ReviewProject | CodeProject | ImageProject;
