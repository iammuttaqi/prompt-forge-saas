"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Clock, Zap, Coins, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { EvaluationRunResult } from "@/types/evaluation";
import { Badge } from "@/components/ui/Badge";

interface EvaluationResultCardProps {
  result: EvaluationRunResult;
}

export function EvaluationResultCard({ result }: EvaluationResultCardProps) {
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const isPassed = result.status === "PASSED";

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all shadow-sm ${
        isPassed
          ? "bg-slate-900/90 border-emerald-500/30"
          : "bg-slate-900/90 border-rose-500/40"
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isPassed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-semibold text-slate-100">
            {result.scenarioName}
          </span>
          <Badge variant={isPassed ? "passed" : "failed"} size="sm">
            {result.status}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1" title="Execution latency">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {result.latencyMs}ms
          </span>
          <span className="flex items-center gap-1" title="Output token count">
            <Zap className="w-3.5 h-3.5 text-slate-500" />
            {result.tokenCount} tok
          </span>
          {result.estimatedCost !== undefined && result.estimatedCost !== null && (
            <span className="flex items-center gap-1 text-emerald-400/80" title="Cost projection">
              <Coins className="w-3.5 h-3.5 text-emerald-500" />
              ${result.estimatedCost.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Body: Assertions & Output */}
      <div className="p-4 space-y-3">
        {/* Failure Summary Callout if failed */}
        {!isPassed && result.failureReason && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 font-mono">
            <strong>Assertion Failure:</strong> {result.failureReason}
          </div>
        )}

        {/* Assertion Rules Checklist */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Assertion Verifications
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.assertions.map((assertion, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border ${
                  assertion.passed
                    ? "bg-slate-950/60 border-slate-800 text-slate-300"
                    : "bg-rose-950/30 border-rose-500/30 text-rose-300"
                }`}
              >
                {assertion.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="truncate">{assertion.ruleName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated Completion Output Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsOutputExpanded(!isOutputExpanded)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isOutputExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isOutputExpanded ? "Hide Completion Output" : "View Completion Output"}</span>
          </button>

          {isOutputExpanded && (
            <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {result.simulatedOutput}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
