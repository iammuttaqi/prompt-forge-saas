export interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
}

export type PromptRole = "system" | "user" | "assistant";

export interface PromptVersion {
  id: string;
  promptId: string;
  versionTag: string;
  commitMessage: string | null;
  systemPrompt: string | null;
  userPrompt: string;
  assistantPrompt: string | null;
  modelConfig: string | null; // serialized JSON
  variables: string | null;   // serialized JSON array
  isProduction: boolean;
  createdAt: Date | string;
}

export interface Prompt {
  id: string;
  projectId: string | null;
  title: string;
  slug: string;
  description: string | null;
  activeVersionId: string | null;
  versions: PromptVersion[];
  testScenarios?: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PromptSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  versionCount: number;
  scenarioCount: number;
  activeVersion: {
    id: string;
    versionTag: string;
    isProduction: boolean;
    createdAt: Date | string;
  } | null;
  updatedAt: Date | string;
}

export interface CreatePromptInput {
  title: string;
  slug?: string;
  description?: string;
  systemPrompt?: string;
  userPrompt: string;
  assistantPrompt?: string;
  modelConfig?: ModelConfig;
}

export interface CreateVersionInput {
  versionTag: string;
  commitMessage?: string;
  systemPrompt?: string;
  userPrompt: string;
  assistantPrompt?: string;
  modelConfig?: ModelConfig;
  isProduction?: boolean;
}

export interface UpdatePromptInput {
  title?: string;
  slug?: string;
  description?: string;
  activeVersionId?: string;
}
