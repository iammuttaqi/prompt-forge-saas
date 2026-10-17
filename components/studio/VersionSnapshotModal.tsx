"use client";

import React, { useState, useEffect } from "react";
import { GitCommit, Tag, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStudio } from "@/context/StudioContext";

interface VersionSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionSnapshotModal({ isOpen, onClose }: VersionSnapshotModalProps) {
  const { activePrompt, activeVersion, commitSnapshot } = useStudio();
  const [versionTag, setVersionTag] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isProduction, setIsProduction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggest next version tag when opened
  useEffect(() => {
    if (isOpen && activePrompt?.versions && activePrompt.versions.length > 0) {
      const latestTag = activePrompt.versions[0].versionTag;
      const match = latestTag.match(/^v?(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        const patch = parseInt(match[3]);
        setVersionTag(`v${major}.${minor + 1}.0`);
      } else {
        setVersionTag("v1.1.0");
      }
      setCommitMessage("");
      setError(null);
    } else if (isOpen) {
      setVersionTag("v1.0.0");
      setCommitMessage("Initial commit");
      setError(null);
    }
  }, [isOpen, activePrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTag.trim()) {
      setError("Version tag is required (e.g., v1.1.0)");
      return;
    }

    // Check existing tags locally
    if (
      activePrompt?.versions?.some(
        (v) => v.versionTag.toLowerCase() === versionTag.trim().toLowerCase()
      )
    ) {
      setError(`Version tag '${versionTag.trim()}' already exists for this prompt.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const success = await commitSnapshot({
      versionTag: versionTag.trim(),
      commitMessage: commitMessage.trim() || undefined,
      isProduction,
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Version Snapshot"
      description="Commit an immutable snapshot of the current prompt draft to SQLite."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
            {error}
          </div>
        )}

        <Input
          label="Semantic Version Tag *"
          placeholder="e.g. v1.2.0"
          value={versionTag}
          onChange={(e) => {
            setVersionTag(e.target.value);
            setError(null);
          }}
          helperText="Use semantic versioning: v[MAJOR].[MINOR].[PATCH]"
          leftIcon={<Tag className="w-4 h-4" />}
          autoFocus
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Commit Message / Changelog
          </label>
          <textarea
            rows={3}
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="e.g. Tightened output format to strict JSON and added user tier conditioning"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="promoteCheckbox"
            checked={isProduction}
            onChange={(e) => setIsProduction(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <label
            htmlFor="promoteCheckbox"
            className="text-xs text-slate-200 select-none cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Immediately promote this snapshot to Production</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<GitCommit className="w-4 h-4" />}
          >
            Commit Snapshot
          </Button>
        </div>
      </form>
    </Modal>
  );
}
