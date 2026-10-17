import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractVariables } from "@/lib/variableParser";

interface Params {
  params: { id: string };
}

// POST /api/prompts/[id]/versions - Create immutable snapshot commit
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: promptId } = params;
    const body = await req.json();

    const {
      versionTag,
      commitMessage,
      systemPrompt,
      userPrompt,
      assistantPrompt,
      modelConfig,
      isProduction = false,
    } = body;

    if (!versionTag || !userPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "versionTag and userPrompt are required.",
          },
        },
        { status: 400 }
      );
    }

    // Verify parent prompt exists
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Prompt with ID '${promptId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    // Check duplicate version tag
    const existingVersion = await prisma.promptVersion.findUnique({
      where: {
        promptId_versionTag: {
          promptId,
          versionTag: versionTag.trim(),
        },
      },
    });

    if (existingVersion) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_VERSION_TAG",
            message: `Version tag '${versionTag.trim()}' already exists for this prompt.`,
          },
        },
        { status: 409 }
      );
    }

    const detectedVariables = extractVariables([systemPrompt, userPrompt, assistantPrompt]);
    const serializedConfig = modelConfig
      ? JSON.stringify(modelConfig)
      : JSON.stringify({ model: "gpt-4o", temperature: 0.7, maxTokens: 1024 });

    const newVersion = await prisma.$transaction(async (tx) => {
      if (isProduction) {
        await tx.promptVersion.updateMany({
          where: { promptId },
          data: { isProduction: false },
        });
      }

      const version = await tx.promptVersion.create({
        data: {
          promptId,
          versionTag: versionTag.trim(),
          commitMessage: commitMessage?.trim() || null,
          systemPrompt: systemPrompt || null,
          userPrompt,
          assistantPrompt: assistantPrompt || null,
          modelConfig: serializedConfig,
          variables: JSON.stringify(detectedVariables),
          isProduction: Boolean(isProduction),
        },
      });

      // Update activeVersion pointer
      await tx.prompt.update({
        where: { id: promptId },
        data: { activeVersionId: version.id },
      });

      return version;
    });

    return NextResponse.json(
      {
        success: true,
        data: newVersion,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`Error in POST /api/prompts/${params.id}/versions:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VERSION_COMMIT_FAILED",
          message: error.message || "Failed to commit version snapshot",
        },
      },
      { status: 500 }
    );
  }
}
