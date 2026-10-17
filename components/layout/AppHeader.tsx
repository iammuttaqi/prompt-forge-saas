"use client";

import React, { useState } from "react";
import {
  Boxes,
  ChevronDown,
  GitCommit,
  Plus,
  ShieldCheck,
  Sparkles,
  Database,
  Trash2,
} from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VersionSnapshotModal } from "@/components/studio/VersionSnapshotModal";
import { CreatePromptModal } from "@/components/studio/CreatePromptModal";

export function AppHeader() {
  const {
    prompts,
    activePrompt,
    activeVersion,
    selectPrompt,
    selectVersion,
    isDraftDirty,
    deleteActivePrompt,
  } = useStudio();

  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [isNewPromptOpen, setIsNewPromptOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Prompt Selector */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                PromptForge
              </span>
              <span className="text-[10px] font-semibold text-indigo-400 block -mt-1 tracking-wider uppercase">
                Studio
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Prompt Selector Dropdown */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <select
                value={activePrompt?.id || ""}
                onChange={(e) => {
                  if (e.target.value) selectPrompt(e.target.value);
                }}
                className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px] sm:max-w-[280px] truncate"
              >
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsNewPromptOpen(true)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              title="Create new prompt"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Active Version Selector */}
          {activePrompt && activePrompt.versions && activePrompt.versions.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-slate-400">Version:</span>
              <select
                value={activeVersion?.id || ""}
                onChange={(e) => selectVersion(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {activePrompt.versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    {ver.versionTag} {ver.isProduction ? "★ [Prod]" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Production Release Badge */}
          {activeVersion?.isProduction ? (
            <div className="hidden sm:block">
              <Badge variant="production" size="sm" dot>
                Production Release
              </Badge>
            </div>
          ) : (
            <div className="hidden sm:block">
              <Badge variant="draft" size="sm">
                Working Draft
              </Badge>
            </div>
          )}

          {/* Save Snapshot CTA */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSnapshotOpen(true)}
            leftIcon={<GitCommit className="w-4 h-4" />}
            className="relative"
          >
            <span>Save Snapshot</span>
            {isDraftDirty && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-950 animate-pulse"
                title="Unsaved changes in prompt draft"
              />
            )}
          </Button>
        </div>
      </div>

      {/* Snapshot Commit Modal */}
      <VersionSnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
      />

      {/* New Prompt Modal */}
      <CreatePromptModal
        isOpen={isNewPromptOpen}
        onClose={() => setIsNewPromptOpen(false)}
      />
    </header>
  );
}
