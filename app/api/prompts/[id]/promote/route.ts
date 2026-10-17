import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// POST /api/prompts/[id]/promote - Atomically promote/rollback active production version
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: promptId } = params;
    const body = await req.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "versionId is required in request body",
          },
        },
        { status: 400 }
      );
    }

    // Verify version belongs to prompt
    const targetVersion = await prisma.promptVersion.findFirst({
      where: {
        id: versionId,
        promptId,
      },
    });

    if (!targetVersion) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VERSION_NOT_FOUND",
            message: `Version '${versionId}' does not belong to prompt '${promptId}'`,
          },
        },
        { status: 404 }
      );
    }

    // Execute atomic promotion transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Remove production flag from all versions of this prompt
      await tx.promptVersion.updateMany({
        where: { promptId },
        data: { isProduction: false },
      });

      // Step 2: Set target version as production
      await tx.promptVersion.update({
        where: { id: versionId },
        data: { isProduction: true },
      });

      // Step 3: Update prompt canonical activeVersion pointer
      await tx.prompt.update({
        where: { id: promptId },
        data: { activeVersionId: versionId },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        promptId,
        promotedVersionId: versionId,
        versionTag: targetVersion.versionTag,
        isProduction: true,
        promotedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error(`Error in POST /api/prompts/${params.id}/promote:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROMOTION_FAILED",
          message: error.message || "Failed to promote prompt version",
        },
      },
      { status: 500 }
    );
  }
}
