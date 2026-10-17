import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/scenarios?promptId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get("promptId");

    const where: any = {};
    if (promptId) {
      where.promptId = promptId;
    }

    const scenarios = await prisma.testScenario.findMany({
      where,
      include: {
        results: {
          orderBy: { executedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: scenarios,
    });
  } catch (error: any) {
    console.error("Error in GET /api/scenarios:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: error.message || "Failed to fetch test scenarios",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/scenarios - Create single or bulk import scenarios
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if bulk array or single object
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_PAYLOAD",
            message: "No test scenarios provided.",
          },
        },
        { status: 400 }
      );
    }

    const createdScenarios = [];

    for (const item of items) {
      const {
        promptId,
        name,
        inputVariables,
        expectedKeywords,
        forbiddenKeywords,
        maxTokenLimit,
      } = item;

      if (!promptId || !name || !inputVariables) {
        continue;
      }

      const serializedInputs =
        typeof inputVariables === "string"
          ? inputVariables
          : JSON.stringify(inputVariables);

      const serializedExpected = expectedKeywords
        ? typeof expectedKeywords === "string"
          ? expectedKeywords
          : JSON.stringify(expectedKeywords)
        : null;

      const serializedForbidden = forbiddenKeywords
        ? typeof forbiddenKeywords === "string"
          ? forbiddenKeywords
          : JSON.stringify(forbiddenKeywords)
        : null;

      const scenario = await prisma.testScenario.create({
        data: {
          promptId,
          name: name.trim(),
          inputVariables: serializedInputs,
          expectedKeywords: serializedExpected,
          forbiddenKeywords: serializedForbidden,
          maxTokenLimit: maxTokenLimit ? Number(maxTokenLimit) : null,
        },
      });

      createdScenarios.push(scenario);
    }

    return NextResponse.json(
      {
        success: true,
        data: Array.isArray(body) ? createdScenarios : createdScenarios[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/scenarios:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CREATION_FAILED",
          message: error.message || "Failed to create test scenarios",
        },
      },
      { status: 500 }
    );
  }
}
