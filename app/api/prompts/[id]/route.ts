import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

interface Params {
  params: { id: string };
}

// GET /api/prompts/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    const prompt = await prisma.prompt.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          include: {
            evaluations: {
              orderBy: { executedAt: "desc" },
              take: 10,
            },
          },
        },
        testScenarios: {
          orderBy: { createdAt: "asc" },
          include: {
            results: {
              orderBy: { executedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Prompt with ID '${id}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prompt,
    });
  } catch (error: any) {
    console.error(`Error in GET /api/prompts/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to fetch prompt details",
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/prompts/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const { title, slug, description, activeVersionId } = body;

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Prompt with ID '${id}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (activeVersionId !== undefined) dataToUpdate.activeVersionId = activeVersionId;
    if (slug !== undefined) {
      const sanitizedSlug = slugify(slug);
      if (sanitizedSlug !== existing.slug) {
        const slugConflict = await prisma.prompt.findUnique({
          where: { slug: sanitizedSlug },
        });
        if (slugConflict) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "DUPLICATE_SLUG",
                message: `Slug '${sanitizedSlug}' is already in use by another prompt.`,
              },
            },
            { status: 409 }
          );
        }
        dataToUpdate.slug = sanitizedSlug;
      }
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: dataToUpdate,
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
        testScenarios: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error(`Error in PUT /api/prompts/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: error.message || "Failed to update prompt",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Prompt with ID '${id}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    await prisma.prompt.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: `Prompt '${existing.title}' deleted successfully.` },
    });
  } catch (error: any) {
    console.error(`Error in DELETE /api/prompts/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: error.message || "Failed to delete prompt",
        },
      },
      { status: 500 }
    );
  }
}
