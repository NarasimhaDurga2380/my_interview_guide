"use client";

import { useState } from "react";
import { formatDifficulty } from "@/lib/content";

type PracticeItem = {
  id: string;
  kind: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  starterCode: string | null;
  difficulty: string;
};

const KIND_LABELS: Record<string, string> = {
  MCQ: "Multiple choice",
  PREDICT_OUTPUT: "Predict the output",
  CODING: "Write the code",
};

function PracticeCard({ item, index }: { item: PracticeItem; index: number }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const showAnswer = revealed || (item.kind === "MCQ" && choice !== null);

  return (
    <li className="border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
        <span className="font-mono">{String(index + 1).padStart(2, "0")}</span>
        <span>{KIND_LABELS[item.kind] ?? item.kind}</span>
        <span>{formatDifficulty(item.difficulty)}</span>
      </div>

      {item.kind === "MCQ" ? (
        <p className="mt-4 text-lg font-semibold text-slate-950">{item.prompt}</p>
      ) : (
        <pre className="mt-4 overflow-x-auto bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100">
          <code>{item.prompt}</code>
        </pre>
      )}

      {item.kind === "MCQ" && (
        <ul className="mt-4 space-y-2">
          {item.options.map((option) => {
            const isChosen = choice === option;
            const isCorrect = option === item.answer;
            const state = choice === null ? "idle" : isCorrect ? "correct" : isChosen ? "wrong" : "idle";

            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => setChoice(option)}
                  disabled={choice !== null}
                  className={`w-full border p-3 text-left text-sm transition ${
                    state === "correct"
                      ? "border-teal-600 bg-teal-50 text-teal-900"
                      : state === "wrong"
                        ? "border-red-500 bg-red-50 text-red-900"
                        : "border-slate-200 hover:border-amber-500 disabled:hover:border-slate-200"
                  }`}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {item.starterCode && (
        <pre className="mt-4 overflow-x-auto border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-700">
          <code>{item.starterCode}</code>
        </pre>
      )}

      {!showAnswer ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-5 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-amber-700 hover:text-amber-700"
        >
          Reveal answer
        </button>
      ) : (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Answer</p>
          {item.kind === "MCQ" ? (
            <p className="mt-2 text-sm font-semibold text-slate-950">{item.answer}</p>
          ) : (
            <pre className="mt-2 overflow-x-auto bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100">
              <code>{item.answer}</code>
            </pre>
          )}
          <p className="mt-4 text-sm leading-7 text-slate-600">{item.explanation}</p>
        </div>
      )}
    </li>
  );
}

export function PracticeList({ items }: { items: PracticeItem[] }) {
  return (
    <ul className="space-y-5">
      {items.map((item, index) => (
        <PracticeCard key={item.id} item={item} index={index} />
      ))}
    </ul>
  );
}
