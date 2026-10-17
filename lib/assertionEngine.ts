import { AssertionRuleSet, AssertionCheckResult, EvaluationOutcome } from "@/types/evaluation";

export function evaluateAssertions(
  output: string,
  outputTokenCount: number,
  rules: AssertionRuleSet
): EvaluationOutcome {
  const assertions: AssertionCheckResult[] = [];
  let allPassed = true;
  const lowerOutput = (output || "").toLowerCase();

  // 1. Required Keywords Check
  if (rules.expectedKeywords && rules.expectedKeywords.length > 0) {
    rules.expectedKeywords.forEach((keyword) => {
      const trimmed = keyword.trim();
      if (!trimmed) return;
      const exists = lowerOutput.includes(trimmed.toLowerCase());
      assertions.push({
        ruleName: `Contains keyword: "${trimmed}"`,
        passed: exists,
        message: exists
          ? `Found required keyword "${trimmed}"`
          : `Missing required keyword "${trimmed}"`,
      });
      if (!exists) allPassed = false;
    });
  }

  // 2. Forbidden Keywords Check
  if (rules.forbiddenKeywords && rules.forbiddenKeywords.length > 0) {
    rules.forbiddenKeywords.forEach((forbidden) => {
      const trimmed = forbidden.trim();
      if (!trimmed) return;
      const exists = lowerOutput.includes(trimmed.toLowerCase());
      assertions.push({
        ruleName: `Excludes keyword: "${trimmed}"`,
        passed: !exists,
        message: !exists
          ? `Verified absence of "${trimmed}"`
          : `Detected forbidden keyword "${trimmed}"`,
      });
      if (exists) allPassed = false;
    });
  }

  // 3. Max Token Limit Check
  if (rules.maxTokenLimit && rules.maxTokenLimit > 0) {
    const withinLimit = outputTokenCount <= rules.maxTokenLimit;
    assertions.push({
      ruleName: `Token count <= ${rules.maxTokenLimit}`,
      passed: withinLimit,
      message: withinLimit
        ? `Output token count (${outputTokenCount}) is within limit`
        : `Output exceeded token limit (${outputTokenCount} > ${rules.maxTokenLimit})`,
    });
    if (!withinLimit) allPassed = false;
  }

  const failures = assertions.filter((a) => !a.passed).map((a) => a.message);

  return {
    status: allPassed ? "PASSED" : "FAILED",
    assertions,
    failureSummary: failures.length > 0 ? failures.join("; ") : undefined,
  };
}

/**
 * Deterministic local mock completion generator for sandboxed test execution.
 */
export function generateLocalMockCompletion(
  prompt: string,
  scenarioName: string,
  inputVariables: Record<string, string>,
  expectedKeywords?: string[]
): string {
  const lowerPrompt = prompt.toLowerCase();

  // Check if JSON output is requested
  const isJson =
    lowerPrompt.includes("json") ||
    lowerPrompt.includes("output valid json") ||
    lowerPrompt.includes("schema");

  if (isJson) {
    const responseObj: Record<string, any> = {
      status: "success",
      scenario: scenarioName,
      processedInputs: inputVariables,
      timestamp: new Date().toISOString(),
    };

    if (expectedKeywords && expectedKeywords.length > 0) {
      responseObj.tags = expectedKeywords.map((k) => k.trim());
      responseObj.resolution = `Handled scenario with keywords: ${expectedKeywords.join(", ")}`;
    } else {
      responseObj.notes = "Processed request successfully.";
    }

    return JSON.stringify(responseObj, null, 2);
  }

  // Otherwise, text completion
  let response = `[Response for ${scenarioName}]\n`;
  if (inputVariables && Object.keys(inputVariables).length > 0) {
    response += `Context:\n`;
    for (const [key, value] of Object.entries(inputVariables)) {
      response += `- ${key}: ${value}\n`;
    }
  }

  if (expectedKeywords && expectedKeywords.length > 0) {
    response += `\nVerification check passed. Keywords matched: ${expectedKeywords.join(", ")}.`;
  } else {
    response += `\nTask executed according to prompt instructions.`;
  }

  return response;
}
