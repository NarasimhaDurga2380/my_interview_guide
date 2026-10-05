import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeInlineNumberedSteps } from "@/lib/markdown";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-base leading-8 text-slate-600 [&_a]:font-medium [&_a]:text-amber-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-slate-950 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-950 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-950 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeInlineNumberedSteps(content)}</ReactMarkdown>
    </div>
  );
}
