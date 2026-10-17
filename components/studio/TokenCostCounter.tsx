"use client";

import React from "react";
import { Coins, HardDrive, Zap, Info } from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import {
  estimateTokens,
  calculateEstimatedCost,
  MODEL_CATALOG,
} from "@/lib/tokenEstimator";
import { interpolateTemplate } from "@/lib/variableParser";

export function TokenCostCounter() {
  const { draftPrompt, variableValues } = useStudio();

  const modelKey = draftPrompt.modelConfig.model;
  const modelInfo = MODEL_CATALOG[modelKey] || MODEL_CATALOG["gpt-4o"];

  // Compute interpolated text
  const fullUser = interpolateTemplate(draftPrompt.userPrompt, variableValues);
  const fullSystem = interpolateTemplate(draftPrompt.systemPrompt, variableValues);
  const fullAssistant = interpolateTemplate(draftPrompt.assistantPrompt, variableValues);

  const inputTokens =
    estimateTokens(fullSystem) +
    estimateTokens(fullUser) +
    estimateTokens(fullAssistant);

  const maxOutputTokens = draftPrompt.modelConfig.maxTokens || 1024;
  const costProjection = calculateEstimatedCost(inputTokens, maxOutputTokens, modelKey);

  // Context window percentage
  const maxContext = modelInfo.maxContext;
  const contextPercent = Math.min(100, Math.max(0.1, (inputTokens / maxContext) * 100));

  // Cost per 1,000 requests
  const costPer1kRuns = (costProjection.totalCost * 1000).toFixed(3);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Token & Cost Estimation
          </h3>
        </div>
        <span className="text-[11px] font-mono text-indigo-300">
          {modelInfo.modelName}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Input Tokens */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Input Tokens
          </span>
          <span className="text-base font-semibold font-mono text-slate-100">
            {inputTokens.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            ~{(inputTokens * 3.8).toFixed(0)} chars
          </span>
        </div>

        {/* Max Output */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Max Output
          </span>
          <span className="text-base font-semibold font-mono text-slate-100">
            {maxOutputTokens.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            tokens budget
          </span>
        </div>

        {/* Single Run Cost */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Est. Cost / Run
          </span>
          <span className="text-base font-semibold font-mono text-emerald-400">
            {costProjection.formattedTotal}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            at max budget
          </span>
        </div>

        {/* 1,000 Runs Projection */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Cost / 1K Runs
          </span>
          <span className="text-base font-semibold font-mono text-emerald-400">
            ${costPer1kRuns}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            1,000 invocations
          </span>
        </div>
      </div>

      {/* Context Window Usage Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>Context Window Capacity</span>
          </div>
          <span className="font-mono text-slate-300">
            {inputTokens.toLocaleString()} / {maxContext.toLocaleString()} tokens (
            {contextPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              contextPercent > 80
                ? "bg-rose-500"
                : contextPercent > 50
                ? "bg-amber-500"
                : "bg-indigo-500"
            }`}
            style={{ width: `${Math.max(1, contextPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
