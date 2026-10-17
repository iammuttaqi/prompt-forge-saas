import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractVariables } from "@/lib/variableParser";
import { slugify } from "@/lib/utils";

// GET /api/prompts - List all prompts with active version & counts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { slug: { contains: query } },
      ];
    }

    const prompts = await prisma.prompt.findMany({
      where: whereClause,
      include: {
        versions: {
          select: {
            id: true,
            versionTag: true,
            isProduction: true,
            createdAt: true,
            variables: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            versions: true,
            testScenarios: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = prompts.map((p) => {
      // Find active version or production version or first version
      let activeVer = p.versions.find((v) => v.id === p.activeVersionId);
      if (!activeVer) {
        activeVer = p.versions.find((v) => v.isProduction) || p.versions[0] || null;
      }

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        versionCount: p._count.versions,
        scenarioCount: p._count.testScenarios,
        activeVersion: activeVer
          ? {
              id: activeVer.id,
              versionTag: activeVer.versionTag,
              isProduction: activeVer.isProduction,
              createdAt: activeVer.createdAt,
            }
          : null,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Error in GET /api/prompts:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to fetch prompts",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/prompts - Create new prompt with initial v1.0.0 snapshot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      slug: userSlug,
      description,
      systemPrompt,
      userPrompt,
      assistantPrompt,
      modelConfig,
    } = body;

    if (!title || !userPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Title and User Prompt are required",
          },
        },
        { status: 400 }
      );
    }

    const finalSlug = userSlug ? slugify(userSlug) : slugify(title);

    // Verify unique slug
    const existing = await prisma.prompt.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_SLUG",
            message: `A prompt with slug '${finalSlug}' already exists. Please choose a different title or slug.`,
          },
        },
        { status: 409 }
      );
    }

    // Auto-extract dynamic variables
    const detectedVariables = extractVariables([systemPrompt, userPrompt, assistantPrompt]);

    const serializedConfig = JSON.stringify(
      modelConfig || { model: "gpt-4o", temperature: 0.7, maxTokens: 1024 }
    );

    // Create prompt and initial version in transaction
    const newPrompt = await prisma.$transaction(async (tx) => {
      const prompt = await tx.prompt.create({
        data: {
          title,
          slug: finalSlug,
          description: description || null,
        },
      });

      const initialVersion = await tx.promptVersion.create({
        data: {
          promptId: prompt.id,
          versionTag: "v1.0.0",
          commitMessage: "Initial prompt snapshot",
          systemPrompt: systemPrompt || null,
          userPrompt,
          assistantPrompt: assistantPrompt || null,
          modelConfig: serializedConfig,
          variables: JSON.stringify(detectedVariables),
          isProduction: true,
        },
      });

      return await tx.prompt.update({
        where: { id: prompt.id },
        data: { activeVersionId: initialVersion.id },
        include: {
          versions: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: newPrompt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/prompts:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CREATION_FAILED",
          message: error.message || "Failed to create prompt",
        },
      },
      { status: 500 }
    );
  }
}
