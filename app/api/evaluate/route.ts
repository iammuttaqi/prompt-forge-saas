import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { interpolateTemplate } from "@/lib/variableParser";
import { estimateTokens, calculateEstimatedCost } from "@/lib/tokenEstimator";
import { evaluateAssertions, generateLocalMockCompletion } from "@/lib/assertionEngine";
import { EvaluationRunResult } from "@/types/evaluation";

// POST /api/evaluate - Run evaluation matrix runner
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { promptVersionId, promptDraft, scenarioIds, customScenarios } = body;

    let targetSystemPrompt: string = "";
    let targetUserPrompt: string = "";
    let targetAssistantPrompt: string = "";
    let modelName = "gpt-4o";
    let dbVersion = null;

    if (promptVersionId) {
      dbVersion = await prisma.promptVersion.findUnique({
        where: { id: promptVersionId },
      });

      if (!dbVersion) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VERSION_NOT_FOUND",
              message: `PromptVersion '${promptVersionId}' was not found.`,
            },
          },
          { status: 404 }
        );
      }

      targetSystemPrompt = dbVersion.systemPrompt || "";
      targetUserPrompt = dbVersion.userPrompt || "";
      targetAssistantPrompt = dbVersion.assistantPrompt || "";

      if (dbVersion.modelConfig) {
        try {
          const cfg = JSON.parse(dbVersion.modelConfig);
          if (cfg.model) modelName = cfg.model;
        } catch {}
      }
    } else if (promptDraft) {
      targetSystemPrompt = promptDraft.systemPrompt || "";
      targetUserPrompt = promptDraft.userPrompt || "";
      targetAssistantPrompt = promptDraft.assistantPrompt || "";
      if (promptDraft.modelConfig?.model) {
        modelName = promptDraft.modelConfig.model;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Either promptVersionId or promptDraft must be provided.",
          },
        },
        { status: 400 }
      );
    }

    // Gather scenarios
    interface ScenarioToRun {
      id: string;
      name: string;
      inputVariables: Record<string, string>;
      expectedKeywords: string[];
      forbiddenKeywords: string[];
      maxTokenLimit: number | null;
      isPersisted: boolean;
    }

    const scenariosToRun: ScenarioToRun[] = [];

    if (scenarioIds && scenarioIds.length > 0) {
      const dbScenarios = await prisma.testScenario.findMany({
        where: { id: { in: scenarioIds } },
      });

      for (const sc of dbScenarios) {
        let parsedInputs: Record<string, string> = {};
        try {
          parsedInputs = JSON.parse(sc.inputVariables);
        } catch {}

        let expected: string[] = [];
        if (sc.expectedKeywords) {
          try {
            expected = JSON.parse(sc.expectedKeywords);
          } catch {}
        }

        let forbidden: string[] = [];
        if (sc.forbiddenKeywords) {
          try {
            forbidden = JSON.parse(sc.forbiddenKeywords);
          } catch {}
        }

        scenariosToRun.push({
          id: sc.id,
          name: sc.name,
          inputVariables: parsedInputs,
          expectedKeywords: expected,
          forbiddenKeywords: forbidden,
          maxTokenLimit: sc.maxTokenLimit,
          isPersisted: true,
        });
      }
    }

    if (customScenarios && Array.isArray(customScenarios)) {
      for (let i = 0; i < customScenarios.length; i++) {
        const cs = customScenarios[i];
        scenariosToRun.push({
          id: cs.id || `custom_${Date.now()}_${i}`,
          name: cs.name || `Scenario ${i + 1}`,
          inputVariables: cs.inputVariables || {},
          expectedKeywords: cs.expectedKeywords || [],
          forbiddenKeywords: cs.forbiddenKeywords || [],
          maxTokenLimit: cs.maxTokenLimit || null,
          isPersisted: false,
        });
      }
    }

    if (scenariosToRun.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_SCENARIOS",
            message: "No test scenarios were selected or provided for evaluation.",
          },
        },
        { status: 400 }
      );
    }

    const results: EvaluationRunResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    for (const sc of scenariosToRun) {
      const scenarioStart = Date.now();

      // Interpolate prompt
      const interpolatedSystem = interpolateTemplate(targetSystemPrompt, sc.inputVariables);
      const interpolatedUser = interpolateTemplate(targetUserPrompt, sc.inputVariables);
      const fullRenderedPrompt = `${
        interpolatedSystem ? `[System]: ${interpolatedSystem}\n` : ""
      }[User]: ${interpolatedUser}`;

      // Simulate output with realistic deterministic completion
      const simulatedOutput = generateLocalMockCompletion(
        targetSystemPrompt + "\n" + targetUserPrompt,
        sc.name,
        sc.inputVariables,
        sc.expectedKeywords
      );

      const scenarioLatency = Math.max(120, Date.now() - scenarioStart + Math.floor(Math.random() * 80));
      const outTokens = estimateTokens(simulatedOutput);
      const inTokens = estimateTokens(fullRenderedPrompt);
      const costResult = calculateEstimatedCost(inTokens, outTokens, modelName);

      // Evaluate assertions
      const assertionOutcome = evaluateAssertions(simulatedOutput, outTokens, {
        expectedKeywords: sc.expectedKeywords,
        forbiddenKeywords: sc.forbiddenKeywords,
        maxTokenLimit: sc.maxTokenLimit || undefined,
      });

      if (assertionOutcome.status === "PASSED") {
        passedCount++;
      } else {
        failedCount++;
      }

      const evalResult: EvaluationRunResult = {
        id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        scenarioId: sc.id,
        scenarioName: sc.name,
        status: assertionOutcome.status,
        latencyMs: scenarioLatency,
        tokenCount: outTokens,
        estimatedCost: costResult.totalCost,
        interpolatedPrompt: fullRenderedPrompt,
        simulatedOutput,
        assertions: assertionOutcome.assertions,
        failureReason: assertionOutcome.failureSummary || null,
      };

      results.push(evalResult);

      // Persist to database if dbVersion and dbScenario exist
      if (dbVersion && sc.isPersisted) {
        try {
          await prisma.evaluationResult.create({
            data: {
              promptVersionId: dbVersion.id,
              scenarioId: sc.id,
              interpolatedPrompt: fullRenderedPrompt,
              simulatedOutput,
              status: assertionOutcome.status,
              latencyMs: scenarioLatency,
              tokenCount: outTokens,
              estimatedCost: costResult.totalCost,
              failureReason: assertionOutcome.failureSummary || null,
            },
          });
        } catch (dbErr) {
          console.error("Failed to persist evaluation record:", dbErr);
        }
      }
    }

    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        batchSummary: {
          total: scenariosToRun.length,
          passed: passedCount,
          failed: failedCount,
          durationMs: totalDuration,
        },
        results,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/evaluate:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "EVALUATION_FAILED",
          message: error.message || "Failed to execute evaluation suite",
        },
      },
      { status: 500 }
    );
  }
}
