import { z } from "zod";

const slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a lowercase kebab-case slug");

export const techCategory = z.enum(["LANGUAGE", "FRAMEWORK", "LIBRARY", "TOOLING", "CONCEPT"]);
export const difficulty = z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]);
export const practiceKind = z.enum(["MCQ", "PREDICT_OUTPUT", "CODING"]);

export const createTechSchema = z.object({
  slug,
  name: z.string().min(1).max(120),
  category: techCategory,
  description: z.string().min(1).max(1000),
  icon: z.string().max(200).nullish(),
  position: z.number().int().min(0).default(0),
});

export const updateTechSchema = createTechSchema.partial();

const detailSection = z.object({
  heading: z.string().min(1).max(200),
  body: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).default([]),
});

const analogy = z.object({
  realWorld: z
    .string()
    .min(1)
    .describe("A familiar scenario followed by an explicit mapping from every scenario element to the named topic."),
  genericExample: z
    .string()
    .min(1)
    .describe("A step-by-step language-neutral software example demonstrating the same concept and its practical lesson."),
  code: z.string().nullish().describe("Optional short code that demonstrates the mapping."),
});

const question = z.object({
  question: z.string().min(1),
  shortAnswer: z.string().min(1),
  explanation: z.string().min(1),
  followUps: z.array(z.string().min(1)).default([]),
});

const snippet = z.object({
  title: z.string().min(1).max(200),
  language: z.string().min(1).max(40).default("typescript"),
  code: z
    .string()
    .min(1)
    .describe("Raw, readable source code with normal indentation and line breaks. Do not include Markdown fences."),
  explanation: z.string().min(1),
  pitfall: z.string().nullish(),
});

const practiceItemBase = z.object({
  kind: practiceKind,
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).default([]),
  answer: z.string().min(1),
  explanation: z.string().min(1),
  starterCode: z.string().nullish(),
  difficulty: difficulty.default("INTERMEDIATE"),
});

const practiceItem = practiceItemBase
  .refine((item) => item.kind !== "MCQ" || item.options.length >= 2, {
    message: "MCQ items need at least two options",
    path: ["options"],
  })
  .refine((item) => item.kind !== "MCQ" || item.options.includes(item.answer), {
    message: "MCQ answer must be one of the options",
    path: ["answer"],
  });

const generatedPracticeItem = practiceItemBase;

export const practiceSectionResultSchema = z.object({
  practice: z.array(practiceItem).min(1),
});

export const createTopicSchema = z.object({
  slug,
  techSlug: slug,
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000),
  difficulty,
  position: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  tags: z.array(slug).default([]),
  prerequisites: z.array(slug).default([]),
  related: z.array(slug).default([]),
  details: z.array(detailSection).default([]),
  analogy: analogy.nullish(),
  questions: z.array(question).default([]),
  snippets: z.array(snippet).default([]),
  practice: z.array(practiceItem).min(1),
});

/// PATCH replaces any section that is present and leaves omitted sections untouched.
export const updateTopicSchema = createTopicSchema.partial();

export const topicQuerySchema = z.object({
  tech: slug.optional(),
  difficulty: difficulty.optional(),
  tag: slug.optional(),
  q: z.string().trim().min(1).max(120).optional(),
  published: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

/// Input for the AI content generator: just enough to steer the model.
export const topicSectionKey = z.enum(["overview", "details", "questions", "snippets", "practice", "analogy"]);

export const generateTopicRequestSchema = z.object({
  techSlug: slug,
  title: z.string().min(1).max(200),
  difficulty,
  notes: z.string().max(2000).optional(),
  /// "all" drafts the whole topic; a single key regenerates just that section.
  section: z.union([topicSectionKey, z.literal("all")]).default("all"),
  /// Already-authored content, sent back so a single-section retry stays consistent with the rest.
  context: z
    .object({
      summary: z.string().optional(),
      tags: z.array(slug).optional(),
      details: z.array(detailSection).optional(),
      analogy: analogy.nullish(),
      questions: z.array(question).optional(),
      snippets: z.array(snippet).optional(),
      practice: z.array(practiceItem).optional(),
    })
    .optional(),
});

/// Output shape the model must return; merged client-side with slug/techSlug/position/published.
export const generateTopicResultSchema = z.object({
  summary: z.string().min(1).max(1000),
  tags: z.array(slug).max(8).default([]),
  details: z.array(detailSection).min(1),
  analogy,
  questions: z.array(question).min(1),
  snippets: z.array(snippet).min(1),
  practice: z.array(generatedPracticeItem).min(1),
});

/// Per-section result shapes, for "retry just this section" calls.
export const generateSectionResultSchemas = {
  overview: z.object({
    summary: z.string().min(1).max(1000),
    tags: z.array(slug).max(8).default([]),
  }),
  details: z.object({ details: z.array(detailSection).min(1) }),
  questions: z.object({ questions: z.array(question).min(1) }),
  snippets: z.object({ snippets: z.array(snippet).min(1) }),
  practice: z.object({ practice: z.array(generatedPracticeItem).min(1) }),
  analogy: z.object({ analogy }),
};

export type CreateTechInput = z.infer<typeof createTechSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
/// Pre-default-application shape, for form state where every field starts out optional.
export type CreateTopicFormInput = z.input<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type TopicSectionKey = z.infer<typeof topicSectionKey>;
export type GenerateTopicRequest = z.infer<typeof generateTopicRequestSchema>;
export type GenerateTopicResult = z.infer<typeof generateTopicResultSchema>;
export type GenerateSectionResult = {
  [K in TopicSectionKey]: z.infer<(typeof generateSectionResultSchemas)[K]>;
};

