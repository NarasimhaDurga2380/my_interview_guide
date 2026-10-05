import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { handleError, ok } from "@/lib/api/responses";
import { createTechSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    const techs = await prisma.tech.findMany({
      orderBy: [{ category: "asc" }, { position: "asc" }, { name: "asc" }],
      include: { _count: { select: { topics: true } } },
    });
    return ok(techs);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = createTechSchema.parse(await request.json());
    const tech = await prisma.tech.create({ data: input });
    return ok(tech, 201);
  } catch (error) {
    return handleError(error);
  }
}
