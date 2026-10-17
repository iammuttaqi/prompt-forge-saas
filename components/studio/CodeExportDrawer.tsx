"use client";

import React, { useState } from "react";
import { Code, Copy, Check, Terminal, ExternalLink } from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import {
  generateTypeScriptSnippet,
  generatePythonSnippet,
  generateCurlSnippet,
  generateDynamicApiSnippet,
} from "@/lib/codeGenerators";
import { Button } from "@/components/ui/Button";

export function CodeExportDrawer() {
  const { activePrompt, draftPrompt, detectedVariables, variableValues, addToast } = useStudio();
  const [activeLang, setActiveLang] = useState<"ts" | "py" | "curl" | "api">("ts");
  const [copied, setCopied] = useState(false);

  const options = {
    title: activePrompt?.title || "Prompt",
    slug: activePrompt?.slug || "active-prompt",
    systemPrompt: draftPrompt.systemPrompt,
    userPrompt: draftPrompt.userPrompt,
    assistantPrompt: draftPrompt.assistantPrompt,
    modelConfig: draftPrompt.modelConfig,
    variables: detectedVariables,
    sampleValues: variableValues,
  };

  let codeSnippet = "";
  if (activeLang === "ts") codeSnippet = generateTypeScriptSnippet(options);
  else if (activeLang === "py") codeSnippet = generatePythonSnippet(options);
  else if (activeLang === "curl") codeSnippet = generateCurlSnippet(options);
  else if (activeLang === "api") codeSnippet = generateDynamicApiSnippet(options);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    addToast({
      type: "success",
      title: "Copied to Clipboard",
      description: "Code integration snippet ready to paste.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Copy Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Integration Code Export
            </h3>
            <p className="text-xs text-slate-400">
              Type-safe SDK snippets and dynamic REST API endpoints for downstream apps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveLang("ts")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLang === "ts"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              TypeScript (OpenAI)
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("py")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLang === "py"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Python
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("curl")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLang === "curl"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("api")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLang === "api"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dynamic REST API
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCopy}
            leftIcon={
              copied ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
          >
            {copied ? "Copied!" : "Copy Code"}
          </Button>
        </div>
      </div>

      {/* Code Display Pane */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>
            {activeLang === "ts" && "sdk/promptClient.ts"}
            {activeLang === "py" && "services/prompt_service.py"}
            {activeLang === "curl" && "terminal_command.sh"}
            {activeLang === "api" && "lib/fetchPrompt.ts"}
          </span>
          <span>UTF-8</span>
        </div>
        <pre className="p-4 bg-slate-950 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto leading-relaxed">
          <code>{codeSnippet}</code>
        </pre>
      </div>

      {/* Dynamic API Info Callout */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Direct REST Endpoint:</span>
          </div>
          <code className="text-indigo-300 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 block sm:inline-block">
            GET /api/prompts/{activePrompt?.slug || ":slug"}/production
          </code>
        </div>
        <p className="text-slate-400 text-xs max-w-md">
          Downstream microservices can query this endpoint to receive the active production prompt template dynamically with zero deploy downtime.
        </p>
      </div>
    </div>
  );
}
