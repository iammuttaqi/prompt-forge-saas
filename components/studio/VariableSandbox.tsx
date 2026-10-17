"use client";

import React from "react";
import { Variable, RefreshCw, BookmarkCheck, AlertCircle } from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import { Button } from "@/components/ui/Button";

export function VariableSandbox() {
  const {
    detectedVariables,
    variableValues,
    setVariableValue,
    setAllVariableValues,
    resetVariableValues,
    testScenarios,
    addToast,
  } = useStudio();

  const handleApplyPreset = (scenarioId: string) => {
    const sc = testScenarios.find((s) => s.id === scenarioId);
    if (!sc) return;

    try {
      const parsed = JSON.parse(sc.inputVariables);
      setAllVariableValues(parsed);
      addToast({
        type: "info",
        title: "Preset Loaded",
        description: `Loaded inputs from scenario: "${sc.name}"`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Dynamic Variables
          </h3>
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
            {detectedVariables.length} detected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {detectedVariables.length > 0 && (
            <button
              type="button"
              onClick={resetVariableValues}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="Clear all variable fields"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Selector */}
      {testScenarios.length > 0 && detectedVariables.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preset:</span>
          </div>
          <select
            onChange={(e) => {
              if (e.target.value) handleApplyPreset(e.target.value);
            }}
            defaultValue=""
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Select a Test Scenario...
            </option>
            {testScenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Variables List / Inputs */}
      <div className="p-4 overflow-y-auto space-y-3.5 flex-1 max-h-[380px]">
        {detectedVariables.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">No dynamic variables detected.</p>
            <p className="text-[11px] leading-relaxed">
              Add parameters like <code className="text-indigo-400">{"{{user_name}}"}</code> or{" "}
              <code className="text-indigo-400">{"{{query}}"}</code> to the prompt canvas to generate
              live input controls.
            </p>
          </div>
        ) : (
          detectedVariables.map((varName) => {
            const val = variableValues[varName] || "";
            return (
              <div key={varName} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`var_${varName}`}
                    className="font-mono text-xs font-semibold text-indigo-300 flex items-center gap-1"
                  >
                    <span>{`{{${varName}}}`}</span>
                  </label>
                  {val ? (
                    <span className="text-[10px] text-emerald-400 font-mono">populated</span>
                  ) : (
                    <span className="text-[10px] text-amber-400/80 font-mono">unfilled</span>
                  )}
                </div>

                {val.length > 60 || val.includes("\n") ? (
                  <textarea
                    id={`var_${varName}`}
                    rows={3}
                    value={val}
                    onChange={(e) => setVariableValue(varName, e.target.value)}
                    placeholder={`Value for ${varName}...`}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                  />
                ) : (
                  <input
                    id={`var_${varName}`}
                    type="text"
                    value={val}
                    onChange={(e) => setVariableValue(varName, e.target.value)}
                    placeholder={`Enter ${varName}...`}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
