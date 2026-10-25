import { notFound } from "next/navigation";
import { format } from "prettier";
import { PracticeList } from "@/components/practice-list";
import { MarkdownContent } from "@/components/markdown-content";
import {
  isSection,
  getTopic,
  type Analogy,
  type DetailSection,
  type Section,
  type TopicDetail,
} from "@/lib/content";

export const revalidate = 300;

function EmptyState({ label }: { label: string }) {
  return (
    <p className="border border-dashed border-slate-300 p-8 text-slate-500">
      No {label} written for this topic yet.
    </p>
  );
}

const PRETTIER_PARSERS: Record<string, string> = {
  javascript: "babel",
  js: "babel",
  jsx: "babel",
  typescript: "typescript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  css: "css",
  html: "html",
};

async function CodeBlock({ code, language }: { code: string; language?: string }) {
  const displayCode = code
    .trim()
    .replace(/^```(?:[a-z0-9+#.-]+)?[ \t]*/i, "")
    .replace(/\s*```$/, "");
  const normalizedLanguage = language?.toLowerCase().split(/[ (]/, 1)[0];
  const parser = normalizedLanguage ? PRETTIER_PARSERS[normalizedLanguage] : undefined;
  let formattedCode = displayCode;

  if (parser) {
    try {
      formattedCode = (await format(displayCode, { parser, printWidth: 90 })).trim();
    } catch {
      // Keep displaying the source when it is incomplete or invalid.
    }
  }

  return (
    <pre className="whitespace-pre-wrap break-words bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-100">
      <code>{formattedCode}</code>
    </pre>
  );
}

function Details({ topic }: { topic: TopicDetail }) {
  const sections = topic.details as unknown as DetailSection[];
  if (sections.length === 0) return <EmptyState label="details" />;

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{section.heading}</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">{section.body}</p>
          {section.keyPoints.length > 0 && (
            <ul className="mt-4 space-y-2 border-l-2 border-amber-500 pl-5">
              {section.keyPoints.map((point) => (
                <li key={point} className="text-sm leading-7 text-slate-700">
                  {point}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function Questions({ topic }: { topic: TopicDetail }) {
  if (topic.questions.length === 0) return <EmptyState label="questions" />;

  return (
    <ol className="divide-y divide-slate-200 border-y border-slate-200">
      {topic.questions.map((question, index) => (
        <li key={question.id} className="py-7">
          <div className="flex gap-5">
            <span className="font-mono text-sm text-slate-400">{String(index + 1).padStart(2, "0")}</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-950">{question.question}</h2>
              <p className="mt-3 border-l-2 border-amber-500 pl-4 text-base leading-7 text-slate-800">
                {question.shortAnswer}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{question.explanation}</p>
              {question.followUps.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Follow-ups</p>
                  <ul className="mt-2 space-y-1">
                    {question.followUps.map((followUp) => (
                      <li key={followUp} className="text-sm text-slate-500">
                        {followUp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Snippets({ topic }: { topic: TopicDetail }) {
  if (topic.snippets.length === 0) return <EmptyState label="code snippets" />;

  return (
    <div className="space-y-8">
      {topic.snippets.map((snippet) => (
        <article key={snippet.id} className="border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
            <h2 className="text-base font-semibold text-slate-950">{snippet.title}</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400">{snippet.language}</span>
          </header>
          <CodeBlock code={snippet.code} language={snippet.language} />
          <div className="px-5 py-4">
            <p className="text-sm leading-7 text-slate-600">{snippet.explanation}</p>
            {snippet.pitfall && (
              <p className="mt-3 border-l-2 border-red-400 pl-4 text-sm leading-7 text-slate-700">
                <span className="font-semibold text-red-700">Pitfall: </span>
                {snippet.pitfall}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Resources({ topic }: { topic: TopicDetail }) {
  if (topic.resources.length === 0) return <EmptyState label="resources" />;

  return (
    <ul className="space-y-4">
      {topic.resources.map((resource) => (
        <li key={resource.id} className="border border-slate-200 p-5">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-700 hover:underline"
          >
            {resource.title}
          </a>
          {resource.description && <p className="mt-2 text-sm leading-7 text-slate-600">{resource.description}</p>}
          <p className="mt-2 break-all text-xs text-slate-400">{resource.url}</p>
        </li>
      ))}
    </ul>
  );
}

function Practice({ topic }: { topic: TopicDetail }) {
  if (topic.practiceItems.length === 0) return <EmptyState label="practice questions" />;
  return <PracticeList items={topic.practiceItems} />;
}

function AnalogyView({ topic }: { topic: TopicDetail }) {
  const analogy = topic.analogy as unknown as Analogy | null;
  if (!analogy) return <EmptyState label="analogy" />;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">The analogy</h2>
        <div className="mt-3">
          <MarkdownContent content={analogy.realWorld} />
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Generic example</h2>
        <div className="mt-3">
          <MarkdownContent content={analogy.genericExample} />
        </div>
      </section>
      {analogy.code && (
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">In code</h2>
          <div className="mt-3">
            <CodeBlock code={analogy.code} />
          </div>
        </section>
      )}
    </div>
  );
}

const RENDERERS: Record<Section, (props: { topic: TopicDetail }) => React.ReactNode> = {
  details: Details,
  questions: Questions,
  snippets: Snippets,
  resources: Resources,
  practice: Practice,
  analogy: AnalogyView,
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ tech: string; topic: string; section: string }>;
}) {
  const { tech, topic: topicSlug, section } = await params;
  if (!isSection(section)) notFound();

  const topic = await getTopic(tech, topicSlug);
  if (!topic) notFound();

  const Renderer = RENDERERS[section];
  return <Renderer topic={topic} />;
}
