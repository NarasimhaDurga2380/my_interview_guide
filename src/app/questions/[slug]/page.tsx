import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion, questions } from "@/lib/questions";

export function generateStaticParams() {
  return questions.map((question) => ({ slug: question.slug }));
}

export default async function QuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const question = getQuestion(slug);
  if (!question) notFound();

  return <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-10 lg:py-20"><Link href={`/topics/${question.topic.toLowerCase()}`} className="text-sm font-semibold text-amber-700">&larr; {question.topic}</Link><article className="mt-12"><div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"><span>{question.category}</span><span>/</span><span>{question.difficulty}</span></div><h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl">{question.title}</h1><p className="mt-8 border-l-4 border-amber-500 pl-5 text-xl leading-9 text-slate-700">{question.shortAnswer}</p><section className="mt-12"><h2 className="text-2xl font-semibold text-slate-950">The idea</h2><p className="mt-4 text-lg leading-8 text-slate-600">{question.explanation}</p></section><pre className="mt-8 overflow-x-auto bg-slate-950 p-6 text-sm leading-7 text-slate-100"><code>{question.code}</code></pre><section className="mt-12 border-t border-slate-200 pt-8"><h2 className="text-2xl font-semibold text-slate-950">Common follow-ups</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-lg leading-8 text-slate-600">{question.followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}</ul></section></article></main>;
}