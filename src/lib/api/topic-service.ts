import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CreateTopicInput, UpdateTopicInput } from "@/lib/api/schemas";

export const topicInclude = {
  tech: { select: { slug: true, name: true, category: true } },
  tags: { select: { slug: true, label: true } },
  questions: { orderBy: { position: "asc" } },
  snippets: { orderBy: { position: "asc" } },
  practiceItems: { orderBy: { position: "asc" } },
  prerequisites: { select: { slug: true, title: true } },
  related: { select: { slug: true, title: true } },
} satisfies Prisma.TopicInclude;

function withPosition<T>(items: T[]) {
  return items.map((item, index) => ({ ...item, position: index }));
}

async function connectTags(tx: Prisma.TransactionClient, tags: string[]) {
  await Promise.all(
    tags.map((slug) =>
      tx.tag.upsert({
        where: { slug },
        create: { slug, label: slug.replace(/-/g, " ") },
        update: {},
      })
    )
  );
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
        practiceItems: { create: withPosition(input.practice) },
      },
      include: topicInclude,
    });
  });
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

    // A provided section is a full replacement, so drop the old rows first.
    if (input.questions) await tx.question.deleteMany({ where: { topicId: existing.id } });
    if (input.snippets) await tx.snippet.deleteMany({ where: { topicId: existing.id } });
    if (input.practice) await tx.practiceItem.deleteMany({ where: { topicId: existing.id } });
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
        questions: input.questions ? { create: withPosition(input.questions) } : undefined,
        snippets: input.snippets ? { create: withPosition(input.snippets) } : undefined,
        practiceItems: input.practice ? { create: withPosition(input.practice) } : undefined,
      },
      include: topicInclude,
    });
  });
}
