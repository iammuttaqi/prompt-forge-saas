"use client";

import React, { useState } from "react";
import { History, GitCommit, ShieldCheck, ArrowUpRight, RotateCcw } from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export function VersionHistoryDrawer() {
  const {
    activePrompt,
    activeVersion,
    selectVersion,
    promoteVersion,
    setActiveTab,
  } = useStudio();

  const [promotingId, setPromotingId] = useState<string | null>(null);
  const versions = activePrompt?.versions || [];

  const handlePromote = async (versionId: string) => {
    setPromotingId(versionId);
    await promoteVersion(versionId);
    setPromotingId(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Version History & Snapshots
          </h3>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            {versions.length} commits
          </span>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={() => setActiveTab("diff")}
          leftIcon={<ArrowUpRight className="w-3 h-3" />}
        >
          Open Visual Diff
        </Button>
      </div>

      <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
        {versions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No versions committed yet. Use the "Save Snapshot" button to create your first version commit.
          </div>
        ) : (
          versions.map((ver) => {
            const isCurrentSelected = activeVersion?.id === ver.id;
            let parsedVars: string[] = [];
            if (ver.variables) {
              try {
                parsedVars = JSON.parse(ver.variables);
              } catch {}
            }

            return (
              <div
                key={ver.id}
                className={`p-4 transition-colors ${
                  isCurrentSelected ? "bg-slate-800/40" : "hover:bg-slate-800/20"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-indigo-300 flex items-center gap-1">
                        <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                        {ver.versionTag}
                      </span>

                      {ver.isProduction && (
                        <Badge variant="production" size="sm" dot>
                          Production
                        </Badge>
                      )}

                      {isCurrentSelected && (
                        <Badge variant="neutral" size="sm">
                          Active in Editor
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 leading-snug">
                      {ver.commitMessage || "No commit description provided."}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Committed {formatDate(ver.createdAt)}</span>
                      {parsedVars.length > 0 && (
                        <span>
                          • {parsedVars.length} parameter{parsedVars.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isCurrentSelected && (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => selectVersion(ver.id)}
                        leftIcon={<RotateCcw className="w-3 h-3" />}
                      >
                        Load Draft
                      </Button>
                    )}

                    {!ver.isProduction && (
                      <Button
                        variant="success"
                        size="xs"
                        onClick={() => handlePromote(ver.id)}
                        isLoading={promotingId === ver.id}
                        leftIcon={<ShieldCheck className="w-3 h-3" />}
                      >
                        Promote to Production
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
