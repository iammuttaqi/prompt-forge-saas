export type InputVariables = Record<string, string>;

export interface TestScenario {
  id: string;
  promptId: string;
  name: string;
  inputVariables: string; // JSON string of InputVariables
  expectedKeywords: string | null; // JSON string array
  forbiddenKeywords: string | null; // JSON string array
  maxTokenLimit: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateScenarioInput {
  promptId: string;
  name: string;
  inputVariables: Record<string, string>;
  expectedKeywords?: string[];
  forbiddenKeywords?: string[];
  maxTokenLimit?: number;
}

export interface UpdateScenarioInput {
  name?: string;
  inputVariables?: Record<string, string>;
  expectedKeywords?: string[];
  forbiddenKeywords?: string[];
  maxTokenLimit?: number;
}
