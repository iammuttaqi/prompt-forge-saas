"use client";

import React, { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStudio } from "@/context/StudioContext";

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePromptModal({ isOpen, onClose }: CreatePromptModalProps) {
  const { createNewPrompt } = useStudio();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !userPrompt.trim()) {
      setError("Title and User Message Template are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const promptId = await createNewPrompt({
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      systemPrompt: systemPrompt.trim() || undefined,
      userPrompt: userPrompt.trim(),
    });

    setIsSubmitting(false);
    if (promptId) {
      setTitle("");
      setSlug("");
      setDescription("");
      setSystemPrompt("");
      setUserPrompt("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Prompt"
      description="Initialize a new canonical prompt asset with an initial v1.0.0 snapshot."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
            {error}
          </div>
        )}

        <Input
          label="Prompt Title *"
          placeholder="e.g. Email Outreach Copywriter"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          required
          autoFocus
        />

        <Input
          label="URL Slug (Optional)"
          placeholder="e.g. email-outreach-copywriter"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Unique identifier for REST API queries. Generated automatically if blank."
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. Generates cold sales emails tailored to user industry and tone"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            System Instructions (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. You are an expert B2B copywriter..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            User Message Template *
          </label>
          <textarea
            rows={4}
            placeholder="e.g. Write a cold outreach email to {{prospect_name}} at {{company_name}} regarding {{value_proposition}}."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-400">
            Use <code className="text-indigo-400 font-mono">{"{{var}}"}</code> syntax for parameters.
          </p>
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
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Prompt
          </Button>
        </div>
      </form>
    </Modal>
  );
}
