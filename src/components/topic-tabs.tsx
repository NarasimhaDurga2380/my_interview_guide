"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, SECTION_LABELS } from "@/lib/content";

export function TopicTabs({
  basePath,
  counts,
}: {
  basePath: string;
  counts: Partial<Record<string, number>>;
}) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Topic sections">
      {SECTIONS.map((section) => {
        const href = `${basePath}/${section}`;
        const isActive = pathname === href;
        const count = counts[section];

        return (
          <Link
            key={section}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "border-amber-500 text-slate-950"
                : "border-transparent text-slate-500 hover:text-amber-700"
            }`}
          >
            {SECTION_LABELS[section]}
            {count === undefined ? null : (
              <span className="ml-2 font-mono text-xs text-slate-400">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
