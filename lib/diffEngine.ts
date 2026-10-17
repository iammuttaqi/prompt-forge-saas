export type DiffType = "added" | "removed" | "unchanged";

export interface DiffPart {
  type: DiffType;
  value: string;
}

export interface DiffMetrics {
  additions: number;
  deletions: number;
  unchanged: number;
}

export interface PromptDiffResult {
  systemDiff: DiffPart[];
  userDiff: DiffPart[];
  assistantDiff: DiffPart[];
  variableDiff: {
    added: string[];
    removed: string[];
    retained: string[];
  };
  metrics: DiffMetrics;
}

/**
 * Computes word-level diff between two text strings using LCS algorithm.
 */
export function computeWordDiff(oldText: string = "", newText: string = ""): {
  parts: DiffPart[];
  metrics: DiffMetrics;
} {
  const oldWords = oldText ? oldText.split(/(\s+)/) : [];
  const newWords = newText ? newText.split(/(\s+)/) : [];

  const m = oldWords.length;
  const n = newWords.length;

  // LCS Matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldWords[i] === newWords[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to find diff
  const rawParts: DiffPart[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      rawParts.unshift({ type: "unchanged", value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawParts.unshift({ type: "added", value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawParts.unshift({ type: "removed", value: oldWords[i - 1] });
      i--;
    }
  }

  // Coalesce adjacent parts of same type
  const coalesced: DiffPart[] = [];
  for (const part of rawParts) {
    if (coalesced.length > 0 && coalesced[coalesced.length - 1].type === part.type) {
      coalesced[coalesced.length - 1].value += part.value;
    } else {
      coalesced.push({ ...part });
    }
  }

  // Calculate metrics (counting non-whitespace word changes)
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const part of coalesced) {
    const wordCount = part.value.trim().split(/\s+/).filter(Boolean).length;
    if (part.type === "added") {
      additions += wordCount;
    } else if (part.type === "removed") {
      deletions += wordCount;
    } else {
      unchanged += wordCount;
    }
  }

  return {
    parts: coalesced,
    metrics: { additions, deletions, unchanged },
  };
}

/**
 * Compares two prompt versions comprehensively.
 */
export function comparePromptVersions(
  base: {
    systemPrompt?: string | null;
    userPrompt: string;
    assistantPrompt?: string | null;
    variables?: string[] | string | null;
  },
  target: {
    systemPrompt?: string | null;
    userPrompt: string;
    assistantPrompt?: string | null;
    variables?: string[] | string | null;
  }
): PromptDiffResult {
  const sysDiff = computeWordDiff(base.systemPrompt || "", target.systemPrompt || "");
  const userDiff = computeWordDiff(base.userPrompt || "", target.userPrompt || "");
  const asstDiff = computeWordDiff(base.assistantPrompt || "", target.assistantPrompt || "");

  const parseVars = (vars: string[] | string | null | undefined): string[] => {
    if (!vars) return [];
    if (Array.isArray(vars)) return vars;
    try {
      const parsed = JSON.parse(vars);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const baseVars = new Set(parseVars(base.variables));
  const targetVars = new Set(parseVars(target.variables));

  const addedVars = Array.from(targetVars).filter((v) => !baseVars.has(v));
  const removedVars = Array.from(baseVars).filter((v) => !targetVars.has(v));
  const retainedVars = Array.from(targetVars).filter((v) => baseVars.has(v));

  return {
    systemDiff: sysDiff.parts,
    userDiff: userDiff.parts,
    assistantDiff: asstDiff.parts,
    variableDiff: {
      added: addedVars,
      removed: removedVars,
      retained: retainedVars,
    },
    metrics: {
      additions: sysDiff.metrics.additions + userDiff.metrics.additions + asstDiff.metrics.additions,
      deletions: sysDiff.metrics.deletions + userDiff.metrics.deletions + asstDiff.metrics.deletions,
      unchanged: sysDiff.metrics.unchanged + userDiff.metrics.unchanged + asstDiff.metrics.unchanged,
    },
  };
}
