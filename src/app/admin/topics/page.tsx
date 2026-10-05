"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CATEGORIES = ["LANGUAGE", "FRAMEWORK", "LIBRARY", "TOOLING", "CONCEPT"] as const;

type Topic = {
  slug: string;
  title: string;
  difficulty: string;
  published: boolean;
};

type Tech = {
  slug: string;
  name: string;
  category: string;
  description: string;
  topics: Topic[];
  _count?: { topics: number };
};

type TechForm = {
  slug: string;
  name: string;
  category: (typeof CATEGORIES)[number];
  description: string;
};

const EMPTY_TECH: TechForm = {
  slug: "",
  name: "",
  category: "LANGUAGE",
  description: "",
};

async function readError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.error?.message ?? "Request failed";
}

export default function AdminTopicsPage() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [form, setForm] = useState<TechForm>(EMPTY_TECH);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadTechs() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/techs");
      if (!response.ok) throw new Error(await readError(response));
      const body = await response.json();
      const summaries = body.data as Array<Omit<Tech, "topics">>;
      const detailed = await Promise.all(
        summaries.map(async (tech) => {
          const detailResponse = await fetch(`/api/techs/${encodeURIComponent(tech.slug)}`);
          if (!detailResponse.ok) throw new Error(await readError(detailResponse));
          const detailBody = await detailResponse.json();
          return detailBody.data as Tech;
        })
      );
      setTechs(detailed);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load technologies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTechs();
  }, []);

  function updateForm(field: keyof TechForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createTech(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/techs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, position: techs.length }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setForm(EMPTY_TECH);
      setMessage("Technology added.");
      await loadTechs();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not add technology");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTopic(tech: Tech, topic: Topic) {
    if (!window.confirm(`Delete topic \"${topic.title}\"?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/topics/${encodeURIComponent(tech.slug)}/${encodeURIComponent(topic.slug)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await readError(response));
      await loadTechs();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete topic");
    }
  }

  async function deleteTech(tech: Tech) {
    if (!window.confirm(`Delete ${tech.name} and all of its topics?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/techs/${encodeURIComponent(tech.slug)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await readError(response));
      await loadTechs();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete technology");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Admin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Technologies and topics</h1>
          <p className="mt-3 text-slate-600">Manage the content hierarchy stored in the database.</p>
        </div>
        <Link href="/admin/topics/new" className="border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Add topic
        </Link>
      </div>

      <section className="mt-8 border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">Add technology</h2>
        <form onSubmit={createTech} className="mt-4 grid gap-4 md:grid-cols-2">
          <input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Name" className="border border-slate-300 px-3 py-2 text-sm" />
          <input required value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="slug, e.g. react" className="border border-slate-300 px-3 py-2 font-mono text-sm" />
          <select value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="border border-slate-300 px-3 py-2 text-sm">
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
          <input required value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Description" className="border border-slate-300 px-3 py-2 text-sm" />
          <button disabled={saving} className="w-fit border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-50">
            {saving ? "Adding..." : "Add technology"}
          </button>
        </form>
      </section>

      {message && <p className="mt-5 text-sm text-teal-700">{message}</p>}
      {error && <p className="mt-5 text-sm text-red-700">{error}</p>}
      {loading ? <p className="mt-10 text-slate-500">Loading database content...</p> : (
        <div className="mt-10 space-y-6">
          {techs.map((tech) => (
            <section key={tech.slug} className="border border-slate-200 bg-white">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{tech.category}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">{tech.name}</h2>
                  <p className="mt-1 font-mono text-xs text-slate-500">{tech.slug}</p>
                </div>
                <button type="button" onClick={() => deleteTech(tech)} className="text-sm text-red-700">Delete technology</button>
              </header>
              <div className="divide-y divide-slate-200">
                {tech.topics.length === 0 && <p className="p-5 text-sm text-slate-500">No topics yet.</p>}
                {tech.topics.map((topic) => (
                  <div key={topic.slug} className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <h3 className="font-semibold text-slate-950">{topic.title}</h3>
                      <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{topic.difficulty} · {topic.published ? "Published" : "Draft"}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Link href={`/admin/topics/${tech.slug}/${topic.slug}/edit`} className="font-semibold text-amber-700">Edit</Link>
                      <button type="button" onClick={() => deleteTopic(tech, topic)} className="text-red-700">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
