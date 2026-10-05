import Link from "next/link";
import { getQuestionsForTopic, getTopics } from "@/lib/questions";

export function generateStaticParams() {
  return getTopics().map((topic) => ({ topic: topic.toLowerCase() }));
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const topicQuestions = getQuestionsForTopic(topic);
  const displayTopic = topicQuestions[0]?.topic ?? topic;

  return <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10 lg:py-20"><Link href="/topics" className="text-sm font-semibold text-amber-700">&larr; All topics</Link><p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Topic path</p><h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">{displayTopic}</h1><div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">{topicQuestions.map((question, index) => <Link key={question.slug} href={`/questions/${question.slug}`} className="group flex gap-6 py-6"><span className="font-mono text-sm text-slate-400">0{index + 1}</span><span><span className="block text-xl font-semibold text-slate-950 group-hover:text-amber-700">{question.title}</span><span className="mt-2 block text-sm text-slate-500">{question.difficulty} &middot; {question.category}</span></span></Link>)}</div></main>;
}