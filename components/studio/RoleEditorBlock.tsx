"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { estimateTokens } from "@/lib/tokenEstimator";
import { cn } from "@/lib/utils";

interface RoleEditorBlockProps {
  role: "system" | "user" | "assistant";
  title: string;
  description: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  defaultOpen?: boolean;
  canDisable?: boolean;
  minHeight?: string;
}

export function RoleEditorBlock({
  role,
  title,
  description,
  value,
  onChange,
  placeholder,
  defaultOpen = true,
  canDisable = false,
  minHeight = "min-h-[140px]",
}: RoleEditorBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const roleBadgeVariants = {
    system: "role-system" as const,
    user: "role-user" as const,
    assistant: "role-assistant" as const,
  };

  const tokenCount = estimateTokens(value);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-slate-800/80">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
          )}
          <Badge variant={roleBadgeVariants[role]} size="sm">
            {role}
          </Badge>
          <span className="text-sm font-semibold text-slate-200">{title}</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            {tokenCount} <span className="text-slate-500">tokens</span>
          </span>

          {canDisable && value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      {isOpen && (
        <div className="p-4 space-y-2">
          <p className="text-xs text-slate-400">{description}</p>
          <div className="relative">
            <textarea
              rows={Math.max(4, Math.min(14, (value.split("\n").length || 1) + 2))}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y leading-relaxed",
                minHeight
              )}
              spellCheck={false}
            />
            {role === "user" && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Tip: Use <code className="text-indigo-400 font-mono">{"{{variable_name}}"}</code> to define dynamic parameters.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
