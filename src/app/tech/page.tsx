import Link from "next/link";
import { notFound } from "next/navigation";
import { getTechs } from "@/lib/content";

export const revalidate = 300;

export default async function TechIndexPage() {
  const techs = await getTechs();
  if (techs.length === 0) notFound();

  const grouped = techs.reduce<Record<string, typeof techs>>((acc, tech) => {
    (acc[tech.category] ??= []).push(tech);
    return acc;
  }, {});

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 lg:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Library</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">Technologies</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        Pick a language, framework or discipline. Every topic inside is broken into details, questions, snippets,
        practice and an analogy.
      </p>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mt-14">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {category.toLowerCase()}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((tech) => (
              <Link
                key={tech.slug}
                href={`/tech/${tech.slug}`}
                className="group border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-amber-500 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold text-slate-950">{tech.name}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{tech.description}</p>
                <p className="mt-6 text-sm font-semibold text-amber-700">{tech._count.topics} topics &rarr;</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
