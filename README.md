# PromptForge Studio

<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/terminal.svg" width="64" height="64" alt="PromptForge Logo" />
</p>

<p align="center">
  <strong>Production-Grade Prompt Engineering, Testing, and Evaluation Workbench.</strong><br>
  Treat AI prompts as first-class software assets with Git-style versioning, dynamic variable sandboxing, deterministic regression matrices, and 1-click SDK exports.
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Next.js-14.2.15-black?style=flat-square&logo=next.js" alt="Next.js 14" /></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript" alt="TypeScript 5" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Prisma-5.22.0-indigo?style=flat-square&logo=prisma" alt="Prisma ORM" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/SQLite-Local--First-teal?style=flat-square&logo=sqlite" alt="SQLite" /></a>
  <a href="#-tests"><img src="https://img.shields.io/badge/Tests-36%2F36%20Passed-emerald?style=flat-square&logo=checkmarx" alt="36/36 Tests Passing" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-amber?style=flat-square" alt="MIT License" /></a>
  <a href="DEPLOYMENT.md"><img src="https://img.shields.io/badge/Deployment-Verified-brightgreen?style=flat-square" alt="Deployment Verified" /></a>
</p>

<p align="center">
  <a href="USER_GUIDE.md"><strong>Read the User Guide »</strong></a> ·
  <a href="DEPLOYMENT.md"><strong>Deployment Manual »</strong></a> ·
  <a href="LAUNCH.md"><strong>Launch Kit & Collateral »</strong></a> ·
  <a href="#-rest-api-reference"><strong>API Reference »</strong></a>
</p>

---

## 🌟 Why PromptForge Studio?

Modern generative AI development suffers from **Prompt Drift**: prompt templates are frequently scattered across codebase strings, tweaked haphazardly in web playgrounds, or updated without version audits or regression safeguards. When a prompt edit breaks downstream JSON parsing or customer flows, teams have no audit logs, no diffs, and no way to roll back.

**PromptForge Studio** bridges the gap between ad-hoc prompt tweaking and production software engineering:

- 🎨 **Multi-Role Prompt Canvas:** Author structured System Instructions, User Templates, and Assistant few-shot preambles with role-based visual cards.
- ⚡ **Reactive Dynamic Variables:** Auto-extracts `{{variable_name}}` placeholders in real-time (150ms debounce) with reactive sandbox form controls and live interpolated previews.
- 💰 **Real-Time Token & Cost Counter:** Instant heuristic token analysis (~3.8 char/token) with live cost-per-execution and cost-per-1k-run projections across GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro.
- 🔀 **Git-Style Version Control:** Immutable snapshot commits with semantic tags (`v1.0.0`, `v1.2.0-preview`) and changelog notes.
- 🔍 **Visual Word-Level Diffing:** Compare any two versions side-by-side with color-coded additions, deletions, change statistics, and variable schema diffs.
- 🛡️ **Scenario Evaluation Matrix:** Run multi-scenario test suites with deterministic assertions (required keywords, forbidden terms, token ceilings) before shipping.
- 📦 **1-Click Code Generation:** Copy production-ready snippets for TypeScript (OpenAI SDK), Python, and cURL.
- 🔌 **Dynamic REST API Gateway:** Query `GET /api/prompts/[slug]/production` so microservices fetch the latest active prompt without redeploying code.
- 🔒 **100% Local-First & Private:** Embedded SQLite via Prisma ORM with zero mandatory cloud accounts, tracking telemetry, or subscription paywalls.

---

## 🚀 Quick Start

### Option 1: Local Development (< 60 seconds)

```bash
# 1. Clone repository and install dependencies
git clone https://github.com/iammuttaqi/ai-engineering-team.git
cd ai-engineering-team/projects/prompt-forge-saas
pnpm install

# 2. Push SQLite database schema and seed default prompts
pnpm run db:push
pnpm run db:seed

# 3. Start the Next.js development server
pnpm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Option 2: Docker & Docker Compose

Run PromptForge Studio inside an isolated, hardened Alpine container with persistent SQLite storage:

```bash
# Build and run container in detached mode
docker compose up -d

# Verify container health status
curl -I http://localhost:3000/api/prompts
```

To view logs or stop the service:
```bash
docker compose logs -f
docker compose down
```

---

### Option 3: Production Build

```bash
# Compile optimized standalone production bundle
pnpm run build

