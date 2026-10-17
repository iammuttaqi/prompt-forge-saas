export interface ModelPricing {
  modelName: string;
  provider: string;
  inputPer1k: number;  // Cost per 1,000 input tokens in USD
  outputPer1k: number; // Cost per 1,000 output tokens in USD
  maxContext: number;  // Max context tokens
}

export const MODEL_CATALOG: Record<string, ModelPricing> = {
  "gpt-4o": {
    modelName: "GPT-4o (Omni)",
    provider: "OpenAI",
    inputPer1k: 0.005,
    outputPer1k: 0.015,
    maxContext: 128000,
  },
  "gpt-4o-mini": {
    modelName: "GPT-4o Mini",
    provider: "OpenAI",
    inputPer1k: 0.00015,
    outputPer1k: 0.0006,
    maxContext: 128000,
  },
  "claude-3-5-sonnet": {
    modelName: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputPer1k: 0.003,
    outputPer1k: 0.015,
    maxContext: 200000,
  },
  "claude-3-haiku": {
    modelName: "Claude 3 Haiku",
    provider: "Anthropic",
    inputPer1k: 0.00025,
    outputPer1k: 0.00125,
    maxContext: 200000,
  },
  "gemini-1-5-pro": {
    modelName: "Gemini 1.5 Pro",
    provider: "Google",
    inputPer1k: 0.0035,
    outputPer1k: 0.0105,
    maxContext: 1000000,
  },
  "gemini-1-5-flash": {
    modelName: "Gemini 1.5 Flash",
    provider: "Google",
    inputPer1k: 0.000075,
    outputPer1k: 0.0003,
    maxContext: 1000000,
  },
};

/**
 * Estimates token count based on standard English and code heuristic (~3.8 chars per token).
 */
export function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}

/**
 * Computes projected cost for prompt input and simulated output.
 */
export function calculateEstimatedCost(
  inputTokens: number,
  outputTokens: number = 0,
  modelKey: string = "gpt-4o"
): { inputCost: number; outputCost: number; totalCost: number; formattedTotal: string } {
  const model = MODEL_CATALOG[modelKey] || MODEL_CATALOG["gpt-4o"];
  const inputCost = (inputTokens / 1000) * model.inputPer1k;
  const outputCost = (outputTokens / 1000) * model.outputPer1k;
  const totalCost = inputCost + outputCost;

  let formattedTotal: string;
  if (totalCost < 0.0001 && totalCost > 0) {
    formattedTotal = "< $0.0001";
  } else {
    formattedTotal = `$${totalCost.toFixed(4)}`;
  }

  return {
    inputCost,
    outputCost,
    totalCost,
    formattedTotal,
  };
}
