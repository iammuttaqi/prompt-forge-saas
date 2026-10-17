"use client";

import React from "react";
import { Sliders, Cpu, Zap } from "lucide-react";
import { RoleEditorBlock } from "./RoleEditorBlock";
import { useStudio } from "@/context/StudioContext";
import { MODEL_CATALOG } from "@/lib/tokenEstimator";

export function PromptCanvas() {
  const { draftPrompt, updateDraft, activePrompt } = useStudio();

  return (
    <div className="space-y-4">
      {/* Model Hyperparameter Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Model Configuration
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Target Model Selector */}
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Model:</span>
            <select
              value={draftPrompt.modelConfig.model}
              onChange={(e) =>
                updateDraft("modelConfig", {
                  ...draftPrompt.modelConfig,
                  model: e.target.value,
                })
              }
              className="bg-slate-950 border border-slate-700 text-slate-100 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            >
              {Object.entries(MODEL_CATALOG).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.modelName} ({info.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Temp:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={draftPrompt.modelConfig.temperature}
              onChange={(e) =>
                updateDraft("modelConfig", {
                  ...draftPrompt.modelConfig,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-20 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-300 w-8">
              {draftPrompt.modelConfig.temperature.toFixed(2)}
            </span>
          </div>

          {/* Max Tokens */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Max Tokens:</span>
            <input
              type="number"
              min="128"
              max="8192"
              step="128"
              value={draftPrompt.modelConfig.maxTokens}
              onChange={(e) =>
                updateDraft("modelConfig", {
                  ...draftPrompt.modelConfig,
                  maxTokens: parseInt(e.target.value) || 1024,
                })
              }
              className="w-16 bg-slate-950 border border-slate-700 text-slate-100 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
            />
          </div>
        </div>
      </div>

      {/* Role Editors */}
      <RoleEditorBlock
        role="system"
        title="System Instructions"
        description="Persona, core operational rules, and behavioural constraints for the model."
        value={draftPrompt.systemPrompt}
        onChange={(val) => updateDraft("systemPrompt", val)}
        placeholder="e.g. You are an expert code reviewer with deep knowledge of TypeScript..."
        defaultOpen={true}
        canDisable={true}
        minHeight="min-h-[100px]"
      />

      <RoleEditorBlock
        role="user"
        title="User Message Template"
        description="Dynamic template evaluated with parameters using {{variable_name}} syntax."
        value={draftPrompt.userPrompt}
        onChange={(val) => updateDraft("userPrompt", val)}
        placeholder="e.g. Analyze the customer sentiment for review: {{customer_review}}"
        defaultOpen={true}
        canDisable={false}
        minHeight="min-h-[160px]"
      />

      <RoleEditorBlock
        role="assistant"
        title="Assistant Few-Shot Preamble (Optional)"
        description="Prefilled assistant response or few-shot demonstration prefix."
        value={draftPrompt.assistantPrompt}
        onChange={(val) => updateDraft("assistantPrompt", val)}
        placeholder='e.g. {"status": "analyzed", "sentiment": "positive"}'
        defaultOpen={Boolean(draftPrompt.assistantPrompt)}
        canDisable={true}
        minHeight="min-h-[90px]"
      />
    </div>
  );
}
