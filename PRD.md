# Product Requirements Document (PRD)
## PromptForge Studio — Production-Grade Prompt Engineering & Evaluation Suite

- **Document Version:** `1.0.0`
- **Status:** Approved for Implementation
- **Author:** Lead Product Manager
- **Target Release:** MVP v1.0.0
- **Workspace:** `/Users/muttaqi/ai-engineering-team/projects/prompt-forge-saas`

---

## 1. Executive Summary & Value Proposition

### 1.1 Executive Summary
Modern generative AI development suffers from a significant engineering gap: prompt templates are frequently scattered across codebase strings, hardcoded in microservices, or manually tested in transient web playgrounds with zero version auditing, validation, or regression safeguards. When updates break downstream tasks, teams lack diffing, release tagging, and rollbacks.

**PromptForge Studio** is a developer-first prompt management, variable testing, and evaluation studio. Built on Next.js, Tailwind CSS, TypeScript, and SQLite (via Prisma), PromptForge delivers an offline-capable, local-first workbench where engineers, prompt designers, and AI application developers can author multi-role prompts, test dynamic inputs against matrices of edge cases, track semantic version tags, and export integration-ready code snippets.

### 1.2 Value Proposition
- **Eliminate Prompt Drift:** Treat prompts as first-class code assets with immutable snapshots, semantic tags (`v1.0.0`, `v1.1.0-preview`, `production`), and visual side-by-side diffing.
- **Fail-Safe Dynamic Variable Handling:** Automatically detect parameters in `{{variable_name}}` syntax and bind them to reactive UI input controls with real-time token/cost projections and validation.
- **Prevent LLM Regressions:** Run multi-scenario test batches with deterministic assertion rules (keyword matching, schema validity, token constraints) prior to publishing.
- **Zero-Friction Developer Workflow:** Instant code generation (TypeScript, Python, cURL) and a local REST API endpoint (`/api/prompts/[slug]`) allowing applications to fetch active prompt templates dynamically.
- **Privacy & Portability:** Embedded SQLite architecture requires no SaaS lock-in, third-party tracking, or external database provisioning.

### 1.3 Target Personas
1. **AI Application Engineer:** Needs reproducible prompt templates, type-safe integration code, and instant validation against production schemas.
2. **Prompt Engineer / Product Designer:** Needs an intuitive UI to iterate on system instructions, few-shot examples, and dynamic variables without touching raw backend code.
3. **Indie SaaS Founder:** Requires a lightweight prompt management layer with zero subscription overhead, token cost transparency, and regression protection.

### 1.4 Success Metrics (KPIs)
- **Time-to-Integration:** Developer can author a variable-driven prompt and copy working SDK code within < 3 minutes.
- **Regression Detection Rate:** 100% of assertion rule failures caught during local test suite execution before release tagging.
- **Zero Setup Latency:** App launches locally with SQLite in under 15 seconds without external cloud API dependencies.

---

## 2. Product Architecture & Technical Stack

