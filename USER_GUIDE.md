# PromptForge Studio — Comprehensive User Guide

> **Production-Grade Prompt Engineering, Dynamic Variable Playground, Git-Style Versioning, and Regression Evaluation Suite.**

Welcome to the **PromptForge Studio User Guide**. This guide walks you through every facet of authoring, testing, versioning, evaluating, and deploying production-ready prompts for generative AI applications.

---

## Table of Contents

1. [Overview & Core Concepts](#1-overview--core-concepts)
2. [Getting Started & Local Setup](#2-getting-started--local-setup)
3. [Interactive Prompt Canvas & Dynamic Variables](#3-interactive-prompt-canvas--dynamic-variables)
4. [Git-Style Version Control & Visual Diffing](#4-git-style-version-control--visual-diffing)
5. [Test Scenario Matrix & Evaluation Suite](#5-test-scenario-matrix--evaluation-suite)
6. [1-Click Code Export & Dynamic REST API](#6-1-click-code-export--dynamic-rest-api)
7. [Keyboard Shortcuts Cheatsheet](#7-keyboard-shortcuts-cheatsheet)
8. [Frequently Asked Questions (FAQs)](#8-frequently-asked-questions-faqs)
9. [Troubleshooting & Best Practices](#9-troubleshooting--best-practices)

---

## 1. Overview & Core Concepts

Most modern AI applications suffer from an invisible engineering defect: **Prompt Drift**. Prompts are frequently hardcoded into backend source files, modified directly in transient chat playgrounds, or scattered across wiki pages. When prompts change, teams have no audit trails, no automated regression tests, and no reliable way to roll back when LLM completions degrade.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROMPTFORGE STUDIO WORKFLOW                       │
│                                                                             │
│   1. AUTHOR                 2. TEST                  3. COMMIT              │
│   ┌───────────────┐         ┌───────────────┐        ┌──────────────────┐   │
│   │ Multi-Role    │ ──────> │ Live Variable │ ─────> │ Immutable        │   │
│   │ Canvas        │         │ Sandbox       │        │ Snapshot Tag     │   │
│   └───────────────┘         └───────────────┘        └──────────────────┘   │
│                                                               │             │
│                                                               v             │
│   6. DEPLOY                 5. EXPORT                4. EVALUATE            │
│   ┌───────────────┐         ┌───────────────┐        ┌──────────────────┐   │
│   │ Dynamic REST  │ <────── │ TS / Python / │ <───── │ Scenario Matrix  │   │
│   │ API Route     │         │ cURL SDKs     │        │ Pass/Fail Evals  │   │
│   └───────────────┘         └───────────────┘        └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

PromptForge Studio treats prompts as **first-class software assets**:
- **Structured Multi-Role Templates:** Clear separation of System Instructions, User Templates, and Assistant Preambles.
- **Dynamic Parameter Auto-Detection:** Instant extraction of `{{variable_name}}` placeholders with reactive input controls.
- **Auditable Versioning:** Git-style semantic tags (`v1.0.0`, `v1.2.0-rc1`) with visual word-level diffs and atomic rollback.
- **Deterministic Assertion Matrix:** Multi-scenario regression battery validating keywords, prohibited phrases, and token budgets.
- **Production Integration:** 1-click SDK exports and an embedded dynamic REST API gateway (`/api/prompts/[slug]/production`).

---

## 2. Getting Started & Local Setup

### 2.1 Prerequisites
- **Node.js**: v18.17.0 or v20+ LTS recommended
- **Package Manager**: `npm` (v9+) or `pnpm` / `yarn`
- **Browser**: Modern Chromium, Firefox, or Safari browser
- **Memory**: Minimum 512MB RAM available

### 2.2 Instant 60-Second Setup

Follow these steps to launch PromptForge Studio on your local machine:

```bash
# 1. Clone the repository and navigate to the project root
cd /Users/muttaqi/ai-engineering-team/projects/prompt-forge-saas

# 2. Install dependencies
pnpm install

# 3. Synchronize the SQLite database schema
pnpm run db:push

# 4. Seed sample production prompts (Customer Support, SQL Optimizer, Code Reviewer)
pnpm run db:seed

# 5. Start the Next.js development server
pnpm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

### 2.3 Running with Docker

PromptForge Studio includes a production-ready, multi-stage Alpine Dockerfile:

```bash
# Launch with Docker Compose (includes persistent SQLite volume)
docker compose up -d

# Check live health status
curl -I http://localhost:3000/api/prompts
```

To stop the container:
```bash
docker compose down
```

---

## 3. Interactive Prompt Canvas & Dynamic Variables

The **Prompt Canvas & Sandbox** tab (`Tab 1`) is your primary authoring workbench. It provides a multi-role layout mirrored after modern LLM Chat Completion APIs.

### 3.1 Multi-Role Message Blocks

```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 System Instructions                                      │
│ You are an automated triage bot. Categorize inbound requests │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 👤 User Message Template                                    │
│ Customer ticket: {{customer_query}} (Tier: {{user_tier}})   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Assistant Preamble (Optional Few-Shot Grounding)         │
│ {"status": "ready", "routing": "billing"}                   │
└─────────────────────────────────────────────────────────────┘
```

1. **System Instructions (`role: "system"`):**
   - Establishes the agent persona, guardrails, output format constraints (e.g., "Respond in strict JSON only"), and behavioral boundaries.
2. **User Message Template (`role: "user"`):**
   - The primary dynamic template that downstream applications execute. Supports parameterized variables using double curly braces: `{{variable_name}}`.
3. **Assistant Preamble (`role: "assistant"`):**
   - Optional assistant message used for few-shot prompting, JSON structure seeding, or prefix grounding.
   - You can toggle this role on or off at any time using the header switch.

### 3.2 Dynamic Variable Syntax & Live Extraction

PromptForge features a reactive regex extraction parser with a **150ms debounce**:
- Any text matching `{{[a-zA-Z0-9_-]+}}` across your messages is instantly recognized as a variable.
- As you type `{{customer_query}}` or `{{account_id}}`, the **Variable Sandbox** sidebar dynamically generates an interactive text input for each unique placeholder.
- If you delete a variable from the template, the corresponding input is safely purged while preserving values for your remaining variables.

### 3.3 Live Parameter Sandbox & Interpolated Preview

The right-hand pane provides an **Interpolated Live Preview**:
- Enter real-world values into the sandbox fields (e.g. `customer_query = "Cannot log into my dashboard"`).
- The preview pane instantly re-renders the complete messages payload with variables substituted in real time.
- Variables are visually styled with distinct accent badges so you can inspect exact whitespace and formatting boundaries.

### 3.4 Live Token & Cost Estimation Engine

Directly above the canvas, the **Token & Cost Counter** provides real-time economic transparency:
- **Token Counter:** Calculates estimated tokens using a calibrated ~3.8 characters/token heuristic across standard LLM tokenizers (tiktoken / BPE).
- **Context Window Utilization:** Visual progress bar tracking utilization against the selected model's context ceiling.
- **Estimated Cost Calculator:** Displays:
  - Estimated cost per single execution (e.g., `$0.00018 / run`)
  - Estimated cost per 1,000 invocations (e.g., `$0.18 / 1k runs`)
  - Supports model presets for **GPT-4o**, **Claude 3.5 Sonnet**, and **Gemini 1.5 Pro**.

---

## 4. Git-Style Version Control & Visual Diffing

Never lose a working prompt iteration again. PromptForge Studio provides an auditable, immutable commit ledger directly in the database.

```
  v1.0.0 (Initial Release)
     │
     ▼
  v1.1.0 (Strict JSON Enforcement)
     │
     ▼
  v1.2.0 [PRODUCTION] (Added Few-Shot Grounding + Enterprise SLAs)
```

### 4.1 Creating Version Snapshots

Whenever you are satisfied with a prompt iteration:
1. Click the **"Create Snapshot"** button or press **`Cmd + S`** (macOS) / **`Ctrl + S`** (Windows/Linux).
2. The **Version Snapshot Modal** opens:
   - **Version Tag:** Enter a semantic tag (e.g., `v1.2.0`, `v1.3.0-rc1`, `v2.0.0`). The system validates against duplicate tags.
   - **Commit Description:** Provide a concise note of what changed (e.g., *"Added guardrails against SQL injection and lowered temperature to 0.2"*).
   - **Set as Active Production Version:** Check this box if you want this snapshot to immediately serve live production traffic.
3. Click **"Commit Snapshot"**. An immutable `PromptVersion` record is written to the SQLite database.

### 4.2 Visual Diff Viewer

Navigate to the **History & Visual Diff** tab (`Tab 2`) to visually compare any two versions:
1. **Base Version vs. Target Version:** Select any historical version on the left (e.g., `v1.0.0`) and compare it to a newer version on the right (e.g., `v1.2.0`).
2. **Word-Level Diffs:**
   - Additions are highlighted in **emerald green** (`+ added text`).
   - Deletions are highlighted in **rose red with strikethrough** (`- removed text`).
   - Unmodified text remains clean and neutral.
3. **Change Statistics:** View exact addition and deletion counts (e.g., `+42 additions, -18 deletions`).
4. **Variable Schema Diffing:** The metadata panel explicitly flags newly added or deleted variables:
   - `+ {{account_id}} (Added)`
   - `- {{legacy_tier}} (Removed)`

### 4.3 1-Click Production Promotion & Rollback

PromptForge separates your working draft from the live production release:
- Any committed snapshot can be promoted to production with a single click on **"Promote to Production"**.
- The promotion executes inside an **atomic Prisma transaction** (`prisma.$transaction`), ensuring only one version is marked `isProduction: true` for any prompt.
- **Instant Rollback:** If an updated prompt causes unexpected output in production, navigate to the Visual Diff or History tab, select the previous stable version (e.g., `v1.1.0`), and click **"Promote to Production"**. Live downstream API requests to `/api/prompts/[slug]/production` will immediately revert without redeploying code.

---

## 5. Test Scenario Matrix & Evaluation Suite

Prompt engineering without automated tests is risky. PromptForge includes a built-in **Evaluation Matrix** (`Tab 3`) that allows you to run deterministic regression tests against variable permutations before committing or promoting.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVALUATION TEST MATRIX                              │
├────────────────────────────────┬──────────────────────────┬─────────────────┤
│ Scenario Name                  │ Input Variables          │ Status          │
├────────────────────────────────┼──────────────────────────┼─────────────────┤
│ VIP Enterprise Outage          │ query: "DB cluster down" │ [ PASSED ] 240ms│
│ Billing Double Charge          │ query: "Refund $500"     │ [ PASSED ] 198ms│
│ SQL Injection Security Hazard  │ diff: "SELECT * FROM..." │ [ PASSED ] 310ms│
└────────────────────────────────┴──────────────────────────┴─────────────────┘
```

### 5.1 Defining Test Scenarios

Click **"Add Scenario"** to create a test case:
1. **Scenario Name:** A descriptive title (e.g., *"Enterprise High-Priority Outage"*).
2. **Dynamic Variable Inputs:** Fill in values for all variables detected in the prompt (e.g., `customer_query`, `user_tier`, `account_id`).
3. **Assertion Rules:**
   - **Expected Keywords:** Substrings that *must* appear in the output (e.g., `priority`, `recommended_action`, `category`).
   - **Forbidden Keywords:** Negative assertions that *must not* appear in the output (e.g., `unsupported`, `cannot help`, `DROP TABLE`).
   - **Max Token Boundary:** Token consumption ceiling (e.g., must complete within `< 600` tokens).

### 5.2 Bulk Importing Scenarios via JSON

Have a pre-existing dataset of test cases? Click **"Bulk Import"** in the scenario modal and paste a raw JSON array:

```json
[
  {
    "name": "Password Reset Edge Case",
    "inputVariables": {
      "customer_query": "Forgot password and link expired.",
      "user_tier": "Free",
      "account_id": "ACC-8911"
    },
    "expectedKeywords": ["category", "password_reset"],
    "forbiddenKeywords": ["escalate to manager"],
    "maxTokenLimit": 450
  }
]
```

### 5.3 Executing Batch Evaluations

- **Run Single Scenario:** Click the **Play** button on any scenario row to evaluate that specific case.
- **Run Full Batch:** Click **"Run All Scenarios"** (or press **`Cmd + Enter`** / **`Ctrl + Enter`**).
- **Execution Progress:** The runner processes each scenario in the local sandbox, executing assertion checks against simulated LLM outputs.
- **Detailed Execution Cards:**
  - **Latency:** Measured execution time in milliseconds (e.g., `215ms`).
  - **Tokens & Cost:** Exact output token count and calculated cost per run.
  - **Simulated Completion:** The rendered completion text.
  - **Assertion Checklist:** Color-coded pass/fail badges for every keyword, forbidden phrase, and token limit check.

---

## 6. 1-Click Code Export & Dynamic REST API

Once your prompt is validated, integrating it into your backend or application codebase takes seconds. Navigate to the **Code Export & API** tab (`Tab 4`).

### 6.1 TypeScript (OpenAI SDK)

Generates an asynchronous, fully typed TypeScript function with a dedicated interface for your variables:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CustomerSupportTriageAgentParams {
  customer_query: string;
  user_tier: string;
  account_id: string;
}

export async function runCustomerSupportTriageAgent(params: CustomerSupportTriageAgentParams) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "You are an automated support bot. Output valid JSON only...",
      },
      {
        role: "user",
        content: `Customer query: ${params.customer_query}\nCustomer tier: ${params.user_tier}\nAccount ID: ${params.account_id}`,
      },
      {
        role: "assistant",
        content: "{\"status\": \"ready\", \"context\": \"customer_support\"}",
      }
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
```

### 6.2 Python (OpenAI SDK)

Generates a clean Python 3 function with typed parameter arguments and formatted f-strings:

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def run_customer_support_triage_agent(customer_query: str, user_tier: str, account_id: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": "You are an automated support bot. Output valid JSON only..."
            },
            {
                "role": "user",
                "content": f"""Customer query: {customer_query}
Customer tier: {user_tier}
Account ID: {account_id}"""
            },
            {
                "role": "assistant",
                "content": "{\"status\": \"ready\", \"context\": \"customer_support\"}"
            }
        ]
    )
    return response.choices[0].message.content or ""
```

### 6.3 cURL CLI Command

Produces a ready-to-run terminal command with escaped JSON payload populated with your current sandbox variable values:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
  "model": "gpt-4o",
  "temperature": 0.2,
  "messages": [
    {
      "role": "system",
      "content": "You are an automated support bot. Output valid JSON only..."
    },
    {
      "role": "user",
      "content": "Customer query: Database down\nCustomer tier: Enterprise\nAccount ID: ACC-900"
    }
  ]
}'
```

### 6.4 Dynamic REST API Gateway

PromptForge Studio serves a built-in REST API endpoint for microservices that need to decouple prompts from code deployments:

#### Request
```http
GET /api/prompts/customer-support-triage-agent/production HTTP/1.1
Host: localhost:3000
```

#### Response (`200 OK`)
```json
{
  "slug": "customer-support-triage-agent",
  "version": "v1.2.0",
  "title": "Customer Support Triage Agent",
  "systemPrompt": "You are an automated support bot. Output valid JSON only with keys: category, priority, sentiment, refund_eligible, and recommended_action. Always prioritize Enterprise customers.",
  "userPrompt": "Customer query: {{customer_query}}\nCustomer tier: {{user_tier}}\nAccount ID: {{account_id}}",
  "assistantPrompt": "{\"status\": \"ready\", \"context\": \"customer_support\"}",
  "variables": ["customer_query", "user_tier", "account_id"],
  "modelConfig": {
    "model": "gpt-4o",
    "temperature": 0.2,
    "maxTokens": 1024
  },
  "updatedAt": "2026-10-16T17:00:00.000Z"
}
```

#### Node.js / Next.js Microservice Client Example
```typescript
// Fetch production prompt dynamically with Next.js revalidation
async function fetchActivePrompt(variables: Record<string, string>) {
  const res = await fetch("http://localhost:3000/api/prompts/customer-support-triage-agent/production", {
    next: { revalidate: 60 }, // Cache at edge for 60 seconds
  });
  const data = await res.json();

  let compiledUser = data.userPrompt;
  for (const [key, val] of Object.entries(variables)) {
    compiledUser = compiledUser.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), val);
  }

  return { systemPrompt: data.systemPrompt, userPrompt: compiledUser };
}
```

---

## 7. Keyboard Shortcuts Cheatsheet

Accelerate your workflow with PromptForge Studio keyboard shortcuts:

| Shortcut (macOS) | Shortcut (Windows/Linux) | Action | Scope |
| :--- | :--- | :--- | :--- |
| **`Cmd + S`** | **`Ctrl + S`** | Open Version Snapshot Commit Modal | Global Studio |
| **`Cmd + Enter`** | **`Ctrl + Enter`** | Run All Evaluation Scenarios | Global Studio |
| **`Esc`** | **`Esc`** | Dismiss active modal or slide-over drawer | Modals / Drawers |
| **`Tab`** | **`Tab`** | Navigate between variable input controls | Variable Sandbox |
| **`Shift + Tab`** | **`Shift + Tab`** | Navigate backward through controls | Variable Sandbox |

---

## 8. Frequently Asked Questions (FAQs)

### Q: Where is my prompt data stored? Is my data sent to third-party clouds?
**A:** By default, PromptForge Studio runs on an **embedded SQLite database** stored locally at `prisma/prompt_forge.db`. None of your prompts, variables, versions, or evaluation results are transmitted to external servers or proprietary tracking clouds. You retain 100% data sovereignty.

### Q: How do dynamic variables handle missing values during preview?
**A:** If a variable is detected in `{{placeholder}}` format but has no input provided in the sandbox, the preview highlights the unfilled variable with a dashed warning badge `{{placeholder}}` to alert you before testing or copying code.

### Q: Can PromptForge connect to external databases like PostgreSQL or MySQL?
**A:** Yes! Because PromptForge uses Prisma ORM, you can switch providers from SQLite to PostgreSQL, CockroachDB, MySQL, or Turso simply by updating the `provider` line in `prisma/schema.prisma` and specifying your `DATABASE_URL` connection string in `.env`.

### Q: How does the production version promotion handle race conditions?
**A:** All version promotions run inside an atomic database transaction (`prisma.$transaction`). During promotion, the previous production record's `isProduction` flag is set to `false` and the chosen snapshot is set to `true` synchronously within the same database commit, preventing duplicate active versions.

### Q: Can I run evaluations against live OpenAI or Anthropic API endpoints?
**A:** PromptForge includes an ultra-fast, local deterministic evaluation simulator by default (allowing offline testing without incurring API fees). You can also configure your `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in `.env` to execute live model completions during evaluation runs.

---

## 9. Troubleshooting & Best Practices

| Problem | Cause | Resolution |
| :--- | :--- | :--- |
| **Changes not reflected in REST API** | The prompt version was saved but not promoted to production | Navigate to the History & Visual Diff tab, select your version, and click **"Promote to Production"**. |
| **Duplicate version tag error** | Semantic tags must be globally unique per prompt | Increment your version tag (e.g. from `v1.0.0` to `v1.0.1` or `v1.1.0`). |
| **Variable not showing up in sandbox** | Syntax error in variable braces | Ensure variables use exact double curly braces with no inner line breaks: `{{variable_name}}`. |
| **Evaluation tests fail unexpectedly** | Case-sensitive keyword assertions | Evaluation keywords are case-insensitive by default. Check that your expected output substring matches the generated schema. |
| **Port 3000 already in use** | Another development server is running | Start the studio on a custom port: `PORT=3001 npm run dev`. |

---

*PromptForge Studio — Built for AI Engineers who care about precision, version hygiene, and zero regressions.*
