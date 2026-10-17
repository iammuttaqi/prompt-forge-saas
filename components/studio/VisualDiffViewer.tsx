"use client";

import React, { useState, useMemo } from "react";
import { GitCompare, Plus, Minus, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import { comparePromptVersions, DiffPart } from "@/lib/diffEngine";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function VisualDiffViewer() {
  const { activePrompt, promoteVersion, addToast } = useStudio();
  const versions = activePrompt?.versions || [];

  const [baseVersionId, setBaseVersionId] = useState<string>(() => {
    return versions.length > 1 ? versions[1].id : versions[0]?.id || "";
  });

  const [targetVersionId, setTargetVersionId] = useState<string>(() => {
    return versions[0]?.id || "";
  });

  const [isPromoting, setIsPromoting] = useState(false);

  const baseVersion = useMemo(
    () => versions.find((v) => v.id === baseVersionId),
    [versions, baseVersionId]
  );

  const targetVersion = useMemo(
    () => versions.find((v) => v.id === targetVersionId),
    [versions, targetVersionId]
  );

  const diffResult = useMemo(() => {
    if (!baseVersion || !targetVersion) return null;

    return comparePromptVersions(
      {
        systemPrompt: baseVersion.systemPrompt,
        userPrompt: baseVersion.userPrompt,
        assistantPrompt: baseVersion.assistantPrompt,
        variables: baseVersion.variables,
      },
      {
        systemPrompt: targetVersion.systemPrompt,
        userPrompt: targetVersion.userPrompt,
        assistantPrompt: targetVersion.assistantPrompt,
        variables: targetVersion.variables,
      }
    );
  }, [baseVersion, targetVersion]);

  const handlePromoteTarget = async () => {
    if (!targetVersion) return;
    setIsPromoting(true);
    await promoteVersion(targetVersion.id);
    setIsPromoting(false);
  };

  if (versions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No committed versions available yet to compare. Create your first snapshot commit to enable visual diffing.
      </div>
    );
  }

  const renderDiffSpans = (parts: DiffPart[]) => {
    return parts.map((part, idx) => {
      if (part.type === "added") {
        return (
          <span key={idx} className="diff-added px-0.5 rounded font-mono">
            {part.value}
          </span>
        );
      }
      if (part.type === "removed") {
        return (
          <span key={idx} className="diff-removed px-0.5 rounded font-mono">
            {part.value}
          </span>
        );
      }
      return (
        <span key={idx} className="diff-unchanged">
          {part.value}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Version Comparison Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <GitCompare className="w-5 h-5 text-indigo-400" />
          
          {/* Base Version */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Base:</span>
            <select
              value={baseVersionId}
              onChange={(e) => setBaseVersionId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag} {v.isProduction ? "★ [Prod]" : ""}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500" />

          {/* Compare Target Version */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Compare with:</span>
            <select
              value={targetVersionId}
              onChange={(e) => setTargetVersionId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag} {v.isProduction ? "★ [Prod]" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Metrics & Promote Action */}
        <div className="flex items-center gap-3">
          {diffResult && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                <Plus className="w-3 h-3" />
                {diffResult.metrics.additions} additions
              </span>
              <span className="flex items-center gap-0.5 text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded">
                <Minus className="w-3 h-3" />
                {diffResult.metrics.deletions} deletions
              </span>
            </div>
          )}

          {targetVersion && !targetVersion.isProduction && (
            <Button
              variant="success"
              size="sm"
              onClick={handlePromoteTarget}
              isLoading={isPromoting}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Promote {targetVersion.versionTag} to Production
            </Button>
          )}

          {targetVersion?.isProduction && (
            <Badge variant="production" dot>
              Active Production Release
            </Badge>
          )}
        </div>
      </div>

      {/* Parameter Schema Diff Notice */}
      {diffResult &&
        (diffResult.variableDiff.added.length > 0 ||
          diffResult.variableDiff.removed.length > 0) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Parameter Schema Changes:
            </span>
            {diffResult.variableDiff.added.map((v) => (
              <span
                key={v}
                className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono px-2 py-0.5 rounded"
              >
                + {`{{${v}}}`} (Added)
              </span>
            ))}
            {diffResult.variableDiff.removed.map((v) => (
              <span
                key={v}
                className="bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono px-2 py-0.5 rounded line-through"
              >
                - {`{{${v}}}`} (Removed)
              </span>
            ))}
          </div>
        )}

      {/* Diff Blocks */}
      {diffResult && (
        <div className="space-y-4">
          {/* User Prompt Diff */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                User Template Diff
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Comparing {baseVersion?.versionTag} → {targetVersion?.versionTag}
              </span>
            </div>
            <div className="p-4 bg-slate-950/80 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {renderDiffSpans(diffResult.userDiff)}
            </div>
          </div>

          {/* System Prompt Diff */}
          {(baseVersion?.systemPrompt || targetVersion?.systemPrompt) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  System Instructions Diff
                </span>
              </div>
              <div className="p-4 bg-slate-950/80 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {renderDiffSpans(diffResult.systemDiff)}
              </div>
            </div>
          )}

          {/* Assistant Preamble Diff */}
          {(baseVersion?.assistantPrompt || targetVersion?.assistantPrompt) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Assistant Preamble Diff
                </span>
              </div>
              <div className="p-4 bg-slate-950/80 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {renderDiffSpans(diffResult.assistantDiff)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
