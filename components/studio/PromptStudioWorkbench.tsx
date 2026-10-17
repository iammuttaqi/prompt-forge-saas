"use client";

import React, { useEffect, useState } from "react";
import {
  Code,
  Eye,
  FileCode2,
  GitCompare,
  History,
  Layout,
  Play,
  Sparkles,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { useStudio } from "@/context/StudioContext";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { PromptCanvas } from "./PromptCanvas";
import { VariableSandbox } from "./VariableSandbox";
import { LivePreviewPane } from "./LivePreviewPane";
import { TokenCostCounter } from "./TokenCostCounter";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { VisualDiffViewer } from "./VisualDiffViewer";
import { TestScenarioMatrix } from "./TestScenarioMatrix";
import { CodeExportDrawer } from "./CodeExportDrawer";
import { VersionSnapshotModal } from "./VersionSnapshotModal";
import { ToastContainer } from "@/components/ui/Toast";

export function PromptStudioWorkbench() {
  const {
    activePrompt,
    activeVersion,
    activeTab,
    setActiveTab,
    isLoading,
    testScenarios,
    runEvaluations,
    toasts,
    removeToast,
  } = useStudio();

  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);

  // Keyboard Shortcuts (Cmd+S to save snapshot, Cmd+Enter to run evals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsSnapshotOpen(true);
      }

      if (modifier && e.key === "Enter") {
        e.preventDefault();
        if (activeTab === "tests") {
          runEvaluations();
        } else {
          setActiveTab("tests");
          runEvaluations();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, runEvaluations, setActiveTab]);

  const studioTabs: TabItem[] = [
    {
      id: "canvas",
      label: "Prompt Canvas & Sandbox",
      icon: <Layout className="w-3.5 h-3.5" />,
    },
    {
      id: "diff",
      label: "History & Visual Diff",
      icon: <GitCompare className="w-3.5 h-3.5" />,
      badge: activePrompt?.versions?.length ? (
        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
          {activePrompt.versions.length}
        </span>
      ) : undefined,
    },
    {
      id: "tests",
      label: "Test Scenarios & Evals",
      icon: <Play className="w-3.5 h-3.5" />,
      badge: testScenarios.length ? (
        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
          {testScenarios.length}
        </span>
      ) : undefined,
    },
    {
      id: "export",
      label: "Code Export & API",
      icon: <Code className="w-3.5 h-3.5" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading prompt workspace...</p>
      </div>
    );
  }

  if (!activePrompt) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
        <h3 className="text-lg font-semibold text-slate-100">No Prompt Selected</h3>
        <p className="text-xs text-slate-400">
          Please select an existing prompt from the top menu or create a new prompt template.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activePrompt.title}
            </h1>
            <span className="font-mono text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              slug: {activePrompt.slug}
            </span>
          </div>
          {activePrompt.description && (
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {activePrompt.description}
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <Tabs
          tabs={studioTabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[500px]">
        {/* Tab 1: Canvas & Sandbox */}
        {activeTab === "canvas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Pane: Prompt Role Editors (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <PromptCanvas />
            </div>

            {/* Right Pane: Sandbox, Live Preview, and Cost (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <VariableSandbox />
              <LivePreviewPane />
              <TokenCostCounter />
            </div>
          </div>
        )}

        {/* Tab 2: History & Visual Diff */}
        {activeTab === "diff" && (
          <div className="space-y-6">
            <VisualDiffViewer />
            <VersionHistoryDrawer />
          </div>
        )}

        {/* Tab 3: Test Scenarios & Evals */}
        {activeTab === "tests" && <TestScenarioMatrix />}

        {/* Tab 4: Code Export & API */}
        {activeTab === "export" && <CodeExportDrawer />}
      </div>

      {/* Version Snapshot Modal */}
      <VersionSnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
