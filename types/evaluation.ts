export interface AssertionRuleSet {
  expectedKeywords?: string[];
  forbiddenKeywords?: string[];
  maxTokenLimit?: number;
}

export interface AssertionCheckResult {
  ruleName: string;
  passed: boolean;
  message: string;
}

export interface EvaluationOutcome {
  status: "PASSED" | "FAILED";
  assertions: AssertionCheckResult[];
  failureSummary?: string;
}

export interface EvaluationRunResult {
  id: string;
  scenarioId: string;
  scenarioName: string;
  status: "PASSED" | "FAILED" | "ERROR";
  latencyMs: number;
  tokenCount: number;
  estimatedCost?: number | null;
  interpolatedPrompt?: string;
  simulatedOutput: string;
  assertions: AssertionCheckResult[];
  failureReason: string | null;
}

export interface EvaluationBatchSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

export interface EvaluateRequestBody {
  promptVersionId?: string;
  promptDraft?: {
    systemPrompt?: string | null;
    userPrompt: string;
    assistantPrompt?: string | null;
    modelConfig?: any;
  };
  scenarioIds?: string[];
  customScenarios?: Array<{
    id?: string;
    name: string;
    inputVariables: Record<string, string>;
    expectedKeywords?: string[];
    forbiddenKeywords?: string[];
    maxTokenLimit?: number;
  }>;
}

export interface EvaluateResponseData {
  batchSummary: EvaluationBatchSummary;
  results: EvaluationRunResult[];
}
