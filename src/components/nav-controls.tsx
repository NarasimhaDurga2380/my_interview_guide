"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavControls() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 text-sm text-slate-500">
      <button type="button" onClick={() => router.back()} className="font-medium hover:underline">
        &larr; Back
      </button>
      <Link href="/" className="font-medium hover:underline">
        Home
      </Link>
    </div>
  );
}
