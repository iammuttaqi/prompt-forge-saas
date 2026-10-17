export const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Extracts unique variable names from prompt templates.
 */
export function extractVariables(templates: (string | null | undefined)[]): string[] {
  const variableSet = new Set<string>();

  templates.forEach((template) => {
    if (!template) return;
    let match: RegExpExecArray | null;
    const regex = new RegExp(VARIABLE_REGEX);
    while ((match = regex.exec(template)) !== null) {
      if (match[1]) {
        variableSet.add(match[1].trim());
      }
    }
  });

  return Array.from(variableSet);
}

/**
 * Interpolates variables into a template safely.
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  if (!template) return "";
  return template.replace(VARIABLE_REGEX, (_, varName) => {
    const trimmed = varName.trim();
    return variables[trimmed] !== undefined && variables[trimmed] !== ""
      ? variables[trimmed]
      : `{{${trimmed}}}`;
  });
}

export interface TemplateSegment {
  type: "text" | "variable";
  text: string;
  varName?: string;
  value?: string;
  isFilled: boolean;
}

/**
 * Splits template into styled segments for visual rich previews.
 */
export function parseTemplateSegments(
  template: string,
  variables: Record<string, string>
): TemplateSegment[] {
  if (!template) return [];

  const segments: TemplateSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(VARIABLE_REGEX);

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: template.substring(lastIndex, match.index),
        isFilled: false,
      });
    }

    const varName = match[1].trim();
    const val = variables[varName];
    const isFilled = val !== undefined && val !== "";

    segments.push({
      type: "variable",
      text: isFilled ? val : match[0],
      varName,
      value: val,
      isFilled,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < template.length) {
    segments.push({
      type: "text",
      text: template.substring(lastIndex),
      isFilled: false,
    });
  }

  return segments;
}
