import { cache } from "react";
import { prisma } from "@/lib/db";
import { topicInclude } from "@/lib/api/topic-service";

export const SECTIONS = ["details", "questions", "snippets", "resources", "practice", "analogy"] as const;

export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  details: "Details",
  questions: "Questions",
  snippets: "Code snippets",
  resources: "Resources",
  practice: "Practice",
  analogy: "Analogy",
};

export type DetailSection = {
  heading: string;
  body: string;
  keyPoints: string[];
};

export type Analogy = {
  realWorld: string;
  genericExample: string;
  code?: string | null;
};

export function isSection(value: string): value is Section {
  return (SECTIONS as readonly string[]).includes(value);
}

export const getTechs = cache(async () =>
  prisma.tech.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { topics: { where: { published: true } } },
      },
    },
  })
);

export const getTech = cache(async (slug: string) =>
  prisma.tech.findUnique({
    where: { slug },
    include: {
      topics: {
        where: { published: true },
        orderBy: [{ position: "asc" }, { title: "asc" }],
        select: {
          slug: true,
          title: true,
          summary: true,
          difficulty: true,
          tags: { select: { slug: true, label: true } },
          _count: { select: { questions: true, snippets: true, practiceItems: true } },
        },
      },
    },
  })
);

export const getTopic = cache(async (techSlug: string, topicSlug: string) =>
  prisma.topic.findFirst({
    where: { slug: topicSlug, tech: { slug: techSlug } },
    include: topicInclude,
  })
);

export type TopicDetail = NonNullable<Awaited<ReturnType<typeof getTopic>>>;

export function formatDifficulty(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}
