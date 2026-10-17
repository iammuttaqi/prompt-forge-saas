import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  VARIABLE_REGEX,
  extractVariables,
  interpolateTemplate,
  parseTemplateSegments,
} from "./variableParser";
import {
  estimateTokens,
  calculateEstimatedCost,
  MODEL_CATALOG,
  type ModelPricing,
} from "./tokenEstimator";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")        // Replace spaces with -
    .replace(/[^\w\-]+/g, "")    // Remove all non-word chars
    .replace(/\-\-+/g, "-")      // Replace multiple - with single -
    .replace(/^-+/, "")          // Trim - from start of text
    .replace(/-+$/, "");         // Trim - from end of text
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Re-exports for convenient centralized access
export {
  VARIABLE_REGEX,
  extractVariables,
  interpolateTemplate,
  parseTemplateSegments,
  estimateTokens,
  calculateEstimatedCost,
  MODEL_CATALOG,
};
export type { ModelPricing };