# Start the production HTTP server
pnpm start
```

---

## ⌨️ Keyboard Shortcuts

Speed up your authoring and evaluation workflows with built-in shortcuts:

| Shortcut (macOS) | Shortcut (Windows/Linux) | Action | Scope |
| :--- | :--- | :--- | :--- |
| **`Cmd + S`** | **`Ctrl + S`** | Open Version Snapshot Commit Modal | Global Studio |
| **`Cmd + Enter`** | **`Ctrl + Enter`** | Run All Evaluation Scenarios | Global Studio |
| **`Esc`** | **`Esc`** | Close open modals or drawers | Modals |
| **`Tab`** | **`Tab`** | Step through dynamic variable inputs | Variable Sandbox |

---

## 🔌 REST API Reference

PromptForge Studio includes a built-in REST API for microservices and CI/CD pipelines:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/prompts` | List all prompt containers with active version summaries |
| `POST` | `/api/prompts` | Create new prompt container with initial `v1.0.0` snapshot |
| `GET` | `/api/prompts/[id]` | Fetch prompt details by ID or slug with full version history |
| `PUT` | `/api/prompts/[id]` | Update prompt title, slug, or active version pointer |
| `DELETE` | `/api/prompts/[id]` | Delete prompt and cascade-delete all associated versions and scenarios |
| `POST` | `/api/prompts/[id]/versions` | Commit a new immutable version snapshot with semantic tag |
| `POST` | `/api/prompts/[id]/promote` | Atomically promote or rollback active production version |
| `GET` | `/api/prompts/[slug]/production` | **Live Gateway:** Fetch active production prompt template for microservices |
| `GET` | `/api/scenarios` | List evaluation test scenarios for a given prompt |
| `POST` | `/api/scenarios` | Create single scenario or bulk-import JSON test matrix |
| `PUT` | `/api/scenarios/[id]` | Update scenario inputs or assertion criteria |
| `DELETE` | `/api/scenarios/[id]` | Delete test scenario |
| `POST` | `/api/evaluate` | Execute evaluation batch runner against prompt and scenarios |

### Example: Fetching Active Production Prompt
```bash
curl http://localhost:3000/api/prompts/customer-support-triage-agent/production
```

Response:
```json
{
  "slug": "customer-support-triage-agent",
  "version": "v1.2.0",
  "title": "Customer Support Triage Agent",
  "systemPrompt": "You are an automated support bot. Output valid JSON only...",
  "userPrompt": "Customer query: {{customer_query}}\nCustomer tier: {{user_tier}}",
  "assistantPrompt": "{\"status\": \"ready\", \"context\": \"customer_support\"}",
  "variables": ["customer_query", "user_tier"],
  "modelConfig": {
    "model": "gpt-4o",
    "temperature": 0.2,
    "maxTokens": 1024
  },
  "updatedAt": "2026-10-16T17:00:00.000Z"
}
```

---

## 🏗️ Architecture & Data Model

PromptForge Studio is architected around an embedded relational SQLite schema via Prisma ORM:

```
[Project] 1 ──── * [Prompt] 1 ──── * [PromptVersion] (Immutable snapshots)
                        │                     │
                        │ 1                   │ 1
                        ▼ *                   ▼ *
                  [TestCase] 1 ────────── * [EvaluationResult]
```

- **`Project`**: Organization container grouping related prompts and services.
- **`Prompt`**: Canonical entity maintaining current metadata and the active production version pointer.
- **`PromptVersion`**: Immutable snapshot containing System, User, and Assistant templates, model configuration, variable schemas, and change descriptions.
- **`TestCase`**: Evaluation scenarios containing dynamic input variables and deterministic pass/fail assertion rules.
- **`EvaluationResult`**: Historical log records tracking simulated LLM completions, latency (ms), token counts, costs, and assertion statuses.

---

## 🧪 Testing & Verification

The suite includes 36 comprehensive tests covering regex variable parsing, template interpolation, visual diff calculations, token estimation, and code generators:

```bash
# Run unit and integration test suite
pnpm test
```

Result:
```text
✓ tests/variableParser.test.ts (11 tests passed)
✓ tests/diffEngine.test.ts (10 tests passed)
✓ tests/tokenCounter.test.ts (8 tests passed)
✓ tests/codeGenerators.test.ts (7 tests passed)

Test Files  4 passed (4)
Tests       36 passed (36)
Pass Rate   100%
```

---

## 📚 Documentation Index

- 📘 [**USER_GUIDE.md**](USER_GUIDE.md): Complete walkthrough of Prompt Canvas, Variable Sandboxing, Git Versioning, Evaluation Matrices, SDK Exports, and FAQs.
- 🚀 [**DEPLOYMENT.md**](DEPLOYMENT.md): Production deployment guides for Docker, Vercel, Railway, Fly.io, and standalone servers.
- 📣 [**LAUNCH.md**](LAUNCH.md): Product Hunt kit, 4-tweet launch thread, Reddit r/SideProject showcase, and Hacker News Show HN draft.
- 📐 [**ARCHITECTURE.md**](ARCHITECTURE.md): Technical architecture specification and system design.
- 📋 [**PRD.md**](PRD.md): Product requirements document and Gherkin acceptance criteria.

---

## 📄 License

PromptForge Studio is open-source software licensed under the [MIT License](LICENSE).
