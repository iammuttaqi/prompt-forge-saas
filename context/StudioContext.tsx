"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Prompt, PromptVersion, PromptSummary, ModelConfig } from "@/types/prompt";
import { TestScenario } from "@/types/scenario";
import { EvaluationRunResult, EvaluationBatchSummary } from "@/types/evaluation";
import { ToastMessage } from "@/components/ui/Toast";
import { extractVariables } from "@/lib/variableParser";

interface StudioContextType {
  prompts: PromptSummary[];
  activePrompt: Prompt | null;
  activeVersion: PromptVersion | null;
  draftPrompt: {
    systemPrompt: string;
    userPrompt: string;
    assistantPrompt: string;
    modelConfig: ModelConfig;
  };
  isDraftDirty: boolean;
  detectedVariables: string[];
  variableValues: Record<string, string>;
  activeTab: "canvas" | "diff" | "tests" | "export";
  testScenarios: TestScenario[];
  evaluationResults: EvaluationRunResult[];
  lastBatchSummary: EvaluationBatchSummary | null;
  isEvaluating: boolean;
  isLoading: boolean;
  toasts: ToastMessage[];

  // Actions
  setActiveTab: (tab: "canvas" | "diff" | "tests" | "export") => void;
  loadPrompts: () => Promise<void>;
  selectPrompt: (id: string) => Promise<void>;
  selectVersion: (versionId: string) => void;
  updateDraft: (field: "systemPrompt" | "userPrompt" | "assistantPrompt" | "modelConfig", value: any) => void;
  setVariableValue: (varName: string, value: string) => void;
  setAllVariableValues: (values: Record<string, string>) => void;
  resetVariableValues: () => void;
  commitSnapshot: (data: {
    versionTag: string;
    commitMessage?: string;
    isProduction?: boolean;
  }) => Promise<boolean>;
  promoteVersion: (versionId: string) => Promise<boolean>;
  runEvaluations: (scenarioIds?: string[]) => Promise<void>;
  createScenario: (data: {
    name: string;
    inputVariables: Record<string, string>;
    expectedKeywords?: string[];
    forbiddenKeywords?: string[];
    maxTokenLimit?: number;
  }) => Promise<boolean>;
  deleteScenario: (scenarioId: string) => Promise<boolean>;
  createNewPrompt: (data: {
    title: string;
    slug?: string;
    description?: string;
    systemPrompt?: string;
    userPrompt: string;
    assistantPrompt?: string;
    modelConfig?: ModelConfig;
  }) => Promise<string | null>;
  deleteActivePrompt: () => Promise<boolean>;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 1024,
};

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [prompts, setPrompts] = useState<PromptSummary[]>([]);
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
  const [draftPrompt, setDraftPrompt] = useState({
    systemPrompt: "",
    userPrompt: "",
    assistantPrompt: "",
    modelConfig: DEFAULT_MODEL_CONFIG,
  });
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"canvas" | "diff" | "tests" | "export">("canvas");
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationRunResult[]>([]);
  const [lastBatchSummary, setLastBatchSummary] = useState<EvaluationBatchSummary | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute detected dynamic variables from draft
  const detectedVariables = useMemo(() => {
    return extractVariables([
      draftPrompt.systemPrompt,
      draftPrompt.userPrompt,
      draftPrompt.assistantPrompt,
    ]);
  }, [draftPrompt.systemPrompt, draftPrompt.userPrompt, draftPrompt.assistantPrompt]);

  // Sync variable values whenever detected variables change
  useEffect(() => {
    setVariableValues((prev) => {
      const next: Record<string, string> = {};
      for (const v of detectedVariables) {
        next[v] = prev[v] !== undefined ? prev[v] : "";
      }
      return next;
    });
  }, [detectedVariables]);

  // Check if draft has unsaved changes compared to selected version
  const isDraftDirty = useMemo(() => {
    if (!activeVersion) return false;
    const sysMatch = (activeVersion.systemPrompt || "") === draftPrompt.systemPrompt;
    const userMatch = (activeVersion.userPrompt || "") === draftPrompt.userPrompt;
    const asstMatch = (activeVersion.assistantPrompt || "") === draftPrompt.assistantPrompt;
    return !sysMatch || !userMatch || !asstMatch;
  }, [activeVersion, draftPrompt]);

  // Load all prompts list
  const loadPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/prompts");
      const json = await res.json();
      if (json.success && json.data) {
        setPrompts(json.data);
        return json.data;
      }
    } catch (err) {
      console.error("Failed to load prompts:", err);
      addToast({
        type: "error",
        title: "Load Error",
        description: "Failed to load prompts from database.",
      });
    }
  }, [addToast]);

  // Select active prompt and populate state
  const selectPrompt = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/prompts/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          const prompt: Prompt = json.data;
          setActivePrompt(prompt);

          // Select active version (prioritizing activeVersionId or isProduction or newest)
          let targetVersion: PromptVersion | null = null;
          if (prompt.versions && prompt.versions.length > 0) {
            if (prompt.activeVersionId) {
              targetVersion =
                prompt.versions.find((v) => v.id === prompt.activeVersionId) || null;
            }
            if (!targetVersion) {
              targetVersion =
                prompt.versions.find((v) => v.isProduction) || prompt.versions[0];
            }
          }

          setActiveVersion(targetVersion);

          // Populate draft
          let cfg = DEFAULT_MODEL_CONFIG;
          if (targetVersion?.modelConfig) {
            try {
              cfg = JSON.parse(targetVersion.modelConfig);
            } catch {}
          }

          setDraftPrompt({
            systemPrompt: targetVersion?.systemPrompt || "",
            userPrompt: targetVersion?.userPrompt || "",
            assistantPrompt: targetVersion?.assistantPrompt || "",
            modelConfig: cfg,
          });

          // Populate scenarios
          const scens = prompt.testScenarios || [];
          setTestScenarios(scens);

          // Populate sample variable values from first scenario if available
          if (scens.length > 0) {
            try {
              const parsed = JSON.parse(scens[0].inputVariables);
              setVariableValues(parsed);
            } catch {}
          }

          // Clear previous evaluations
          setEvaluationResults([]);
          setLastBatchSummary(null);
        }
      } catch (err) {
        console.error("Failed to fetch prompt details:", err);
        addToast({
          type: "error",
          title: "Prompt Error",
          description: "Could not retrieve prompt details.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  // Switch between versions in the same prompt
  const selectVersion = useCallback(
    (versionId: string) => {
      if (!activePrompt) return;
      const target = activePrompt.versions.find((v) => v.id === versionId);
      if (!target) return;

      setActiveVersion(target);

      let cfg = DEFAULT_MODEL_CONFIG;
      if (target.modelConfig) {
        try {
          cfg = JSON.parse(target.modelConfig);
        } catch {}
      }

      setDraftPrompt({
        systemPrompt: target.systemPrompt || "",
        userPrompt: target.userPrompt || "",
        assistantPrompt: target.assistantPrompt || "",
        modelConfig: cfg,
      });

      addToast({
        type: "info",
        title: `Switched to ${target.versionTag}`,
        description: target.commitMessage || "Loaded snapshot into editor.",
      });
    },
    [activePrompt, addToast]
  );

  // Update a field in the prompt draft
  const updateDraft = useCallback(
    (field: "systemPrompt" | "userPrompt" | "assistantPrompt" | "modelConfig", value: any) => {
      setDraftPrompt((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Variable inputs
  const setVariableValue = useCallback((varName: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [varName]: value,
    }));
  }, []);

  const setAllVariableValues = useCallback((values: Record<string, string>) => {
    setVariableValues(values);
  }, []);

  const resetVariableValues = useCallback(() => {
    setVariableValues((prev) => {
      const reset: Record<string, string> = {};
      for (const k of Object.keys(prev)) {
        reset[k] = "";
      }
      return reset;
    });
  }, []);

  // Initial load
  useEffect(() => {
    loadPrompts().then((list) => {
      if (list && list.length > 0) {
        selectPrompt(list[0].id);
      } else {
        setIsLoading(false);
      }
    });
  }, [loadPrompts, selectPrompt]);

  // Commit snapshot
  const commitSnapshot = useCallback(
    async (data: {
      versionTag: string;
      commitMessage?: string;
      isProduction?: boolean;
    }) => {
      if (!activePrompt) return false;

      try {
        const payload = {
          versionTag: data.versionTag,
          commitMessage: data.commitMessage,
          systemPrompt: draftPrompt.systemPrompt,
          userPrompt: draftPrompt.userPrompt,
          assistantPrompt: draftPrompt.assistantPrompt,
          modelConfig: draftPrompt.modelConfig,
          isProduction: data.isProduction || false,
        };

        const res = await fetch(`/api/prompts/${activePrompt.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          addToast({
            type: "error",
            title: "Snapshot Failed",
            description: json.error?.message || "Failed to commit snapshot version.",
          });
          return false;
        }

        addToast({
          type: "success",
          title: `Snapshot ${data.versionTag} Committed!`,
          description: data.commitMessage || "New immutable version saved to database.",
        });

        // Reload prompt details
        await selectPrompt(activePrompt.id);
        await loadPrompts();
        return true;
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Commit Error",
          description: err.message || "Network error while saving snapshot.",
        });
        return false;
      }
    },
    [activePrompt, draftPrompt, selectPrompt, loadPrompts, addToast]
  );

  // Promote to production
  const promoteVersion = useCallback(
    async (versionId: string) => {
      if (!activePrompt) return false;

      try {
        const res = await fetch(`/api/prompts/${activePrompt.id}/promote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          addToast({
            type: "error",
            title: "Promotion Failed",
            description: json.error?.message || "Could not promote version.",
          });
          return false;
        }

        addToast({
          type: "success",
          title: "Promoted to Production!",
          description: `Version ${json.data.versionTag} is now serving live API requests.`,
        });

        await selectPrompt(activePrompt.id);
        await loadPrompts();
        return true;
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Promotion Error",
          description: err.message || "Failed to promote version.",
        });
        return false;
      }
    },
    [activePrompt, selectPrompt, loadPrompts, addToast]
  );

  // Run test evaluations
  const runEvaluations = useCallback(
    async (scenarioIds?: string[]) => {
      if (!activePrompt) return;

      const targetIds = scenarioIds || testScenarios.map((s) => s.id);
      if (targetIds.length === 0) {
        addToast({
          type: "error",
          title: "No Scenarios",
          description: "Please add at least one test scenario before running evals.",
        });
        return;
      }

      setIsEvaluating(true);
      try {
        const payload: any = {
          scenarioIds: targetIds,
        };

        if (activeVersion && !isDraftDirty) {
          payload.promptVersionId = activeVersion.id;
        } else {
          payload.promptDraft = {
            systemPrompt: draftPrompt.systemPrompt,
            userPrompt: draftPrompt.userPrompt,
            assistantPrompt: draftPrompt.assistantPrompt,
            modelConfig: draftPrompt.modelConfig,
          };
        }

        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          addToast({
            type: "error",
            title: "Evaluation Failed",
            description: json.error?.message || "Error running test evaluation suite.",
          });
          return;
        }

        setEvaluationResults(json.data.results);
        setLastBatchSummary(json.data.batchSummary);

        const { passed, total } = json.data.batchSummary;
        if (passed === total) {
          addToast({
            type: "success",
            title: `All ${total} Scenarios Passed!`,
            description: "No regression or assertion failures detected.",
          });
        } else {
          addToast({
            type: "error",
            title: `Evals: ${passed}/${total} Passed`,
            description: `${total - passed} scenario(s) failed assertions. Check the results tab.`,
          });
        }
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Execution Error",
          description: err.message || "Error executing test matrix runner.",
        });
      } finally {
        setIsEvaluating(false);
      }
    },
    [activePrompt, activeVersion, isDraftDirty, draftPrompt, testScenarios, addToast]
  );

  // Create test scenario
  const createScenario = useCallback(
    async (data: {
      name: string;
      inputVariables: Record<string, string>;
      expectedKeywords?: string[];
      forbiddenKeywords?: string[];
      maxTokenLimit?: number;
    }) => {
      if (!activePrompt) return false;

      try {
        const res = await fetch("/api/scenarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptId: activePrompt.id,
            name: data.name,
            inputVariables: data.inputVariables,
            expectedKeywords: data.expectedKeywords,
            forbiddenKeywords: data.forbiddenKeywords,
            maxTokenLimit: data.maxTokenLimit,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          addToast({
            type: "error",
            title: "Creation Failed",
            description: json.error?.message || "Failed to create scenario.",
          });
          return false;
        }

        addToast({
          type: "success",
          title: "Scenario Added",
          description: `Test scenario '${data.name}' saved to matrix.`,
        });

        await selectPrompt(activePrompt.id);
        return true;
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Error",
          description: err.message || "Failed to save scenario.",
        });
        return false;
      }
    },
    [activePrompt, selectPrompt, addToast]
  );

  // Delete test scenario
  const deleteScenario = useCallback(
    async (scenarioId: string) => {
      if (!activePrompt) return false;

      try {
        const res = await fetch(`/api/scenarios/${scenarioId}`, {
          method: "DELETE",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          addToast({
            type: "error",
            title: "Delete Failed",
            description: json.error?.message || "Failed to delete scenario.",
          });
          return false;
        }

        addToast({
          type: "info",
          title: "Scenario Deleted",
          description: "Removed from test matrix.",
        });

        await selectPrompt(activePrompt.id);
        return true;
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Error",
          description: err.message || "Failed to delete scenario.",
        });
        return false;
      }
    },
    [activePrompt, selectPrompt, addToast]
  );

  // Create new prompt container
  const createNewPrompt = useCallback(
    async (data: {
      title: string;
      slug?: string;
      description?: string;
      systemPrompt?: string;
      userPrompt: string;
      assistantPrompt?: string;
      modelConfig?: ModelConfig;
    }) => {
      try {
        const res = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          addToast({
            type: "error",
            title: "Creation Failed",
            description: json.error?.message || "Failed to create new prompt.",
          });
          return null;
        }

        addToast({
          type: "success",
          title: "Prompt Created!",
          description: `'${data.title}' is ready in the studio.`,
        });

        await loadPrompts();
        await selectPrompt(json.data.id);
        return json.data.id;
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Error",
          description: err.message || "Network error creating prompt.",
        });
        return null;
      }
    },
    [loadPrompts, selectPrompt, addToast]
  );

  // Delete active prompt
  const deleteActivePrompt = useCallback(async () => {
    if (!activePrompt) return false;

    try {
      const res = await fetch(`/api/prompts/${activePrompt.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast({
          type: "error",
          title: "Delete Failed",
          description: json.error?.message || "Failed to delete prompt.",
        });
        return false;
      }

      addToast({
        type: "info",
        title: "Prompt Deleted",
        description: `'${activePrompt.title}' removed.`,
      });

      const updatedList = await loadPrompts();
      if (updatedList && updatedList.length > 0) {
        await selectPrompt(updatedList[0].id);
      } else {
        setActivePrompt(null);
        setActiveVersion(null);
      }
      return true;
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        description: err.message || "Failed to delete prompt.",
      });
      return false;
    }
  }, [activePrompt, loadPrompts, selectPrompt, addToast]);

  return (
    <StudioContext.Provider
      value={{
        prompts,
        activePrompt,
        activeVersion,
        draftPrompt,
        isDraftDirty,
        detectedVariables,
        variableValues,
        activeTab,
        testScenarios,
        evaluationResults,
        lastBatchSummary,
        isEvaluating,
        isLoading,
        toasts,
        setActiveTab,
        loadPrompts,
        selectPrompt,
        selectVersion,
        updateDraft,
        setVariableValue,
        setAllVariableValues,
        resetVariableValues,
        commitSnapshot,
        promoteVersion,
        runEvaluations,
        createScenario,
        deleteScenario,
        createNewPrompt,
        deleteActivePrompt,
        addToast,
        removeToast,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
