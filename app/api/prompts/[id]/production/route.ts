import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// GET /api/prompts/[id]/production - Fetch current active production prompt payload by slug or ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const identifier = params.id;

    // Support fetching by either slug or id
    const prompt = await prisma.prompt.findFirst({
      where: {
        OR: [{ slug: identifier }, { id: identifier }],
      },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Prompt not found",
          message: `Prompt '${identifier}' does not exist.`,
        },
        { status: 404 }
      );
    }

    // Prioritize isProduction: true, then activeVersionId, then latest version
    let activeVersion = prompt.versions.find((v) => v.isProduction);
    if (!activeVersion && prompt.activeVersionId) {
      activeVersion = prompt.versions.find((v) => v.id === prompt.activeVersionId);
    }
    if (!activeVersion && prompt.versions.length > 0) {
      activeVersion = prompt.versions[0];
    }

    if (!activeVersion) {
      return NextResponse.json(
        {
          error: "No version available",
          message: `Prompt '${identifier}' has no committed versions.`,
        },
        { status: 404 }
      );
    }

    let parsedConfig = null;
    if (activeVersion.modelConfig) {
      try {
        parsedConfig = JSON.parse(activeVersion.modelConfig);
      } catch {
        parsedConfig = activeVersion.modelConfig;
      }
    }

    let parsedVariables: string[] = [];
    if (activeVersion.variables) {
      try {
        parsedVariables = JSON.parse(activeVersion.variables);
      } catch {
        parsedVariables = [];
      }
    }

    return NextResponse.json({
      slug: prompt.slug,
      title: prompt.title,
      version: activeVersion.versionTag,
      systemPrompt: activeVersion.systemPrompt,
      userPrompt: activeVersion.userPrompt,
      assistantPrompt: activeVersion.assistantPrompt,
      variables: parsedVariables,
      modelConfig: parsedConfig,
      updatedAt: activeVersion.createdAt,
    });
  } catch (error: any) {
    console.error(`Error in GET /api/prompts/${params.id}/production:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Failed to retrieve production prompt",
      },
      { status: 500 }
    );
  }
}
