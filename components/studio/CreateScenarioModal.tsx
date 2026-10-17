"use client";

import React, { useState } from "react";
import { Plus, Upload, Check, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStudio } from "@/context/StudioContext";

interface CreateScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateScenarioModal({ isOpen, onClose }: CreateScenarioModalProps) {
  const { detectedVariables, createScenario, activePrompt, addToast } = useStudio();

  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [name, setName] = useState("");
  const [inputVariables, setInputVariables] = useState<Record<string, string>>({});
  const [expectedKeywords, setExpectedKeywords] = useState("");
  const [forbiddenKeywords, setForbiddenKeywords] = useState("");
  const [maxTokenLimit, setMaxTokenLimit] = useState<string>("500");
  const [bulkJson, setBulkJson] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize variable keys from detected variables
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      const initialVars: Record<string, string> = {};
      for (const v of detectedVariables) {
        initialVars[v] = "";
      }
      setInputVariables(initialVars);
      setExpectedKeywords("");
      setForbiddenKeywords("");
      setMaxTokenLimit("500");
      setBulkJson("");
      setError(null);
    }
  }, [isOpen, detectedVariables]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Scenario Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parsedExpected = expectedKeywords
      ? expectedKeywords.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const parsedForbidden = forbiddenKeywords
      ? forbiddenKeywords.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const success = await createScenario({
      name: name.trim(),
      inputVariables,
      expectedKeywords: parsedExpected.length > 0 ? parsedExpected : undefined,
      forbiddenKeywords: parsedForbidden.length > 0 ? parsedForbidden : undefined,
      maxTokenLimit: maxTokenLimit ? parseInt(maxTokenLimit) : undefined,
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkJson.trim()) {
      setError("Please paste a JSON array of test scenarios.");
      return;
    }

    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        setError("Root element must be a JSON array: [ { name, inputVariables, ... } ]");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      // Post bulk
      const payload = parsed.map((item) => ({
        promptId: activePrompt?.id,
        name: item.name || "Imported Scenario",
        inputVariables: item.inputVariables || item.variables || {},
        expectedKeywords: item.expectedKeywords || item.expected || [],
        forbiddenKeywords: item.forbiddenKeywords || item.forbidden || [],
        maxTokenLimit: item.maxTokenLimit ? Number(item.maxTokenLimit) : null,
      }));

      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to import scenarios");
      }

      addToast({
        type: "success",
        title: "Bulk Import Successful",
        description: `Imported ${json.data.length} test scenario(s) into matrix.`,
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(`JSON Parsing Error: ${err.message}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Test Scenario"
      description="Create an evaluation edge-case with inputs and assertion rules."
      maxWidth="lg"
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab("single")}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            tab === "single"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Single Scenario Form
        </button>
        <button
          type="button"
          onClick={() => setTab("bulk")}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            tab === "bulk"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Bulk Import JSON
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
          {error}
        </div>
      )}

      {tab === "single" ? (
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <Input
            label="Scenario Name *"
            placeholder="e.g. VIP Enterprise Customer Refund Request"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            required
            autoFocus
          />

          {/* Dynamic Variable Inputs */}
          {detectedVariables.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Scenario Parameter Inputs
              </span>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {detectedVariables.map((v) => (
                  <div key={v} className="space-y-1">
                    <label className="text-[11px] font-mono text-indigo-300">
                      {`{{${v}}}`}
                    </label>
                    <input
                      type="text"
                      placeholder={`Input for ${v}...`}
                      value={inputVariables[v] || ""}
                      onChange={(e) =>
                        setInputVariables((prev) => ({
                          ...prev,
                          [v]: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assertion Rules */}
          <div className="space-y-3 pt-1 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Assertion Rules
            </span>

            <Input
              label="Expected Keywords (comma-separated)"
              placeholder="e.g. priority, refund_eligible, approved"
              value={expectedKeywords}
              onChange={(e) => setExpectedKeywords(e.target.value)}
              helperText="Assertions will verify the model completion contains all specified keywords."
            />

            <Input
              label="Forbidden Keywords (comma-separated)"
              placeholder="e.g. unauthorized, fatal error, cannot assist"
              value={forbiddenKeywords}
              onChange={(e) => setForbiddenKeywords(e.target.value)}
              helperText="Assertions will fail if any of these keywords appear in output."
            />

            <Input
              label="Max Output Token Limit"
              type="number"
              min="50"
              max="4000"
              placeholder="e.g. 500"
              value={maxTokenLimit}
              onChange={(e) => setMaxTokenLimit(e.target.value)}
            />
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
              Add Scenario
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Paste JSON Array of Scenarios:
            </label>
            <textarea
              rows={9}
              value={bulkJson}
              onChange={(e) => {
                setBulkJson(e.target.value);
                setError(null);
              }}
              placeholder={`[
  {
    "name": "Enterprise Critical Alert",
    "inputVariables": { "customer_query": "DB down", "user_tier": "Enterprise" },
    "expectedKeywords": ["priority", "escalate"],
    "forbiddenKeywords": ["unauthorized"],
    "maxTokenLimit": 500
  }
]`}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
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
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Import Scenarios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
