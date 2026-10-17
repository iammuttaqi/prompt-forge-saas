import { interpolateTemplate } from "./variableParser";

export interface CodeGeneratorOptions {
  title: string;
  slug: string;
  systemPrompt?: string | null;
  userPrompt: string;
  assistantPrompt?: string | null;
  modelConfig?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } | null;
  variables: string[];
  sampleValues?: Record<string, string>;
}

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

/**
 * Generates TypeScript OpenAI SDK integration snippet.
 */
export function generateTypeScriptSnippet(options: CodeGeneratorOptions): string {
  const pascalName = toPascalCase(options.slug || options.title || "Prompt");
  const functionName = `run${pascalName}`;
  const interfaceName = `${pascalName}Params`;

  const model = options.modelConfig?.model || "gpt-4o";
  const temperature = options.modelConfig?.temperature ?? 0.7;

  const interfaceProps = options.variables.length > 0
    ? options.variables.map((v) => `  ${v}: string;`).join("\n")
    : "  // No variables required";

  // Build user prompt string literal with ${params.var} replacements
  let userTemplateLiteral = options.userPrompt;
  for (const v of options.variables) {
    const reg = new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, "g");
    userTemplateLiteral = userTemplateLiteral.replace(reg, `\${params.${v}}`);
  }

  const messages: string[] = [];

  if (options.systemPrompt) {
    messages.push(`      {
        role: "system",
        content: ${JSON.stringify(options.systemPrompt)},
      }`);
  }

  messages.push(`      {
        role: "user",
        content: \`${userTemplateLiteral.replace(/`/g, "\\`")}\`,
      }`);

  if (options.assistantPrompt) {
    messages.push(`      {
        role: "assistant",
        content: ${JSON.stringify(options.assistantPrompt)},
      }`);
  }

  return `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ${interfaceName} {
${interfaceProps}
}

export async function ${functionName}(params: ${interfaceName}) {
  const response = await openai.chat.completions.create({
    model: "${model}",
    temperature: ${temperature},
    messages: [
${messages.join(",\n")}
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
`;
}

/**
 * Generates Python OpenAI SDK snippet.
 */
export function generatePythonSnippet(options: CodeGeneratorOptions): string {
  const functionName = `run_${toSnakeCase(options.slug || options.title || "prompt")}`;
  const model = options.modelConfig?.model || "gpt-4o";
  const temperature = options.modelConfig?.temperature ?? 0.7;

  const pyArgs = options.variables.length > 0
    ? options.variables.map((v) => `${toSnakeCase(v)}: str`).join(", ")
    : "";

  let userTemplateLiteral = options.userPrompt;
  for (const v of options.variables) {
    const reg = new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, "g");
    userTemplateLiteral = userTemplateLiteral.replace(reg, `{${toSnakeCase(v)}}`);
  }

  const messages: string[] = [];

  if (options.systemPrompt) {
    messages.push(`            {
                "role": "system",
                "content": ${JSON.stringify(options.systemPrompt)},
            }`);
  }

  messages.push(`            {
                "role": "user",
                "content": f"""${userTemplateLiteral}""",
            }`);

  if (options.assistantPrompt) {
    messages.push(`            {
                "role": "assistant",
                "content": ${JSON.stringify(options.assistantPrompt)},
            }`);
  }

  return `import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def ${functionName}(${pyArgs}) -> str:
    response = client.chat.completions.create(
        model="${model}",
        temperature=${temperature},
        messages=[
${messages.join(",\n")}
        ]
    )
    return response.choices[0].message.content or ""
`;
}

/**
 * Generates cURL command snippet.
 */
export function generateCurlSnippet(options: CodeGeneratorOptions): string {
  const model = options.modelConfig?.model || "gpt-4o";
  const temperature = options.modelConfig?.temperature ?? 0.7;

  // Fill in sample values if available
  const sampleVars = options.sampleValues || {};
  const substitutedUserPrompt = interpolateTemplate(options.userPrompt, sampleVars);

  const messages: Array<{ role: string; content: string }> = [];

  if (options.systemPrompt) {
    messages.push({
      role: "system",
      content: options.systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: substitutedUserPrompt,
  });

  if (options.assistantPrompt) {
    messages.push({
      role: "assistant",
      content: options.assistantPrompt,
    });
  }

  const payload = {
    model,
    temperature,
    messages,
  };

  return `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '${JSON.stringify(payload, null, 2).replace(/'/g, "'\\''")}'`;
}

/**
 * Generates Dynamic REST API Fetch snippet.
 */
export function generateDynamicApiSnippet(options: CodeGeneratorOptions): string {
  const slug = options.slug || "active-prompt";

  return `// Dynamically fetch and interpolate the latest production prompt at runtime
async function getProductionPrompt(variables: Record<string, string>) {
  const res = await fetch("http://localhost:3000/api/prompts/${slug}/production", {
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!res.ok) {
    throw new Error(\`Failed to fetch prompt: \${res.statusText}\`);
  }

  const data = await res.json();
  
  // Interpolate variables into user prompt
  let compiledUserPrompt = data.userPrompt;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(\`\\\\{\\\\{\\\\s*\${key}\\\\s*\\\\}\\\\}\`, "g");
    compiledUserPrompt = compiledUserPrompt.replace(regex, value);
  }

  return {
    systemPrompt: data.systemPrompt,
    userPrompt: compiledUserPrompt,
    assistantPrompt: data.assistantPrompt,
    model: data.modelConfig?.model || "gpt-4o",
    version: data.version,
  };
}
`;
}
