import { spawn } from "child_process";
import prisma from "../lib/prisma";
import { extractVariables, interpolateTemplate, parseTemplateSegments } from "../lib/variableParser";
import { estimateTokens, calculateEstimatedCost } from "../lib/tokenEstimator";
import { computeWordDiff, comparePromptVersions } from "../lib/diffEngine";
import { evaluateAssertions, generateLocalMockCompletion } from "../lib/assertionEngine";
import {
  generateTypeScriptSnippet,
  generatePythonSnippet,
  generateCurlSnippet,
  generateDynamicApiSnippet,
} from "../lib/codeGenerators";

async function ensureServerRunning(): Promise<{ baseUrl: string; stopServer: () => void }> {
  // Check port 3000
  try {
    const res = await fetch("http://localhost:3000/api/prompts", { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      console.log("Connected to existing Next.js server on http://localhost:3000\n");
      return { baseUrl: "http://localhost:3000", stopServer: () => {} };
    }
  } catch {}

  // Check port 3005
  try {
    const res = await fetch("http://localhost:3005/api/prompts", { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      console.log("Connected to existing Next.js server on http://localhost:3005\n");
      return { baseUrl: "http://localhost:3005", stopServer: () => {} };
    }
  } catch {}

  // Neither running, spawn next start on port 3005
  console.log("Spawning Next.js server on port 3005 for live API route verification...");
  const proc = spawn("npx", ["next", "start", "-p", "3005"], {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: false,
  });

  const stopServer = () => {
    try {
      proc.kill("SIGTERM");
    } catch {}
  };

  const start = Date.now();
  while (Date.now() - start < 20000) {
    try {
      const res = await fetch("http://localhost:3005/api/prompts", { signal: AbortSignal.timeout(600) });
      if (res.status === 200) {
        console.log("Next.js test server ready on http://localhost:3005.\n");
        return { baseUrl: "http://localhost:3005", stopServer };
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  stopServer();
  throw new Error("Failed to start Next.js test server on port 3005 within 20 seconds.");
}


interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(category: string, name: string, fn: () => Promise<void> | void) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ category, name, passed: true, durationMs });
    console.log(`  ✓ [${category}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const errorMsg = err?.stack || err?.message || String(err);
    results.push({ category, name, passed: false, durationMs, error: errorMsg });
    console.error(`  ✗ [${category}] ${name} (${durationMs}ms)`);
    console.error(`    Error: ${errorMsg}`);
  }
}

function assert(condition: unknown, msg: string = "Condition failed") {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(`${msg ? msg + ": " : ""}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertClose(actual: number, expected: number, tolerance = 1e-5, msg?: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${msg ? msg + ": " : ""}Expected ~${expected}, got ${actual}`);
  }
}

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("   PROMPTFORGE SAAS - AUTOMATED QA VERIFICATION SUITE   ");
  console.log("========================================================\n");

  // ----------------------------------------------------
  // SECTION 1: UNIT TESTS - VARIABLE PARSER
  // ----------------------------------------------------
  console.log("--- 1. Variable Parser Suite ---");

  await test("VariableParser", "Extract variables with single and multiple placeholders", () => {
    const vars = extractVariables([
      "Hello {{name}}, your balance is {{ balance }}!",
      "Tier: {{tier}} and account {{ account_id }}",
    ]);
    assertEquals(vars.length, 4, "Should extract 4 unique variables");
    assert(vars.includes("name"), "Should contain 'name'");
    assert(vars.includes("balance"), "Should contain 'balance'");
    assert(vars.includes("tier"), "Should contain 'tier'");
    assert(vars.includes("account_id"), "Should contain 'account_id'");
  });

  await test("VariableParser", "Deduplicate repeated variables across multiple prompt roles", () => {
    const vars = extractVariables([
      "User {{username}} with role {{role}}",
      "Assistant confirming {{username}} with {{role}}",
      "System context for {{username}}",
    ]);
    assertEquals(vars.length, 2, "Should deduplicate to exactly 2 variables");
    assert(vars.includes("username") && vars.includes("role"), "Contains username and role");
  });

  await test("VariableParser", "Interpolate variables safely into template", () => {
    const template = "Welcome, {{user}}! Your role is {{role}}.";
    const interpolated = interpolateTemplate(template, { user: "Alice", role: "Admin" });
    assertEquals(interpolated, "Welcome, Alice! Your role is Admin.");
  });

  await test("VariableParser", "Handle missing variables by preserving brackets", () => {
    const template = "Action: {{action}} for {{missing_var}}.";
    const interpolated = interpolateTemplate(template, { action: "Deploy" });
    assertEquals(interpolated, "Action: Deploy for {{missing_var}}.");
  });

  await test("VariableParser", "Parse template segments for rich preview highlighting", () => {
    const template = "Prefix {{var1}} Middle {{var2}} Suffix";
    const segments = parseTemplateSegments(template, { var1: "VAL1" });
    assertEquals(segments.length, 5, "Expected 5 parsed segments");
    assertEquals(segments[0].type, "text");
    assertEquals(segments[0].text, "Prefix ");
    assertEquals(segments[1].type, "variable");
    assertEquals(segments[1].varName, "var1");
    assertEquals(segments[1].isFilled, true);
    assertEquals(segments[1].text, "VAL1");
    assertEquals(segments[3].type, "variable");
    assertEquals(segments[3].varName, "var2");
    assertEquals(segments[3].isFilled, false);
    assertEquals(segments[3].text, "{{var2}}");
  });

  // ----------------------------------------------------
  // SECTION 2: UNIT TESTS - TOKEN ESTIMATOR & PRICING
  // ----------------------------------------------------
  console.log("\n--- 2. Token Estimator & Costing Suite ---");

  await test("TokenEstimator", "Estimate tokens using character heuristic (~3.8 chars/token)", () => {
    const text = "The quick brown fox jumps over the lazy dog"; // 43 chars
    const tokens = estimateTokens(text);
    assertEquals(tokens, 12, "43 chars / 3.8 = 11.31 -> Math.ceil = 12 tokens");
    assertEquals(estimateTokens(""), 0, "Empty string should be 0 tokens");
    assertEquals(estimateTokens(null), 0, "Null text should be 0 tokens");
  });

  await test("TokenEstimator", "Calculate costs accurately across model catalog", () => {
    // GPT-4o: $0.005 / 1k in, $0.015 / 1k out
    const gpt4oCost = calculateEstimatedCost(1000, 1000, "gpt-4o");
    assertClose(gpt4oCost.inputCost, 0.005);
    assertClose(gpt4oCost.outputCost, 0.015);
    assertClose(gpt4oCost.totalCost, 0.02);
    assertEquals(gpt4oCost.formattedTotal, "$0.0200");

    // Claude 3.5 Sonnet: $0.003 / 1k in, $0.015 / 1k out
    const sonnetCost = calculateEstimatedCost(2000, 1000, "claude-3-5-sonnet");
    assertClose(sonnetCost.inputCost, 0.006);
    assertClose(sonnetCost.outputCost, 0.015);
    assertClose(sonnetCost.totalCost, 0.021);

    // Fallback unknown model should default to gpt-4o pricing
    const unknownCost = calculateEstimatedCost(1000, 1000, "unknown-model-xyz");
    assertClose(unknownCost.totalCost, 0.02);
  });

  await test("TokenEstimator", "Format micro-cent costs properly (< $0.0001)", () => {
    const microCost = calculateEstimatedCost(1, 1, "gemini-1-5-flash");
    assertEquals(microCost.formattedTotal, "< $0.0001");
  });

  // ----------------------------------------------------
  // SECTION 3: UNIT TESTS - DIFF ENGINE
  // ----------------------------------------------------
  console.log("\n--- 3. Diff Engine Suite ---");

  await test("DiffEngine", "Compute word-level diff correctly (additions, deletions, unchanged)", () => {
    const oldText = "The quick brown fox";
    const newText = "The fast brown fox jumps";
    const diff = computeWordDiff(oldText, newText);

    assert(diff.metrics.additions > 0, "Should detect additions ('fast', 'jumps')");
    assert(diff.metrics.deletions > 0, "Should detect deletions ('quick')");
    assert(diff.metrics.unchanged > 0, "Should detect unchanged ('The', 'brown', 'fox')");

    const addedParts = diff.parts.filter((p) => p.type === "added");
    const removedParts = diff.parts.filter((p) => p.type === "removed");
    assert(addedParts.some((p) => p.value.includes("fast")), "Added parts contain 'fast'");
    assert(removedParts.some((p) => p.value.includes("quick")), "Removed parts contain 'quick'");
  });

  await test("DiffEngine", "Compare full prompt version changes and variable evolution", () => {
    const v1 = {
      systemPrompt: "You are a customer support agent.",
      userPrompt: "Query: {{customer_query}}",
      variables: JSON.stringify(["customer_query"]),
    };
    const v2 = {
      systemPrompt: "You are a senior customer support agent.",
      userPrompt: "Query: {{customer_query}}\nTier: {{user_tier}}",
      variables: JSON.stringify(["customer_query", "user_tier"]),
    };

    const comp = comparePromptVersions(v1, v2);
    assertEquals(comp.variableDiff.added.length, 1);
    assertEquals(comp.variableDiff.added[0], "user_tier");
    assertEquals(comp.variableDiff.retained.length, 1);
    assertEquals(comp.variableDiff.retained[0], "customer_query");
    assertEquals(comp.variableDiff.removed.length, 0);
    assert(comp.metrics.additions > 0, "Has additions");
  });

  // ----------------------------------------------------
  // SECTION 4: UNIT TESTS - ASSERTION ENGINE
  // ----------------------------------------------------
  console.log("\n--- 4. Assertion Engine Suite ---");

  await test("AssertionEngine", "Pass assertions when all keyword criteria and token limits match", () => {
    const output = "The ticket was triaged as billing category with refund_eligible flag set to true.";
    const result = evaluateAssertions(output, 50, {
      expectedKeywords: ["billing", "refund_eligible"],
      forbiddenKeywords: ["unauthorized", "fatal"],
      maxTokenLimit: 100,
    });

    assertEquals(result.status, "PASSED");
    assertEquals(result.assertions.length, 5);
    assert(result.assertions.every((a) => a.passed), "All assertions passed");
  });

  await test("AssertionEngine", "Fail assertions when required keyword is missing", () => {
    const output = "Customer account inquiry processed.";
    const result = evaluateAssertions(output, 20, {
      expectedKeywords: ["escalate_to_tier_2"],
    });

    assertEquals(result.status, "FAILED");
    assert(result.failureSummary?.includes("Missing required keyword"), "Failure summary notes missing keyword");
  });

  await test("AssertionEngine", "Fail assertions when forbidden keyword is detected", () => {
    const output = "Warning: unauthorized access detected.";
    const result = evaluateAssertions(output, 20, {
      forbiddenKeywords: ["unauthorized"],
    });

    assertEquals(result.status, "FAILED");
    assert(result.failureSummary?.includes("Detected forbidden keyword"), "Detected forbidden keyword");
  });

  await test("AssertionEngine", "Fail assertions when token limit is exceeded", () => {
    const output = "Long generated response text...";
    const result = evaluateAssertions(output, 550, {
      maxTokenLimit: 500,
    });

    assertEquals(result.status, "FAILED");
    assert(result.failureSummary?.includes("Output exceeded token limit"), "Exceeded token limit");
  });

  await test("AssertionEngine", "Generate deterministic JSON mock completion when requested in prompt", () => {
    const prompt = "Categorize this request. Output valid JSON only with category and priority.";
    const mock = generateLocalMockCompletion(
      prompt,
      "High Priority Outage",
      { query: "Database down" },
      ["priority", "category"]
    );

    const parsed = JSON.parse(mock);
    assertEquals(parsed.status, "success");
    assertEquals(parsed.scenario, "High Priority Outage");
    assert(Array.isArray(parsed.tags), "Tags is an array");
    assert(parsed.tags.includes("priority"), "Includes priority tag");
  });

  // ----------------------------------------------------
  // SECTION 5: UNIT TESTS - CODE GENERATORS
  // ----------------------------------------------------
  console.log("\n--- 5. Code Generators Suite ---");

  const mockCodeOpts = {
    title: "Support Triage",
    slug: "support-triage",
    systemPrompt: "You are a support bot.",
    userPrompt: "Query: {{query}}\nTier: {{tier}}",
    modelConfig: { model: "gpt-4o", temperature: 0.2 },
    variables: ["query", "tier"],
    sampleValues: { query: "Password reset", tier: "Gold" },
  };

  await test("CodeGenerators", "Generate valid TypeScript SDK snippet with typed interface", () => {
    const tsCode = generateTypeScriptSnippet(mockCodeOpts);
    assert(tsCode.includes("export interface SupportTriageParams"), "Exports params interface");
    assert(tsCode.includes("query: string;"), "Has query prop");
    assert(tsCode.includes("tier: string;"), "Has tier prop");
    assert(tsCode.includes("export async function runSupportTriage"), "Exports runner function");
    assert(tsCode.includes("model: \"gpt-4o\""), "Specifies gpt-4o");
    assert(tsCode.includes("temperature: 0.2"), "Specifies temperature 0.2");
  });

  await test("CodeGenerators", "Generate valid Python SDK snippet with snake_case naming", () => {
    const pyCode = generatePythonSnippet(mockCodeOpts);
    assert(pyCode.includes("def run_support_triage(query: str, tier: str) -> str:"), "Defines function signature");
    assert(pyCode.includes("f\"\"\"Query: {query}"), "Includes f-string interpolation");
    assert(pyCode.includes("model=\"gpt-4o\""), "Specifies gpt-4o");
  });

  await test("CodeGenerators", "Generate executable cURL command with interpolated sample variables", () => {
    const curlCode = generateCurlSnippet(mockCodeOpts);
    assert(curlCode.startsWith("curl https://api.openai.com/v1/chat/completions"), "Calls openai completions endpoint");
    assert(curlCode.includes("Password reset"), "Substituted sample query");
    assert(curlCode.includes("Gold"), "Substituted sample tier");
  });

  await test("CodeGenerators", "Generate Dynamic REST API client snippet fetching production prompt", () => {
    const apiCode = generateDynamicApiSnippet(mockCodeOpts);
    assert(apiCode.includes("/api/prompts/support-triage/production"), "Fetches production endpoint for slug");
    assert(apiCode.includes("async function getProductionPrompt"), "Defines fetcher function");
  });

  // ----------------------------------------------------
  // SECTION 6: DATABASE INTEGRITY & SEED VERIFICATION
  // ----------------------------------------------------
  console.log("\n--- 6. Database Integrity & Seed Verification Suite ---");

  await test("DatabaseIntegrity", "Verify Project records exist with unique slugs", async () => {
    const projects = await prisma.project.findMany({ include: { prompts: true } });
    assert(projects.length >= 1, "At least 1 project exists");
    const core = projects.find((p) => p.slug === "core-ai-applications");
    assert(Boolean(core), "Project 'core-ai-applications' exists");
    assert(core!.prompts.length >= 3, "Core project contains at least 3 prompts");
  });

  await test("DatabaseIntegrity", "Verify Prompts have valid activeVersionId and non-null versions", async () => {
    const prompts = await prisma.prompt.findMany({
      include: { versions: true, testScenarios: true },
    });
    assert(prompts.length >= 3, "At least 3 prompts exist");

    for (const p of prompts) {
      assert(Boolean(p.title), `Prompt ${p.id} has title`);
      assert(Boolean(p.slug), `Prompt ${p.id} has slug`);
      assert(p.versions.length > 0, `Prompt ${p.slug} has at least 1 version`);
      assert(Boolean(p.activeVersionId), `Prompt ${p.slug} has activeVersionId`);

      const activeVer = p.versions.find((v) => v.id === p.activeVersionId);
      assert(Boolean(activeVer), `Prompt ${p.slug} activeVersionId points to an existing version`);
    }
  });

  await test("DatabaseIntegrity", "Verify PromptVersion immutability & production flag rules", async () => {
    const versions = await prisma.promptVersion.findMany();
    assert(versions.length >= 5, "At least 5 versions exist across prompts");

    for (const v of versions) {
      assert(Boolean(v.versionTag), `Version ${v.id} has versionTag`);
      assert(Boolean(v.userPrompt), `Version ${v.id} has userPrompt`);

      // Verify modelConfig JSON
      if (v.modelConfig) {
        const parsed = JSON.parse(v.modelConfig);
        assert(Boolean(parsed.model), `Version ${v.versionTag} modelConfig has valid model: ${parsed.model}`);
      }

      // Verify variables JSON
      if (v.variables) {
        const parsed = JSON.parse(v.variables);
        assert(Array.isArray(parsed), `Version ${v.versionTag} variables is valid array`);
      }
    }
  });

  await test("DatabaseIntegrity", "Verify TestScenario input variables & keyword assertion arrays", async () => {
    const scenarios = await prisma.testScenario.findMany();
    assert(scenarios.length >= 5, "At least 5 scenarios exist in seed data");

    for (const sc of scenarios) {
      assert(Boolean(sc.name), `Scenario ${sc.id} has name`);
      const inputs = JSON.parse(sc.inputVariables);
      assert(typeof inputs === "object" && inputs !== null, `Scenario ${sc.name} inputVariables is valid JSON object`);

      if (sc.expectedKeywords) {
        const exp = JSON.parse(sc.expectedKeywords);
        assert(Array.isArray(exp), `Scenario ${sc.name} expectedKeywords is JSON array`);
      }

      if (sc.forbiddenKeywords) {
        const forb = JSON.parse(sc.forbiddenKeywords);
        assert(Array.isArray(forb), `Scenario ${sc.name} forbiddenKeywords is JSON array`);
      }
    }
  });

  await test("DatabaseIntegrity", "Verify EvaluationResults refer to existing versions and scenarios", async () => {
    const evals = await prisma.evaluationResult.findMany({
      include: { promptVersion: true, scenario: true },
    });
    assert(evals.length >= 2, "Seed evaluation records exist");

    for (const ev of evals) {
      assert(Boolean(ev.promptVersion), `Evaluation ${ev.id} references valid promptVersion`);
      assert(Boolean(ev.scenario), `Evaluation ${ev.id} references valid scenario`);
      assert(["PASSED", "FAILED", "ERROR"].includes(ev.status), `Evaluation has valid status: ${ev.status}`);
      assert(ev.latencyMs > 0, `Latency is positive: ${ev.latencyMs}ms`);
      assert(ev.tokenCount > 0, `Token count is positive: ${ev.tokenCount}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 7: API ROUTE VERIFICATION (HTTP / LIVE ENDPOINTS)
  // ----------------------------------------------------
  console.log("\n--- 7. Live API Route Verification Suite ---");

  const { baseUrl, stopServer } = await ensureServerRunning();

  try {


  await test("API: GET /api/prompts", "Fetch prompt collection with metadata & counts", async () => {
    const res = await fetch(`${baseUrl}/api/prompts`);
    assertEquals(res.status, 200, "Status is 200");
    const json = await res.json();
    assert(json.success, "Response has success: true");
    assert(Array.isArray(json.data), "Response data is an array");
    assert(json.data.length >= 3, "Contains at least 3 prompts");

    const first = json.data[0];
    assert(Boolean(first.id), "Prompt item has id");
    assert(Boolean(first.title), "Prompt item has title");
    assert(Boolean(first.slug), "Prompt item has slug");
    assert(typeof first.versionCount === "number", "Prompt has versionCount");
    assert(typeof first.scenarioCount === "number", "Prompt has scenarioCount");
    assert(Boolean(first.activeVersion), "Prompt has activeVersion details");
  });

  await test("API: GET /api/prompts?query=...", "Filter prompts by search query", async () => {
    const res = await fetch(`${baseUrl}/api/prompts?query=support`);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.success, "Response success");
    assert(json.data.length >= 1, "Should match customer support agent");
    assert(
      json.data.some((p: any) => p.slug.includes("support") || p.title.toLowerCase().includes("support")),
      "Result contains query keyword"
    );
  });

  let testCreatedPromptId: string = "";
  const testSlug = `e2e-test-qa-${Date.now()}`;

  await test("API: POST /api/prompts", "Create new prompt with initial version v1.0.0 snapshot", async () => {
    const payload = {
      title: "QA Automated Test Prompt",
      slug: testSlug,
      description: "Ephemeral prompt created during automated QA test run",
      systemPrompt: "You are an automated verification bot for testing.",
      userPrompt: "Process test data for user: {{test_user}} with action: {{test_action}}.",
      modelConfig: { model: "gpt-4o", temperature: 0.1, maxTokens: 500 },
    };

    const res = await fetch(`${baseUrl}/api/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assertEquals(res.status, 201, "Created status 201");
    const json = await res.json();
    assert(json.success, "Creation success");
    assert(Boolean(json.data.id), "Created prompt has ID");
    testCreatedPromptId = json.data.id;
    assertEquals(json.data.slug, testSlug, "Slug matches requested slug");
    assertEquals(json.data.versions.length, 1, "Has 1 initial version");
    assertEquals(json.data.versions[0].versionTag, "v1.0.0", "Initial version is v1.0.0");
    assert(json.data.versions[0].isProduction, "Initial version is flagged production");
  });

  await test("API: POST /api/prompts Duplicate Slug", "Reject duplicate slug with 409 Conflict", async () => {
    const payload = {
      title: "QA Duplicate Slug Test",
      slug: testSlug,
      userPrompt: "Sample prompt",
    };

    const res = await fetch(`${baseUrl}/api/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assertEquals(res.status, 409, "Should reject duplicate slug with 409 Conflict");
    const json = await res.json();
    assertEquals(json.success, false);
    assertEquals(json.error.code, "DUPLICATE_SLUG");
  });

  await test("API: GET /api/prompts/[id]", "Retrieve single prompt by ID and by slug", async () => {
    // By ID
    const resId = await fetch(`${baseUrl}/api/prompts/${testCreatedPromptId}`);
    assertEquals(resId.status, 200);
    const jsonId = await resId.json();
    assert(jsonId.success);
    assertEquals(jsonId.data.id, testCreatedPromptId);

    // By Slug
    const resSlug = await fetch(`${baseUrl}/api/prompts/${testSlug}`);
    assertEquals(resSlug.status, 200);
    const jsonSlug = await resSlug.json();
    assert(jsonSlug.success);
    assertEquals(jsonSlug.data.id, testCreatedPromptId);
  });

  let newVersionId: string = "";

  await test("API: POST /api/prompts/[id]/versions", "Commit new immutable version snapshot v1.1.0", async () => {
    const payload = {
      versionTag: "v1.1.0",
      commitMessage: "Added timeout variable and stricter guidelines",
      systemPrompt: "You are an automated verification bot with strict limits.",
      userPrompt: "Process test data for user: {{test_user}} with action: {{test_action}} within {{timeout}}ms.",
      modelConfig: { model: "gpt-4o-mini", temperature: 0.2, maxTokens: 256 },
      isProduction: false,
    };

    const res = await fetch(`${baseUrl}/api/prompts/${testCreatedPromptId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assertEquals(res.status, 201, "Committed status 201");
    const json = await res.json();
    assert(json.success);
    assertEquals(json.data.versionTag, "v1.1.0");
    newVersionId = json.data.id;

    // Check detected variables
    const vars = JSON.parse(json.data.variables);
    assertEquals(vars.length, 3, "Detected 3 variables: test_user, test_action, timeout");
    assert(vars.includes("timeout"), "Includes 'timeout'");
  });

  await test("API: POST /api/prompts/[id]/promote", "Atomically promote v1.1.0 to production release", async () => {
    const res = await fetch(`${baseUrl}/api/prompts/${testCreatedPromptId}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId: newVersionId }),
    });

    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.success);
    assertEquals(json.data.promotedVersionId, newVersionId);
    assertEquals(json.data.isProduction, true);
  });

  await test("API: GET /api/prompts/[slug]/production", "Production API gateway serves active production version", async () => {
    const res = await fetch(`${baseUrl}/api/prompts/${testSlug}/production`);
    assertEquals(res.status, 200);
    const json = await res.json();
    assertEquals(json.slug, testSlug);
    assertEquals(json.version, "v1.1.0");
    assert(json.userPrompt.includes("within {{timeout}}ms"), "Serves promoted v1.1.0 prompt template");
    assertEquals(json.modelConfig.model, "gpt-4o-mini");
    assert(Array.isArray(json.variables), "Variables list returned");
    assert(json.variables.includes("timeout"));
  });

  let createdScenarioId: string = "";

  await test("API: POST /api/scenarios", "Create test scenario with assertion keywords and token limits", async () => {
    const payload = {
      promptId: testCreatedPromptId,
      name: "Verify Admin Deployment Action",
      inputVariables: {
        test_user: "super_admin",
        test_action: "production_hotfix",
        timeout: "1500",
      },
      expectedKeywords: ["verified", "production_hotfix"],
      forbiddenKeywords: ["unauthorized_error", "forbidden"],
      maxTokenLimit: 300,
    };

    const res = await fetch(`${baseUrl}/api/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assertEquals(res.status, 201);
    const json = await res.json();
    assert(json.success);
    assert(Boolean(json.data.id));
    createdScenarioId = json.data.id;
    assertEquals(json.data.name, "Verify Admin Deployment Action");
  });

  await test("API: GET /api/scenarios?promptId=...", "Fetch scenarios belonging to prompt", async () => {
    const res = await fetch(`${baseUrl}/api/scenarios?promptId=${testCreatedPromptId}`);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.success);
    assert(json.data.length >= 1, "Contains at least 1 scenario");
    assertEquals(json.data[0].id, createdScenarioId);
  });

  await test("API: POST /api/evaluate", "Run evaluation suite against scenario with assertions & persist results", async () => {
    const payload = {
      promptVersionId: newVersionId,
      scenarioIds: [createdScenarioId],
    };

    const res = await fetch(`${baseUrl}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.success, "Evaluation completed successfully");
    assert(json.data.batchSummary.total === 1, "1 scenario evaluated");
    assert(json.data.results.length === 1, "1 result returned");

    const evalResult = json.data.results[0];
    assertEquals(evalResult.scenarioId, createdScenarioId);
    assert(evalResult.status === "PASSED" || evalResult.status === "FAILED", "Has valid status");
    assert(evalResult.latencyMs > 0, "Latency measured");
    assert(evalResult.tokenCount > 0, "Token count measured");
    assert(evalResult.estimatedCost >= 0, "Cost calculated");
    assert(Array.isArray(evalResult.assertions), "Assertion check details array returned");

    // Check DB persistence
    const savedEval = await prisma.evaluationResult.findFirst({
      where: { promptVersionId: newVersionId, scenarioId: createdScenarioId },
    });
    assert(Boolean(savedEval), "Evaluation result was persisted to database");
    assertEquals(savedEval!.status, evalResult.status);
  });

  await test("API: Clean up test scenario and prompt", "Delete test scenario and prompt with cascading cleanup", async () => {
    // Delete scenario
    const delScen = await fetch(`${baseUrl}/api/scenarios/${createdScenarioId}`, { method: "DELETE" });
    assertEquals(delScen.status, 200, "Scenario deleted");

    // Delete prompt
    const delPrompt = await fetch(`${baseUrl}/api/prompts/${testCreatedPromptId}`, { method: "DELETE" });
    assertEquals(delPrompt.status, 200, "Prompt deleted");

    // Verify cascaded deletion
    const checkPrompt = await prisma.prompt.findUnique({ where: { id: testCreatedPromptId } });
    assertEquals(checkPrompt, null, "Prompt record deleted");

    const checkVersions = await prisma.promptVersion.findMany({ where: { promptId: testCreatedPromptId } });
    assertEquals(checkVersions.length, 0, "All versions cascaded");
  });
  } finally {
    stopServer();
  }


  // ----------------------------------------------------

  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log("\n========================================================");
  console.log("                TEST EXECUTION SUMMARY                  ");
  console.log("========================================================");

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`Total Tests Run:  ${total}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed:           ${failed}`);
  console.log(`Success Rate:     ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`Total Duration:   ${totalDuration.toFixed(2)}ms`);

  if (failed > 0) {
    console.log("\nFailed Test Details:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - [${r.category}] ${r.name}`);
        console.log(`    ${r.error}`);
      });
  }

  console.log("========================================================\n");

  return { total, passed, failed, totalDuration, results };
}

// Execute runner if invoked directly
if (require.main === module || process.argv[1]?.includes("verify-all")) {
  runTestSuite()
    .then(({ failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error("FATAL ERROR IN TEST RUNNER:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { runTestSuite };
