import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CreateTopicInput, UpdateTopicInput } from "@/lib/api/schemas";

export const topicInclude = {
  tech: { select: { slug: true, name: true, category: true } },
  tags: { select: { slug: true, label: true } },
  questions: { orderBy: { position: "asc" } },
  snippets: { orderBy: { position: "asc" } },
  resources: { orderBy: { position: "asc" } },
  practiceItems: { orderBy: { position: "asc" } },
  prerequisites: { select: { slug: true, title: true } },
  related: { select: { slug: true, title: true } },
} satisfies Prisma.TopicInclude;

function withPosition<T>(items: T[]) {
  return items.map((item, index) => ({ ...item, position: index }));
}

async function connectTags(tx: Prisma.TransactionClient, tags: string[]) {
  await tx.tag.createMany({
    data: tags.map((slug) => ({ slug, label: slug.replace(/-/g, " ") })),
    skipDuplicates: true,
  });
  return tags.map((slug) => ({ slug }));
}

export async function createTopic(input: CreateTopicInput) {
  return prisma.$transaction(async (tx) => {
    const tech = await tx.tech.findUniqueOrThrow({ where: { slug: input.techSlug } });
    return tx.topic.create({
      data: {
        slug: input.slug,
        techId: tech.id,
        title: input.title,
        summary: input.summary,
        difficulty: input.difficulty,
        position: input.position,
        published: input.published,
        details: input.details,
        analogy: input.analogy ?? Prisma.JsonNull,
        tags: { connect: await connectTags(tx, input.tags) },
        prerequisites: { connect: input.prerequisites.map((slug) => ({ techId_slug: { techId: tech.id, slug } })) },
        related: { connect: input.related.map((slug) => ({ techId_slug: { techId: tech.id, slug } })) },
        questions: { create: withPosition(input.questions) },
        snippets: { create: withPosition(input.snippets) },
        resources: { create: withPosition(input.resources) },
        practiceItems: { create: withPosition(input.practice) },
      },
      include: topicInclude,
    });
  }, { timeout: 15_000 });
}

export async function updateTopic(techSlug: string, topicSlug: string, input: UpdateTopicInput) {
  return prisma.$transaction(async (tx) => {
    const sourceTech = await tx.tech.findUniqueOrThrow({ where: { slug: techSlug } });
    const existing = await tx.topic.findUniqueOrThrow({
      where: { techId_slug: { techId: sourceTech.id, slug: topicSlug } },
      select: { id: true },
    });
    const targetTech = input.techSlug
      ? await tx.tech.findUniqueOrThrow({ where: { slug: input.techSlug } })
      : sourceTech;

    return tx.topic.update({
      where: { id: existing.id },
      data: {
        techId: targetTech.id,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        difficulty: input.difficulty,
        position: input.position,
        published: input.published,
        details: input.details,
        analogy: input.analogy === undefined ? undefined : (input.analogy ?? Prisma.JsonNull),
        tags: input.tags ? { set: await connectTags(tx, input.tags) } : undefined,
        prerequisites: input.prerequisites
          ? { set: input.prerequisites.map((slug) => ({ techId_slug: { techId: targetTech.id, slug } })) }
          : undefined,
        related: input.related
          ? { set: input.related.map((slug) => ({ techId_slug: { techId: targetTech.id, slug } })) }
          : undefined,
        questions: input.questions
          ? { deleteMany: {}, create: withPosition(input.questions) }
          : undefined,
        snippets: input.snippets
          ? { deleteMany: {}, create: withPosition(input.snippets) }
          : undefined,
        resources: input.resources
          ? { deleteMany: {}, create: withPosition(input.resources) }
          : undefined,
        practiceItems: input.practice
          ? { deleteMany: {}, create: withPosition(input.practice) }
          : undefined,
      },
      include: topicInclude,
    });
  }, { timeout: 15_000 });
}