```
+-----------------------------------------------------------------------------------+
|                              PromptForge Studio (Next.js)                         |
|                                                                                   |
|  +-------------------+  +-----------------------+  +---------------------------+  |
|  |   Prompt Canvas   |  |   Variable Sandbox    |  |    Version & Git Diff     |  |
|  | - System Prompt   |  | - Live Detection      |  | - Snapshot Commits        |  |
|  | - User Message    |  | - Reactive Preview    |  | - Semantic Tags           |  |
|  | - Assistant Seed  |  | - Token/Cost Counter  |  | - Visual Diff Engine      |  |
|  +-------------------+  +-----------------------+  +---------------------------+  |
|                                                                                   |
|  +----------------------------------------------+  +---------------------------+  |
|  |         Test Matrix & Scenario Runner        |  |    Code Export & API      |  |
|  | - Test Cases & Multi-Variable Datasets       |  | - TS / Python / cURL      |  |
|  | - Assertion Engine (Regex/Keyword/Tokens)    |  | - /api/prompts/[slug]     |  |
|  +----------------------------------------------+  +---------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                   Prisma ORM & Embedded SQLite Database                     |  |
|  |    [Project]  <-->  [Prompt]  <-->  [PromptVersion]  <-->  [TestCase]       |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### 2.1 Core Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Actions, API routes)
- **Language:** TypeScript 5.x (Strict mode)
- **Styling & UI:** Tailwind CSS, Lucide React, Radix UI primitives, syntax highlighter
- **Database:** SQLite running via Prisma ORM
- **State Management:** Reactive Client State (React Context / Zustand / Hooks) with optimistic UI updates

### 2.2 Relational Data Model (Prisma)
- **`Project`**: High-level organization container (`id`, `name`, `slug`, `description`, `createdAt`, `updatedAt`).
- **`Prompt`**: Canonical prompt definition (`id`, `projectId`, `title`, `slug`, `description`, `activeVersionId`, `createdAt`, `updatedAt`).
- **`PromptVersion`**: Immutable commit snapshot (`id`, `promptId`, `versionTag`, `commitMessage`, `systemPrompt`, `userPrompt`, `assistantPrompt`, `modelConfig` [JSON], `variables` [JSON], `isProduction`, `createdAt`).
- **`TestCase`**: Evaluation scenarios (`id`, `promptId`, `name`, `inputVariables` [JSON], `expectedKeywords` [JSON], `forbiddenKeywords` [JSON], `maxTokenLimit`, `createdAt`, `updatedAt`).
- **`TestExecution`**: Historical run records (`id`, `promptVersionId`, `testCaseId`, `interpolatedPrompt`, `simulatedOutput`, `status` [PASSED/FAILED], `latencyMs`, `tokenCount`, `failureReason`, `executedAt`).

---

## 3. User Stories & Gherkin Acceptance Criteria

### Epic 1: Interactive Prompt Canvas & Dynamic Variable Engine

#### US-1.1: Multi-Role Message Authoring
**As an** AI engineer,  
**I want to** compose prompts separated into distinct System, User, and Assistant message blocks,  
**So that** my prompt structures accurately mirror production Chat Completion APIs.

- **Scenario 1: Authoring multi-role messages**
  - **Given** I am in the Prompt Canvas for a selected prompt
  - **When** I enter text into the "System Instructions", "User Template", and "Assistant Preamble" fields
  - **Then** the canvas updates the composed payload immediately
  - **And** displays visual badges indicating the role of each block.

- **Scenario 2: Collapsing or toggling optional roles**
  - **Given** I do not require an Assistant few-shot message
  - **When** I toggle off or clear the Assistant role block
  - **Then** the final assembled prompt excludes the Assistant message block without validation errors.

#### US-1.2: Dynamic Parameter Auto-Detection & Input Sandbox
**As a** prompt designer,  
**I want** the canvas to automatically parse `{{variable_name}}` placeholders from all active messages,  
**So that** I get an interactive parameter form without manual schema definitions.

- **Scenario 1: Live variable extraction**
  - **Given** I am editing the User Template with `Analyze the sentiment of: {{customer_review}} using {{target_language}}`
  - **When** I stop typing for 150 milliseconds
  - **Then** the Variable Panel detects `customer_review` and `target_language`
  - **And** generates corresponding dynamic text input fields in the sandbox sidebar.

- **Scenario 2: Variable removal cleanup**
  - **Given** `{{target_language}}` exists in the Variable Panel
  - **When** I delete `{{target_language}}` from the prompt editor
  - **Then** the Variable Panel dynamically removes the input field
  - **And** retains any values for remaining active variables.

#### US-1.3: Real-Time Substitution & Token Cost Estimation
**As an** application developer,  
**I want to** preview the compiled prompt with substituted variables and view live token and cost estimates,  
**So that** I stay within context window limits and budget boundaries.

- **Scenario 1: Live parameter preview**
  - **Given** the variable `customer_review` is filled with `"The app is lightning fast!"`
  - **When** I view the "Interpolated Preview" tab
  - **Then** `{{customer_review}}` is replaced with `"The app is lightning fast!"` in the preview pane
  - **And** highlighted with a distinct visual pill/background.

- **Scenario 2: Token and cost estimation counter**
  - **Given** an interpolated prompt totaling 420 words
  - **When** I select a target model (e.g. GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro)
  - **Then** the UI displays the estimated token count (~560 tokens)
  - **And** displays estimated cost per 1k invocations based on standard pricing tables.

---

### Epic 2: Git-Style Version Control & Visual Diffing

#### US-2.1: Snapshot Commits & Semantic Tagging
**As an** AI engineering lead,  
**I want to** commit immutable prompt snapshots with semantic tags and change descriptions,  
**So that** our team maintains an auditable history of prompt iterations.

- **Scenario 1: Creating a version snapshot**
  - **Given** I have modified the system prompt and validated variables
  - **When** I click "Create Version Snapshot"
  - **And** I supply version tag `"v1.2.0"`, label `"Production Candidate"`, and commit message `"Tightened output format to strict JSON"`
  - **Then** a new immutable `PromptVersion` record is saved to SQLite
  - **And** the version dropdown reflects `v1.2.0` as the current selected version.

- **Scenario 2: Rejecting duplicate semantic tags**
  - **Given** version `"v1.0.0"` already exists for the prompt
  - **When** I attempt to save a new snapshot with tag `"v1.0.0"`
  - **Then** the system displays a clear validation error `"Version tag 'v1.0.0' already exists for this prompt"`
  - **And** prevents snapshot creation until the tag is made unique.

#### US-2.2: Visual Diff Engine
**As a** reviewer,  
**I want to** visually compare any two versions of a prompt side-by-side with additions and deletions highlighted,  
**So that** I can immediately understand changes before deploying.

- **Scenario 1: Inspecting differences between versions**
  - **Given** I have version `v1.0.0` and `v1.1.0` in history
  - **When** I open the "Visual Diff" view and select `v1.0.0` as base and `v1.1.0` as target
  - **Then** the interface displays green highlights for added text and red strike-through highlights for removed text
  - **And** shows diff metrics (`+24 additions, -8 deletions`).

- **Scenario 2: Parameter schema diffing**
  - **Given** `v1.1.0` introduced a new variable `{{strict_mode}}`
  - **When** I view the diff
  - **Then** the variable changes list explicitly flags `+ {{strict_mode}} (Added)` in the metadata diff pane.

#### US-2.3: Production Release Promotion & Rollback
**As a** DevOps or AI engineer,  
**I want to** designate a specific version as the active `Production` release with 1-click rollback,  
**So that** downstream API consumers immediately receive the correct prompt version.

- **Scenario 1: Promoting a version to Production**
  - **Given** version `v1.2.0` is tested and verified
  - **When** I click "Promote to Production"
  - **Then** `v1.2.0` has its `isProduction` flag set to `true`
  - **And** any previous production version flag is transitioned to historical status
  - **And** the production status badge updates throughout the UI.

- **Scenario 2: Instant rollback**
  - **Given** `v1.2.0` is currently active in production
  - **When** an issue is detected and I click "Rollback to v1.1.0"
  - **Then** `v1.1.0` is immediately marked as `isProduction = true`
  - **And** subsequent API queries to `/api/prompts/[slug]` serve `v1.1.0` content.

---

### Epic 3: Multi-Scenario Test Matrix & Evaluation Suite

#### US-3.1: Test Scenario Dataset Management
**As a** QA / prompt engineer,  
**I want to** build and persist a table of test scenarios with variable inputs and expected assertions,  
**So that** I can verify prompt robustness across diverse edge cases.

- **Scenario 1: Adding a test case**
  - **Given** a prompt has dynamic variables `{{query}}` and `{{user_tier}}`
  - **When** I click "Add Test Case"
  - **And** I input Scenario Name: `"VIP Customer Refund Request"`, `query`: `"Where is my $500 refund?"`, `user_tier`: `"Platinum"`
  - **And** I set assertion rule `Contains keyword: "priority_agent"`
  - **Then** the test case is stored in the database linked to this prompt.

- **Scenario 2: Importing test cases via JSON**
  - **Given** I have a pre-existing JSON array of test cases
  - **When** I paste the JSON into the "Bulk Import" modal and submit
  - **Then** the test cases are validated against the prompt's required variables
  - **And** added to the active test matrix.

#### US-3.2: Batch Scenario Evaluation Execution
**As an** AI developer,  
**I want to** execute the prompt against all saved test scenarios in a single batch,  
**So that** I can review outputs and assertion results side-by-side.

- **Scenario 1: Running the full test suite**
  - **Given** a prompt with 5 configured test cases
  - **When** I click "Run All Scenarios"
  - **Then** the runner executes each test case sequentially or concurrently in the local execution sandbox
  - **And** displays a live progress indicator (`Running 3 of 5...`)
  - **And** writes `TestExecution` logs with execution latency and token metrics.

- **Scenario 2: Evaluating pass/fail assertions**
  - **Given** Test Case 1 requires keyword `"refund_approved"`
  - **When** the generated or simulated completion contains `"Your refund_approved status is valid"`
  - **Then** the test status displays as `PASSED` with a green indicator
  - **When** Test Case 2 expects keyword `"escalate"` but it is absent
  - **Then** the test status displays as `FAILED` with a red badge and explicit diff: `"Missing required keyword: 'escalate'"`.

---

### Epic 4: Integration Code Export & Dynamic Prompt API

#### US-4.1: Multi-Language Code Snippet Generation
**As a** software engineer,  
**I want to** copy ready-to-run integration snippets for TypeScript, Python, and cURL,  
**So that** I can embed the prompt into my application code without manual formatting.

- **Scenario 1: Exporting TypeScript OpenAI SDK snippet**
  - **Given** I am viewing an active prompt version
  - **When** I navigate to the "Code Export" drawer and select "TypeScript (OpenAI)"
  - **Then** the system renders a syntactically correct TypeScript snippet using `openai.chat.completions.create`
  - **And** parameterized variables are mapped to an input options object
  - **And** a "Copy Code" button copies the exact snippet to the clipboard with confirmation toast.

- **Scenario 2: Exporting cURL command**
  - **Given** I select "cURL" in the export drawer
  - **When** dynamic variable values are present in the preview
  - **Then** the generated cURL command contains escaped JSON with the substituted variables ready for terminal testing.

#### US-4.2: Dynamic Prompt API Route
**As an** application service,  
**I want to** query `GET /api/prompts/[slug]` to retrieve the current active production prompt payload,  
**So that** microservices can update prompts remotely without redeploying backend code.

- **Scenario 1: Fetching active production prompt**
  - **Given** a prompt with slug `"customer-support-agent"` has `v1.2.0` marked as `isProduction`
  - **When** an HTTP GET request is made to `/api/prompts/customer-support-agent`
  - **Then** the API responds with HTTP 200 and a JSON payload containing:
    ```json
    {
      "slug": "customer-support-agent",
      "version": "v1.2.0",
      "systemPrompt": "You are a courteous support agent...",
      "userPrompt": "Customer message: {{message}}",
      "assistantPrompt": null,
      "variables": ["message"],
      "updatedAt": "2026-10-16T17:00:00Z"
    }
    ```

- **Scenario 2: Requesting non-existent prompt**
  - **Given** slug `"unknown-prompt"` does not exist
  - **When** an HTTP GET request is made to `/api/prompts/unknown-prompt`
  - **Then** the API responds with HTTP 404 and `{ "error": "Prompt not found" }`.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 UI Speed & Interaction Latency
- **Variable Substitution Latency:** Dynamic regex parsing and preview interpolation must execute in **< 30ms** for templates up to 10,000 characters.
- **Client-Side Rendering:** Route transitions and tab switching (Canvas <-> History <-> Tests <-> Export) must complete in **< 100ms** without UI jitter or layout shifts.
- **Debounced Parsing:** Editor changes must debounce variable extraction at **150ms** to prevent unnecessary re-renders while typing.

### 4.2 Responsive & Accessible Tailwind Design
- **Accessibility Standards:** Compliant with **WCAG 2.1 Level AA**:
  - Minimum contrast ratio of 4.5:1 for standard text and 3:1 for controls.
  - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`) on all interactive buttons, inputs, and tabs.
  - ARIA attributes (`aria-expanded`, `aria-selected`, `role="tab"`, `role="dialog"`) on modals, dropdowns, and tabs.
