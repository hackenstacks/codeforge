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

// ---- Chat Types ----
export type ChatMessageRole = 'user' | 'assistant';

export interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    }
}

export interface ChatMessage {
    role: ChatMessageRole;
    content: string;
    groundingChunks?: GroundingChunk[];
}

export interface Persona {
    id: string;
    name: string;
    description: string;
    systemInstruction: string;
    avatar: string; // emoji
}

// ---- Workspace Types ----
export type WorkspaceAssetType = 'text' | 'code' | 'image';

export interface WorkspaceAsset {
    id: string;
    name: string;
    type: WorkspaceAssetType;
    content: string; // For text/code, it's the text content. For images, it's the base64 string.
    mimeType?: string; // e.g., 'image/png'
}


// ---- Database Project Types ----
export type ProjectType = 'review' | 'code' | 'image' | 'chat';

export interface ProjectDataReview {
    review: CodeReview;
    originalCode: string;
}

export interface ProjectDataGeneratedCode {
    generatedCode:string;
}

export interface ProjectDataImage {
    base64Image: string;
}

export interface ProjectDataChat {
    messages: ChatMessage[];
    persona: Persona;
    workspaceAssets?: WorkspaceAsset[];
}

interface BaseProject {
    id?: number;
    prompt?: string; // Can be used as title for chat
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
    data: ProjectDataGeneratedCode;
}

export interface ImageProject extends BaseProject {
    type: 'image';
    data: ProjectDataImage;
}

export interface ChatProject extends BaseProject {
    type: 'chat';
    data: ProjectDataChat;
}

export type Project = ReviewProject | CodeProject | ImageProject | ChatProject;

// ---- Encrypted DB Type ----
export interface EncryptedProject {
    id: number;
    ciphertext: string;
}
