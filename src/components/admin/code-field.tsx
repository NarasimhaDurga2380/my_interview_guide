"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import type { Extension } from "@codemirror/state";

const LANGUAGE_EXTENSIONS: Record<string, () => Extension> = {
  javascript: () => javascript({ jsx: true }),
  typescript: () => javascript({ jsx: true, typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  markdown: () => markdown(),
  sql: () => sql(),
};

export const CODE_LANGUAGES = Object.keys(LANGUAGE_EXTENSIONS);

/// Code editor field for snippet.code / practiceItem.starterCode / analogy.code.
export function CodeField({
  value,
  onChange,
  language = "typescript",
  minHeight = "160px",
}: {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  minHeight?: string;
}) {
  const extension = LANGUAGE_EXTENSIONS[language.toLowerCase()];

  return (
    <div className="overflow-hidden border border-slate-300">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extension ? [extension()] : []}
        basicSetup={{ foldGutter: false }}
        minHeight={minHeight}
        theme="dark"
      />
    </div>
  );
}
