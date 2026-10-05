import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/auth";
import { handleError, ok } from "@/lib/api/responses";
import { createTopicSchema, topicQuerySchema } from "@/lib/api/schemas";
import { createTopic } from "@/lib/api/topic-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = topicQuerySchema.parse(Object.fromEntries(url.searchParams));

    const where: Prisma.TopicWhereInput = {
      tech: query.tech ? { slug: query.tech } : undefined,
      difficulty: query.difficulty,
      published: query.published,
      tags: query.tag ? { some: { slug: query.tag } } : undefined,
      OR: query.q
        ? [
            { title: { contains: query.q, mode: "insensitive" } },
            { summary: { contains: query.q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy: [{ position: "asc" }, { title: "asc" }],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
        select: {
          slug: true,
          title: true,
          summary: true,
          difficulty: true,
          published: true,
          tech: { select: { slug: true, name: true } },
          tags: { select: { slug: true, label: true } },
          _count: { select: { questions: true, snippets: true, practiceItems: true } },
        },
      }),
      prisma.topic.count({ where }),
    ]);

    return ok({ items, page: query.page, perPage: query.perPage, total });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = createTopicSchema.parse(await request.json());
    const topic = await createTopic(input);
    return ok(topic, 201);
  } catch (error) {
    return handleError(error);
  }
}
