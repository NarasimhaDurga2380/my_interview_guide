"use client";

/// One line per array item (tags, key points, follow-ups, MCQ options) — simpler than nested field arrays.
export function ListField({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value.join("\n")}
      onChange={(event) =>
        onChange(
          event.target.value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        )
      }
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-slate-300 px-3 py-2 font-mono text-sm"
    />
  );
}
