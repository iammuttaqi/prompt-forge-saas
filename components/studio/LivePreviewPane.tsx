"use client";

import React, { useState } from "react";
import { Eye, Copy, Check, MessageSquare } from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import { parseTemplateSegments, interpolateTemplate } from "@/lib/variableParser";
import { estimateTokens } from "@/lib/tokenEstimator";
import { Badge } from "@/components/ui/Badge";

export function LivePreviewPane() {
  const { draftPrompt, variableValues, addToast } = useStudio();
  const [viewMode, setViewMode] = useState<"user" | "full">("user");
  const [copied, setCopied] = useState(false);

  const userSegments = parseTemplateSegments(draftPrompt.userPrompt, variableValues);

  const fullCompiledUser = interpolateTemplate(draftPrompt.userPrompt, variableValues);
  const fullCompiledSystem = interpolateTemplate(draftPrompt.systemPrompt, variableValues);
  const fullCompiledAssistant = interpolateTemplate(draftPrompt.assistantPrompt, variableValues);

  const fullPromptText = `${
    fullCompiledSystem ? `[SYSTEM]:\n${fullCompiledSystem}\n\n` : ""
  }[USER]:\n${fullCompiledUser}${
    fullCompiledAssistant ? `\n\n[ASSISTANT]:\n${fullCompiledAssistant}` : ""
  }`;

  const currentPreviewTokens =
    viewMode === "user"
      ? estimateTokens(fullCompiledUser)
      : estimateTokens(fullPromptText);

  const handleCopy = () => {
    const textToCopy = viewMode === "user" ? fullCompiledUser : fullPromptText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    addToast({
      type: "success",
      title: "Copied to Clipboard",
      description: "Interpolated prompt copied.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Interpolated Preview
          </h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            {currentPreviewTokens} tokens
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode("user")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                viewMode === "user"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              User Only
            </button>
            <button
              type="button"
              onClick={() => setViewMode("full")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                viewMode === "full"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Full Payload
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
            title="Copy compiled prompt text"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4 overflow-y-auto flex-1 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/70 whitespace-pre-wrap max-h-[380px]">
        {viewMode === "user" ? (
          <div>
            {userSegments.map((segment, index) => {
              if (segment.type === "text") {
                return <span key={index}>{segment.text}</span>;
              }

              if (segment.isFilled) {
                return (
                  <span
                    key={index}
                    className="var-highlight mx-0.5 transition-all shadow-sm"
                    title={`Interpolated from {{${segment.varName}}}`}
                  >
                    {segment.text}
                  </span>
                );
              }

              return (
                <span
                  key={index}
                  className="var-highlight-unfilled mx-0.5 transition-all"
                  title={`Unfilled parameter: {{${segment.varName}}}`}
                >
                  {segment.text}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {fullCompiledSystem && (
              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-lg">
                <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">
                  System Instructions
                </div>
                <div className="text-slate-300">{fullCompiledSystem}</div>
              </div>
            )}

            <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg">
              <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">
                User Message
              </div>
              <div>
                {userSegments.map((segment, index) => {
                  if (segment.type === "text") {
                    return <span key={index}>{segment.text}</span>;
                  }
                  if (segment.isFilled) {
                    return (
                      <span key={index} className="var-highlight mx-0.5">
                        {segment.text}
                      </span>
                    );
                  }
                  return (
                    <span key={index} className="var-highlight-unfilled mx-0.5">
                      {segment.text}
                    </span>
                  );
                })}
              </div>
            </div>

            {fullCompiledAssistant && (
              <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-lg">
                <div className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider mb-1">
                  Assistant Preamble
                </div>
                <div className="text-slate-300">{fullCompiledAssistant}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
