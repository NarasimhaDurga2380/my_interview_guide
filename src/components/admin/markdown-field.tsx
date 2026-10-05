"use client";

import { useEffect, useRef } from "react";
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  ListsToggle,
  CreateLink,
  InsertCodeBlock,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

const CODE_BLOCK_LANGUAGES = {
  js: "JavaScript",
  ts: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  python: "Python",
  java: "Java",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  sql: "SQL",
  bash: "Bash",
  "": "Plain text",
};

/// Markdown WYSIWYG field for prose fields (details.body, question explanations, analogy text).
export function MarkdownField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const currentMarkdownRef = useRef(value);

  useEffect(() => {
    if (value !== currentMarkdownRef.current) {
      currentMarkdownRef.current = value;
      editorRef.current?.setMarkdown(value);
    }
  }, [value]);

  function handleChange(markdown: string) {
    currentMarkdownRef.current = markdown;
    onChange(markdown);
  }

  return (
    <div className="border border-slate-300 bg-white [&_.mdxeditor]:min-h-[140px]">
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={handleChange}
        placeholder={placeholder}
        contentEditableClassName="prose prose-sm max-w-none px-3 py-2"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
          codeMirrorPlugin({ codeBlockLanguages: CODE_BLOCK_LANGUAGES }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <ListsToggle />
                <CreateLink />
                <InsertCodeBlock />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
