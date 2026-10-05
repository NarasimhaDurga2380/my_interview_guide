import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { fail, handleError, ok } from "@/lib/api/responses";
import { updateTechSchema } from "@/lib/api/schemas";

type Context = { params: Promise<{ tech: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { tech: techSlug } = await params;
    const tech = await prisma.tech.findUnique({
      where: { slug: techSlug },
      include: {
        topics: {
          orderBy: [{ position: "asc" }, { title: "asc" }],
          select: { slug: true, title: true, summary: true, difficulty: true, published: true },
        },
      },
    });

    if (!tech) return fail("Tech not found", 404);
    return ok(tech);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { tech: techSlug } = await params;
    const input = updateTechSchema.parse(await request.json());
    const tech = await prisma.tech.update({ where: { slug: techSlug }, data: input });
    return ok(tech);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { tech: techSlug } = await params;
    await prisma.tech.delete({ where: { slug: techSlug } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
