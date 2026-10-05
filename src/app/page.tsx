import Link from "next/link";
import { prisma } from "@/lib/db";
import { getTechs } from "@/lib/content";
import { auth } from "@/lib/auth/server";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export default async function Home() {
  const [techs, topicCount, questionCount, { data: session }] = await Promise.all([
    getTechs(),
    prisma.topic.count({ where: { published: true } }),
    prisma.question.count(),
    auth.getSession(),
  ]);

  const role = session?.user?.role;
  const isAdmin = Array.isArray(role) ? role.includes("admin") : role === "admin";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 sm:px-10 lg:py-20">
      <section className="max-w-3xl">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Your interview field guide
        </p>
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-7xl">
          Study the ideas behind the answers.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Every topic is broken into details, interview questions, code snippets, practice, and an analogy that makes
          the idea stick.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/tech"
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Browse technologies
          </Link>
          <Link
            href="/tech/javascript/closures/details"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-amber-700 hover:text-amber-700"
          >
            Start with closures
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/admin/topics"
                className="rounded-full border border-amber-300 px-6 py-3 text-sm font-semibold text-amber-800 transition hover:border-amber-700 hover:bg-amber-50"
              >
                Admin dashboard
              </Link>
              <Link
                href="/admin/topics/new"
                className="rounded-full border border-amber-300 px-6 py-3 text-sm font-semibold text-amber-800 transition hover:border-amber-700 hover:bg-amber-50"
              >
                Create a topic
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-3" aria-label="Study overview">
        <div className="border-t-2 border-amber-500 pt-4">
          <p className="text-4xl font-semibold text-slate-950">{topicCount}</p>
          <p className="mt-1 text-sm text-slate-500">topics in the library</p>
        </div>
        <div className="border-t-2 border-slate-950 pt-4">
          <p className="text-4xl font-semibold text-slate-950">{questionCount}</p>
          <p className="mt-1 text-sm text-slate-500">interview questions</p>
        </div>
        <div className="border-t-2 border-teal-600 pt-4">
          <p className="text-4xl font-semibold text-slate-950">{techs.length}</p>
          <p className="mt-1 text-sm text-slate-500">technologies covered</p>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Explore</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Choose a path</h2>
          </div>
          <Link href="/tech" className="text-sm font-semibold text-amber-700">
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {techs.map((tech) => (
            <Link
              key={tech.slug}
              href={`/tech/${tech.slug}`}
              className="group border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-amber-500 hover:shadow-lg"
            >
              <p className="text-xl font-semibold text-slate-950">{tech.name}</p>
              <p className="mt-2 text-sm text-slate-500">{tech._count.topics} topics</p>
              <span className="mt-8 block text-sm font-semibold text-amber-700 opacity-0 transition group-hover:opacity-100">
                Open &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
