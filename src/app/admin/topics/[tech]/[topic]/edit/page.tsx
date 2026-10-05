import { notFound } from "next/navigation";
import { TopicForm } from "@/app/admin/topics/new/page";
import type { CreateTopicFormInput } from "@/lib/api/schemas";
import { getTopic } from "@/lib/content";
import { normalizeInlineNumberedSteps } from "@/lib/markdown";

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ tech: string; topic: string }>;
}) {
  const { tech, topic: topicSlug } = await params;
  const topic = await getTopic(tech, topicSlug);
  if (!topic) notFound();

  const snippets = topic.snippets.map(({ title, language, code, explanation, pitfall }) => ({
    title,
    language,
    code,
    explanation,
    pitfall,
  }));

  const initialValues: CreateTopicFormInput = {
    slug: topic.slug,
    techSlug: topic.tech.slug,
    title: topic.title,
    summary: topic.summary,
    difficulty: topic.difficulty,
    position: topic.position,
    published: topic.published,
    tags: topic.tags.map((tag) => tag.slug),
    prerequisites: topic.prerequisites.map((item) => item.slug),
    related: topic.related.map((item) => item.slug),
    details: topic.details as CreateTopicFormInput["details"],
    analogy: topic.analogy
      ? {
          ...(topic.analogy as NonNullable<CreateTopicFormInput["analogy"]>),
          realWorld: normalizeInlineNumberedSteps((topic.analogy as { realWorld: string }).realWorld),
          genericExample: normalizeInlineNumberedSteps((topic.analogy as { genericExample: string }).genericExample),
        }
      : null,
    questions: topic.questions.map(({ question, shortAnswer, explanation, followUps }) => ({
      question,
      shortAnswer,
      explanation,
      followUps,
    })),
    snippets,
    practice: topic.practiceItems.map(
      ({ kind, prompt, options, answer, explanation, starterCode, difficulty }) => ({
        kind,
        prompt,
        options,
        answer,
        explanation,
        starterCode,
        difficulty,
      })
    ),
  };

  return <TopicForm initialValues={initialValues} editTarget={{ tech, topic: topicSlug }} />;
}
