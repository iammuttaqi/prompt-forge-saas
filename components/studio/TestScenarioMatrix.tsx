"use client";

import React, { useState } from "react";
import { Play, Plus, Trash2, CheckCircle2, XCircle, AlertTriangle, ListFilter, Sparkles } from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateScenarioModal } from "./CreateScenarioModal";
import { EvaluationResultCard } from "./EvaluationResultCard";

export function TestScenarioMatrix() {
  const {
    testScenarios,
    evaluationResults,
    lastBatchSummary,
    isEvaluating,
    runEvaluations,
    deleteScenario,
  } = useStudio();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);

  const handleRunSingle = async (scenarioId: string) => {
    setRunningScenarioId(scenarioId);
    await runEvaluations([scenarioId]);
    setRunningScenarioId(null);
  };

  const handleRunAll = async () => {
    await runEvaluations();
  };

  return (
    <div className="space-y-6">
      {/* Header & Batch Runner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Evaluation Test Matrix
            </h3>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              {testScenarios.length} Scenarios
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute deterministic assertions against matrices of dynamic inputs to prevent regressions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Scenario
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAll}
            isLoading={isEvaluating}
            disabled={testScenarios.length === 0}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
          >
            {isEvaluating ? "Running Evaluations..." : "Run All Scenarios"}
          </Button>
        </div>
      </div>

      {/* Batch Summary Banner if available */}
      {lastBatchSummary && (
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            lastBatchSummary.failed === 0
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
              : "bg-rose-950/40 border-rose-500/30 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {lastBatchSummary.failed === 0 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <h4 className="text-sm font-semibold">
                Evaluation Batch Finished: {lastBatchSummary.passed} of {lastBatchSummary.total} Scenarios Passed
              </h4>
              <p className="text-xs opacity-90">
                Completed in {lastBatchSummary.durationMs}ms across local evaluation sandbox.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="bg-emerald-950 px-2 py-1 rounded border border-emerald-500/40 text-emerald-300">
              {lastBatchSummary.passed} Passed
            </span>
            {lastBatchSummary.failed > 0 && (
              <span className="bg-rose-950 px-2 py-1 rounded border border-rose-500/40 text-rose-300">
                {lastBatchSummary.failed} Failed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Scenarios Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Configured Scenarios
          </span>
        </div>

        {testScenarios.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-2">
            <p>No test scenarios configured for this prompt yet.</p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add First Test Case
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {testScenarios.map((sc) => {
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

              // Check if recent evaluation result exists
              const recentResult = evaluationResults.find((r) => r.scenarioId === sc.id);

              return (
                <div
                  key={sc.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">
                        {sc.name}
                      </span>
                      {recentResult && (
                        <Badge
                          variant={recentResult.status === "PASSED" ? "passed" : "failed"}
                          size="sm"
                        >
                          {recentResult.status}
                        </Badge>
                      )}
                    </div>

                    {/* Inputs preview */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {Object.entries(parsedInputs).map(([k, v]) => (
                        <span
                          key={k}
                          className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px]"
                        >
                          <span className="text-indigo-400">{k}:</span> {v}
                        </span>
                      ))}
                    </div>

                    {/* Assertions preview */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-0.5 font-mono">
                      {expected.length > 0 && (
                        <span className="text-emerald-400">
                          Expects: {expected.join(", ")}
                        </span>
                      )}
                      {forbidden.length > 0 && (
                        <span className="text-rose-400">
                          Excludes: {forbidden.join(", ")}
                        </span>
                      )}
                      {sc.maxTokenLimit && (
                        <span className="text-slate-500">
                          Tokens ≤ {sc.maxTokenLimit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleRunSingle(sc.id)}
                      isLoading={runningScenarioId === sc.id}
                      leftIcon={<Play className="w-3 h-3 fill-current" />}
                    >
                      Run
                    </Button>
                    <button
                      type="button"
                      onClick={() => deleteScenario(sc.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete scenario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluation Results Breakdown */}
      {evaluationResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Evaluation Execution Details
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {evaluationResults.length} result(s)
            </span>
          </div>

          <div className="space-y-3">
            {evaluationResults.map((result) => (
              <EvaluationResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <CreateScenarioModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
