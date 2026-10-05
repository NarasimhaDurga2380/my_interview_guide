import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { fail, handleError, ok } from "@/lib/api/responses";
import { createTopicSchema, updateTopicSchema } from "@/lib/api/schemas";
import { createTopic, topicInclude, updateTopic } from "@/lib/api/topic-service";

type Context = { params: Promise<{ tech: string; topic: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { tech, topic } = await params;
    const found = await prisma.topic.findFirst({
      where: { slug: topic, tech: { slug: tech } },
      include: topicInclude,
    });

    if (!found) return fail("Topic not found", 404);
    return ok(found);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { tech, topic } = await params;
    const input = updateTopicSchema.parse(await request.json());
    return ok(await updateTopic(tech, topic, input));
  } catch (error) {
    return handleError(error);
  }
}

/// Idempotent create-or-replace, for content sync scripts.
export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { tech, topic } = await params;
    const input = createTopicSchema.parse({ ...(await request.json()), slug: topic, techSlug: tech });

    const exists = await prisma.topic.findFirst({
      where: { slug: topic, tech: { slug: tech } },
      select: { id: true },
    });

    if (!exists) return ok(await createTopic(input), 201);
    return ok(await updateTopic(tech, topic, input));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { tech, topic } = await params;
    const found = await prisma.topic.findFirst({
      where: { slug: topic, tech: { slug: tech } },
      select: { id: true },
    });

    if (!found) return fail("Topic not found", 404);
    await prisma.topic.delete({ where: { id: found.id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
