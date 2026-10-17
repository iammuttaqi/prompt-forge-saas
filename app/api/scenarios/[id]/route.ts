import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// PUT /api/scenarios/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, inputVariables, expectedKeywords, forbiddenKeywords, maxTokenLimit } = body;

    const existing = await prisma.testScenario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SCENARIO_NOT_FOUND",
            message: `Scenario with ID '${id}' not found.`,
          },
        },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (inputVariables !== undefined) {
      updateData.inputVariables =
        typeof inputVariables === "string" ? inputVariables : JSON.stringify(inputVariables);
    }
    if (expectedKeywords !== undefined) {
      updateData.expectedKeywords =
        expectedKeywords !== null
          ? typeof expectedKeywords === "string"
            ? expectedKeywords
            : JSON.stringify(expectedKeywords)
          : null;
    }
    if (forbiddenKeywords !== undefined) {
      updateData.forbiddenKeywords =
        forbiddenKeywords !== null
          ? typeof forbiddenKeywords === "string"
            ? forbiddenKeywords
            : JSON.stringify(forbiddenKeywords)
          : null;
    }
    if (maxTokenLimit !== undefined) {
      updateData.maxTokenLimit = maxTokenLimit ? Number(maxTokenLimit) : null;
    }

    const updated = await prisma.testScenario.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error(`Error in PUT /api/scenarios/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: error.message || "Failed to update test scenario",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/scenarios/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    const existing = await prisma.testScenario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SCENARIO_NOT_FOUND",
            message: `Scenario with ID '${id}' not found.`,
          },
        },
        { status: 404 }
      );
    }

    await prisma.testScenario.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: `Scenario '${existing.name}' deleted successfully.` },
    });
  } catch (error: any) {
    console.error(`Error in DELETE /api/scenarios/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: error.message || "Failed to delete test scenario",
        },
      },
      { status: 500 }
    );
  }
}