- **Design System Aesthetic:**
  - Modern dark-mode-first developer aesthetic (slate/zinc palette with subtle border rings, glowing accents, and high-legibility monospace fonts for prompt editors).
  - Responsive layouts supporting viewports from desktop workstations (1920x1080, split-screen panels) down to 1024px tablets.
- **Keyboard Navigation:** Full keyboard shortcut accessibility (`Cmd/Ctrl + S` to save snapshot, `Cmd/Ctrl + Enter` to run preview/tests, `Esc` to close modals).

### 4.3 Persistence & Offline-First Architecture
- **Zero Cloud Lock-In:** Powered by a local SQLite database file via Prisma ORM; runs completely self-contained without mandatory cloud account creation or internet connection.
- **Data Integrity & Transactions:** Snapshot creation and production version promotion must execute in Prisma database transactions (`prisma.$transaction`) to guarantee zero orphaned or conflicting production flags.
- **Deterministic Migrations:** Prisma schema migrations checked into source control for deterministic reproduction across developer environments.

### 4.4 Security & Input Safety
- **XSS & Injection Protection:** All variable substitutions rendered in the preview DOM must be strictly sanitized and escaped to prevent client-side HTML/script injection.
- **Local Sandbox Execution:** Prompt execution and assertion matching must execute in a memory-bounded local sandbox without evaluating untrusted arbitrary scripts (`eval` or `Function` constructors strictly forbidden).

