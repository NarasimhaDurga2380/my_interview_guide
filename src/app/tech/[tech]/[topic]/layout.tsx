import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { TopicTabs } from "@/components/topic-tabs";
import { formatDifficulty, getTopic } from "@/lib/content";

export const revalidate = 300;

export default async function TopicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tech: string; topic: string }>;
}) {
  const { tech, topic: topicSlug } = await params;
  const topic = await getTopic(tech, topicSlug);
  if (!topic) notFound();

  const basePath = `/tech/${tech}/${topicSlug}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10 lg:py-16">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/tech/${tech}`} className="text-sm font-semibold text-amber-700">
          &larr; {topic.tech.name}
        </Link>
        <Link
          href={`/admin/topics/${tech}/${topicSlug}/edit`}
          className="text-sm font-semibold text-amber-700"
        >
          Edit topic
        </Link>
      </div>

      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {formatDifficulty(topic.difficulty)}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{topic.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{topic.summary}</p>

      {topic.tags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {topic.tags.map((tag) => (
            <li key={tag.slug} className="border border-slate-200 px-3 py-1 text-xs uppercase tracking-wider text-slate-500">
              {tag.label}
            </li>
          ))}
        </ul>
      )}

      <TopicTabs
        basePath={basePath}
        counts={{
          details: (topic.details as unknown[]).length,
          questions: topic.questions.length,
          snippets: topic.snippets.length,
          resources: topic.resources.length,
          practice: topic.practiceItems.length,
        }}
      />

      <div className="py-10">{children}</div>

      {topic.related.length > 0 && (
        <section className="border-t border-slate-200 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Related topics</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {topic.related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/tech/${tech}/${item.slug}`}
                  className="border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-amber-500 hover:text-amber-700"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
