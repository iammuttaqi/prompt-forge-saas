import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with realistic prompt templates, versions, and test scenarios...");

  // Clean existing records
  await prisma.evaluationResult.deleteMany();
  await prisma.testScenario.deleteMany();
  await prisma.promptVersion.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.project.deleteMany();

  // Create Project
  const project = await prisma.project.create({
    data: {
      name: "Core AI Applications",
      slug: "core-ai-applications",
      description: "Production prompt templates for customer support, database diagnostics, and developer tooling.",
    },
  });

  // Prompt 1: Customer Support Triage Agent
  const p1 = await prisma.prompt.create({
    data: {
      projectId: project.id,
      title: "Customer Support Triage Agent",
      slug: "customer-support-triage-agent",
      description: "Classifies inbound customer tickets, extracts sentiment, and suggests routing priority.",
    },
  });

  const p1v1 = await prisma.promptVersion.create({
    data: {
      promptId: p1.id,
      versionTag: "v1.0.0",
      commitMessage: "Initial version with basic ticket categorization",
      systemPrompt: "You are an automated support bot. Categorize inbound user requests into Billing, Technical, or General.",
      userPrompt: "Customer ticket:\n{{customer_query}}\n\nUser tier: {{user_tier}}",
      assistantPrompt: null,
      modelConfig: JSON.stringify({ model: "gpt-4o", temperature: 0.5, maxTokens: 512 }),
      variables: JSON.stringify(["customer_query", "user_tier"]),
      isProduction: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const p1v2 = await prisma.promptVersion.create({
    data: {
      promptId: p1.id,
      versionTag: "v1.1.0",
      commitMessage: "Enforced strict JSON output schema and added account ID variable",
      systemPrompt: "You are an automated support bot. Output valid JSON only with keys: category, priority, sentiment, and recommended_action.",
      userPrompt: "Customer query: {{customer_query}}\nCustomer tier: {{user_tier}}\nAccount ID: {{account_id}}",
      assistantPrompt: "{\"status\": \"ready\", \"context\": \"customer_support\"}",
      modelConfig: JSON.stringify({ model: "gpt-4o", temperature: 0.3, maxTokens: 1024 }),
      variables: JSON.stringify(["customer_query", "user_tier", "account_id"]),
      isProduction: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const p1v3 = await prisma.promptVersion.create({
    data: {
      promptId: p1.id,
      versionTag: "v1.2.0",
      commitMessage: "Added few-shot grounding, refund priority rules, and latency limits",
      systemPrompt: "You are an automated support bot. Output valid JSON only with keys: category, priority, sentiment, refund_eligible, and recommended_action. Always prioritize Enterprise customers.",
      userPrompt: "Customer query: {{customer_query}}\nCustomer tier: {{user_tier}}\nAccount ID: {{account_id}}",
      assistantPrompt: "{\"status\": \"ready\", \"context\": \"customer_support\"}",
      modelConfig: JSON.stringify({ model: "gpt-4o", temperature: 0.2, maxTokens: 1024 }),
      variables: JSON.stringify(["customer_query", "user_tier", "account_id"]),
      isProduction: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Link active version
  await prisma.prompt.update({
    where: { id: p1.id },
    data: { activeVersionId: p1v3.id },
  });

  // Test Scenarios for Prompt 1
  const scen1 = await prisma.testScenario.create({
    data: {
      promptId: p1.id,
      name: "Enterprise High-Priority Outage",
      inputVariables: JSON.stringify({
        customer_query: "Production database cluster is unreachable! Customers cannot check out. Please escalate immediately!",
        user_tier: "Enterprise",
        account_id: "ACC-CORP-900",
      }),
      expectedKeywords: JSON.stringify(["priority", "category", "recommended_action"]),
      forbiddenKeywords: JSON.stringify(["unsupported", "cannot help"]),
      maxTokenLimit: 600,
    },
  });

  const scen2 = await prisma.testScenario.create({
    data: {
      promptId: p1.id,
      name: "Billing Refund Request",
      inputVariables: JSON.stringify({
        customer_query: "I was billed twice on my invoice #9822 for $500. Where is my refund?",
        user_tier: "Gold",
        account_id: "ACC-5412",
      }),
      expectedKeywords: JSON.stringify(["refund_eligible", "category"]),
      forbiddenKeywords: JSON.stringify(["unauthorized"]),
      maxTokenLimit: 500,
    },
  });

  const scen3 = await prisma.testScenario.create({
    data: {
      promptId: p1.id,
      name: "Free Tier Password Reset",
      inputVariables: JSON.stringify({
        customer_query: "Forgot my password and reset email is not arriving.",
        user_tier: "Free",
        account_id: "ACC-0199",
      }),
      expectedKeywords: JSON.stringify(["category", "recommended_action"]),
      forbiddenKeywords: JSON.stringify(["escalate to director"]),
      maxTokenLimit: 400,
    },
  });

  // Create Evaluation Results for Prompt 1 (v1.2.0)
  await prisma.evaluationResult.create({
    data: {
      promptVersionId: p1v3.id,
      scenarioId: scen1.id,
      interpolatedPrompt: `System: You are an automated support bot...\nUser: Customer query: Production database cluster is unreachable!\nCustomer tier: Enterprise\nAccount ID: ACC-CORP-900`,
      simulatedOutput: JSON.stringify(
        {
          category: "technical_infrastructure",
          priority: "P0_CRITICAL",
          sentiment: "urgent_negative",
          refund_eligible: false,
          recommended_action: "Page on-call SRE and notify dedicated enterprise TAM immediately.",
        },
        null,
        2
      ),
      status: "PASSED",
      latencyMs: 240,
      tokenCount: 95,
      estimatedCost: 0.0019,
    },
  });

  await prisma.evaluationResult.create({
    data: {
      promptVersionId: p1v3.id,
      scenarioId: scen2.id,
      interpolatedPrompt: `System: You are an automated support bot...\nUser: Customer query: I was billed twice on my invoice #9822 for $500.\nCustomer tier: Gold\nAccount ID: ACC-5412`,
      simulatedOutput: JSON.stringify(
        {
          category: "billing",
          priority: "high",
          sentiment: "frustrated",
          refund_eligible: true,
          recommended_action: "Verify Stripe invoice #9822 and issue $500 credit adjustment.",
        },
        null,
        2
      ),
      status: "PASSED",
      latencyMs: 198,
      tokenCount: 88,
      estimatedCost: 0.0017,
    },
  });

  // Prompt 2: SQL Query Optimization Expert
  const p2 = await prisma.prompt.create({
    data: {
      projectId: project.id,
      title: "SQL Query Optimization Expert",
      slug: "sql-query-optimization-expert",
      description: "Analyzes PostgreSQL EXPLAIN plans and recommends indexes, rewrites, and partition strategies.",
    },
  });

  const p2v1 = await prisma.promptVersion.create({
    data: {
      promptId: p2.id,
      versionTag: "v1.0.0",
      commitMessage: "Initial SQL plan analysis expert",
      systemPrompt: "You are a senior PostgreSQL database administrator specializing in query plan analysis and index design. Always specify exact CREATE INDEX statements and explain execution costs.",
      userPrompt: "Analyze the following query and plan:\n\nQuery:\n{{sql_query}}\n\nExplain Plan:\n{{explain_plan}}\n\nTarget latency: {{target_latency_ms}}ms",
      assistantPrompt: null,
      modelConfig: JSON.stringify({ model: "gpt-4o", temperature: 0.2, maxTokens: 2048 }),
      variables: JSON.stringify(["sql_query", "explain_plan", "target_latency_ms"]),
      isProduction: true,
    },
  });

  await prisma.prompt.update({
    where: { id: p2.id },
    data: { activeVersionId: p2v1.id },
  });

  await prisma.testScenario.create({
    data: {
      promptId: p2.id,
      name: "Slow Sequential Scan on Orders Table",
      inputVariables: JSON.stringify({
        sql_query: "SELECT id, user_id, total_amount, created_at FROM orders WHERE user_id = 94821 ORDER BY created_at DESC LIMIT 20;",
        explain_plan: "Seq Scan on orders  (cost=0.00..45820.00 rows=15 width=48)\n  Filter: (user_id = 94821)\n  Rows Removed by Filter: 1250000",
        target_latency_ms: "10",
      }),
      expectedKeywords: JSON.stringify(["CREATE INDEX", "orders", "user_id"]),
      forbiddenKeywords: JSON.stringify(["DROP TABLE"]),
      maxTokenLimit: 1200,
    },
  });

  // Prompt 3: Automated Code Reviewer
  const p3 = await prisma.prompt.create({
    data: {
      projectId: project.id,
      title: "Automated Code Reviewer",
      slug: "automated-code-reviewer",
      description: "Staff engineer PR reviewer detecting security flaws, race conditions, and typing errors.",
    },
  });

  const p3v1 = await prisma.promptVersion.create({
    data: {
      promptId: p3.id,
      versionTag: "v1.0.0",
      commitMessage: "Initial release with security focus",
      systemPrompt: "You are a staff software engineer performing an asynchronous code review on a GitHub pull request. Flag security vulnerabilities, algorithmic complexity bottlenecks, and null-safety issues with constructive suggestions.",
      userPrompt: "Review this {{language}} PR #{{pr_number}} ({{pr_title}}):\n\n```{{language}}\n{{code_diff}}\n```\n\nHighlight blocking vs optional comments.",
      assistantPrompt: null,
      modelConfig: JSON.stringify({ model: "claude-3-5-sonnet", temperature: 0.3, maxTokens: 2048 }),
      variables: JSON.stringify(["language", "pr_number", "pr_title", "code_diff"]),
      isProduction: true,
    },
  });

  await prisma.prompt.update({
    where: { id: p3.id },
    data: { activeVersionId: p3v1.id },
  });

  await prisma.testScenario.create({
    data: {
      promptId: p3.id,
      name: "SQL Injection Security Hazard",
      inputVariables: JSON.stringify({
        language: "typescript",
        pr_number: "204",
        pr_title: "Add raw user search query",
        code_diff: "const users = await db.$queryRawUnsafe(`SELECT * FROM users WHERE name LIKE '%${req.query.q}%'`);",
      }),
      expectedKeywords: JSON.stringify(["injection", "vulnerability", "parameterized"]),
      forbiddenKeywords: JSON.stringify(["looks good to merge"]),
      maxTokenLimit: 1000,
    },
  });

  console.log("Database seeded successfully with 3 rich prompts, 5 versions, and 5 scenarios!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