---

## 5. Explicit MVP Scope Boundaries

| Area | In-Scope for MVP (v1.0.0) | Out-of-Scope (Post-MVP Roadmap) |
|---|---|---|
| **Prompt Canvas** | • Multi-message role editor (System, User, Assistant)<br>• Real-time `{{var}}` regex detection<br>• Dynamic variable form generation<br>• Live interpolated preview tab<br>• Token count & cost calculation preview | • Multi-modal prompt inputs (images, audio uploads)<br>• Collaborative real-time multiplayer cursor editing (WebSockets/CRDTs)<br>• Audio-to-prompt transcription |
| **Version Control** | • Immutable snapshot commits with semantic tags (`v1.0.0`)<br>• Commit descriptions & metadata<br>• Side-by-side visual text diffing (additions/deletions)<br>• Production release promotion & 1-click rollback | • Git remote sync (GitHub PR integration / branch merging)<br>• Granular multi-user permissions (RBAC / Team roles) |
| **Test Matrix & Evals** | • Test case dataset builder (variable inputs + expected rules)<br>• Deterministic assertion engine (contains keyword, excluded keyword, token limit)<br>• Batch test runner with pass/fail badges<br>• Local simulated LLM output generator & test logger | • Live asynchronous LLM provider benchmark sweeps across 10+ cloud APIs simultaneously<br>• LLM-as-a-judge evaluation scoring with GPT-4 evaluators<br>• Synthetic dataset generation via external LLMs |
| **Integration & API** | • Instant code export for TypeScript (OpenAI SDK), Python, and cURL<br>• Next.js REST API route (`GET /api/prompts/[slug]`) returning active production prompt payload<br>• One-click clipboard copying with toast confirmation | • Full bidirectional GraphQL API<br>• Webhook notifications on prompt version updates<br>• Hosted edge proxy for live prompt caching (Cloudflare Workers) |
| **Storage & Infra** | • Embedded SQLite via Prisma ORM<br>• Automatic schema migration on startup<br>• Local environment variables configuration | • Cloud PostgreSQL / CockroachDB multi-tenant clustering<br>• SSO / OAuth authentication (Google, GitHub, SAML) |

