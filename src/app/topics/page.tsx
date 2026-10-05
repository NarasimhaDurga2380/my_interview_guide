import Link from "next/link";
import { getTopics, questions } from "@/lib/questions";

export default function TopicsPage() {
  const topics = getTopics();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 lg:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Library</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">Topics</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Follow a focused path or move between fundamentals and system-level thinking.</p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const topicQuestions = questions.filter((question) => question.topic === topic);
          return <Link key={topic} href={`/topics/${topic.toLowerCase()}`} className="border border-slate-200 bg-white p-6 transition hover:border-amber-500 hover:shadow-lg"><h2 className="text-xl font-semibold text-slate-950">{topic}</h2><p className="mt-3 text-sm text-slate-500">{topicQuestions.length} questions &middot; {topicQuestions[0].category}</p></Link>;
        })}
      </div>
    </main>
  );
}