import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDifficulty, getTech } from "@/lib/content";

export const revalidate = 300;

export default async function TechPage({ params }: { params: Promise<{ tech: string }> }) {
  const { tech: techSlug } = await params;
  const tech = await getTech(techSlug);
  if (!tech) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10 lg:py-20">
      <Link href="/tech" className="text-sm font-semibold text-amber-700">
        &larr; All technologies
      </Link>
      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {tech.category.toLowerCase()}
      </p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">{tech.name}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{tech.description}</p>

      {tech.topics.length === 0 ? (
        <p className="mt-12 border border-dashed border-slate-300 p-8 text-slate-500">
          No published topics yet.
        </p>
      ) : (
        <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
          {tech.topics.map((topic, index) => (
            <Link
              key={topic.slug}
              href={`/tech/${tech.slug}/${topic.slug}`}
              className="group flex gap-6 py-6"
            >
              <span className="font-mono text-sm text-slate-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span className="block text-xl font-semibold text-slate-950 group-hover:text-amber-700">
                  {topic.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-500">{topic.summary}</span>
                <span className="mt-3 block text-xs uppercase tracking-wider text-slate-400">
                  {formatDifficulty(topic.difficulty)} &middot; {topic._count.questions} questions &middot;{" "}
                  {topic._count.snippets} snippets &middot; {topic._count.practiceItems} practice
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