---

## 6. Implementation Milestones & Roadmap

- **Milestone 1: Database & Core Data Layer**
  - Setup Prisma schema with `Project`, `Prompt`, `PromptVersion`, `TestCase`, and `TestExecution`.
  - SQLite database seeding with rich sample prompts (e.g., Code Reviewer, Support Bot, SQL Generator).
- **Milestone 2: Prompt Canvas & Dynamic Variable Engine**
  - Implement split-pane editor with System/User/Assistant text areas.
  - Implement reactive regex variable parser and dynamic input sandbox.
  - Integrate token estimator and pricing calculator.
- **Milestone 3: Version Control & Visual Diffing**
  - Implement version snapshot modal with tag validation.
  - Build visual diff component with token change metrics.
  - Implement production promotion and rollback actions.
- **Milestone 4: Test Matrix & Evaluation Suite**
  - Build test scenario dataset table and assertion builder.
  - Implement batch execution harness with pass/fail visual status indicators.
- **Milestone 5: Code Snippet Export & REST API**
  - Build TypeScript, Python, and cURL code generation drawers.
  - Implement `/api/prompts/[slug]` endpoint with production resolution.
- **Milestone 6: Verification, Polishing & Documentation**
  - End-to-end user flow testing across dark/light modes.
  - Verification of responsive layouts and keyboard shortcuts.
