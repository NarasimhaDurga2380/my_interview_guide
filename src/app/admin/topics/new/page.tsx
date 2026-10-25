"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  createTopicSchema,
  type CreateTopicFormInput,
  type GenerateSectionResult,
  type TopicSectionKey,
} from "@/lib/api/schemas";
import { MarkdownField } from "@/components/admin/markdown-field";
import { CodeField } from "@/components/admin/code-field";
import { ListField } from "@/components/admin/list-field";
import { normalizeInlineNumberedSteps } from "@/lib/markdown";

type TechOption = { slug: string; name: string };
type EditTarget = { tech: string; topic: string };

const DIFFICULTIES = ["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"] as const;
const PRACTICE_KINDS = ["MCQ", "PREDICT_OUTPUT", "CODING"] as const;

const DEFAULT_VALUES: CreateTopicFormInput = {
  slug: "",
  techSlug: "",
  title: "",
  summary: "",
  difficulty: "FOUNDATIONAL",
  position: 0,
  published: true,
  tags: [],
  prerequisites: [],
  related: [],
  details: [],
  analogy: null,
  questions: [],
  snippets: [],
  resources: [],
  practice: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass = "w-full border border-slate-300 px-3 py-2 text-sm";

function RetrySectionButton({
  loading,
  hasContent,
  onClick,
}: {
  loading: boolean;
  hasContent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-sm font-semibold text-amber-700 disabled:opacity-50"
    >
      {loading ? "Generating…" : hasContent ? "Regenerate with AI" : "Generate with AI"}
    </button>
  );
}

export function TopicForm({
  initialValues = DEFAULT_VALUES,
  editTarget,
}: {
  initialValues?: CreateTopicFormInput;
  editTarget?: EditTarget;
}) {
  const [techs, setTechs] = useState<TechOption[]>([]);
  const [sectionLoading, setSectionLoading] = useState<Partial<Record<TopicSectionKey, boolean>>>({});
  const [sectionError, setSectionError] = useState<Partial<Record<TopicSectionKey, string | null>>>({});
  const [submitState, setSubmitState] = useState<{ status: "idle" | "success" | "error"; message?: string }>({
    status: "idle",
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTopicFormInput>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: initialValues,
  });

  const details = useFieldArray({ control, name: "details" });
  const questions = useFieldArray({ control, name: "questions" });
  const snippets = useFieldArray({ control, name: "snippets" });
  const resources = useFieldArray({ control, name: "resources" });
  const practice = useFieldArray({ control, name: "practice" });

  const title = watch("title");
  const summary = watch("summary");
  const tags = watch("tags");
  const analogyValue = watch("analogy");

  useEffect(() => {
    fetch("/api/techs")
      .then((response) => response.json())
      .then((body) => setTechs(body.data ?? []));
  }, []);

  /// Generates one section only, sending the rest of the form as context so each section stays consistent.
  async function regenerateSection(section: TopicSectionKey) {
    const currentTechSlug = getValues("techSlug");
    const currentTitle = getValues("title");
    if (!currentTechSlug || !currentTitle) {
      setSectionError((prev) => ({ ...prev, [section]: "Set a tech and title first." }));
      return;
    }

    setSectionLoading((prev) => ({ ...prev, [section]: true }));
    setSectionError((prev) => ({ ...prev, [section]: null }));
    try {
      const currentAnalogy = getValues("analogy");
      const analogyContext =
        currentAnalogy?.realWorld && currentAnalogy.genericExample ? currentAnalogy : undefined;
      const response = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techSlug: currentTechSlug,
          title: currentTitle,
          difficulty: getValues("difficulty"),
          section,
          context: {
            summary: getValues("summary") || undefined,
            tags: getValues("tags"),
            details: getValues("details"),
            analogy: analogyContext,
            questions: getValues("questions"),
            snippets: getValues("snippets"),
            practice: getValues("practice"),
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Generation failed");

      const result = body.data as GenerateSectionResult[typeof section];
      if (section === "overview") {
        const overview = result as GenerateSectionResult["overview"];
        setValue("summary", overview.summary, { shouldDirty: true, shouldValidate: true });
        setValue("tags", overview.tags, { shouldDirty: true, shouldValidate: true });
      }
      if (section === "analogy") {
        const analogy = (result as GenerateSectionResult["analogy"]).analogy;
        setValue("analogy", {
          ...analogy,
          realWorld: normalizeInlineNumberedSteps(analogy.realWorld),
          genericExample: normalizeInlineNumberedSteps(analogy.genericExample),
        });
      }
      if (section === "details") details.replace((result as GenerateSectionResult["details"]).details);
      if (section === "questions") questions.replace((result as GenerateSectionResult["questions"]).questions);
      if (section === "snippets") snippets.replace((result as GenerateSectionResult["snippets"]).snippets);
      if (section === "practice") practice.replace((result as GenerateSectionResult["practice"]).practice);
    } catch (error) {
      setSectionError((prev) => ({ ...prev, [section]: error instanceof Error ? error.message : "Generation failed" }));
    } finally {
      setSectionLoading((prev) => ({ ...prev, [section]: false }));
    }
  }

  async function onSubmit(data: CreateTopicFormInput) {
    setSubmitState({ status: "idle" });
    try {
      const endpoint = editTarget
        ? `/api/topics/${encodeURIComponent(editTarget.tech)}/${encodeURIComponent(editTarget.topic)}`
        : "/api/topics";
      const response = await fetch(endpoint, {
        method: editTarget ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Save failed");
      setSubmitState({
        status: "success",
        message: `${editTarget ? "Updated" : "Saved"} /tech/${data.techSlug}/${data.slug}`,
      });
    } catch (error) {
      setSubmitState({ status: "error", message: error instanceof Error ? error.message : "Save failed" });
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Authoring</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
        {editTarget ? "Edit topic" : "New topic"}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        {editTarget
          ? "Update the topic content, format code, or regenerate individual sections with AI."
          : "Set the topic details, then generate each section with AI as needed. Review and edit everything before saving."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-12">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Topic</h2>
            <RetrySectionButton
              loading={!!sectionLoading.overview}
              hasContent={!!(summary || tags?.length)}
              onClick={() => regenerateSection("overview")}
            />
          </div>
          {sectionError.overview && <p className="text-sm text-red-700">{sectionError.overview}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tech">
              <select {...register("techSlug")} className={inputClass}>
                <option value="">Select a tech…</option>
                {techs.map((tech) => (
                  <option key={tech.slug} value={tech.slug}>
                    {tech.name}
                  </option>
                ))}
              </select>
              {errors.techSlug && <p className="text-xs text-red-700">{errors.techSlug.message}</p>}
            </Field>
            <Field label="Difficulty">
              <select {...register("difficulty")} className={inputClass}>
                {DIFFICULTIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Title">
            <input
              {...register("title", {
                onChange: (event) => setValue("slug", slugify(event.target.value)),
              })}
              className={inputClass}
            />
            {errors.title && <p className="text-xs text-red-700">{errors.title.message}</p>}
          </Field>
          <Field label="Slug" hint="Auto-filled from the title; unique within the tech.">
            <input {...register("slug")} className={`${inputClass} font-mono`} />
            {errors.slug && <p className="text-xs text-red-700">{errors.slug.message}</p>}
          </Field>
          <Field label="Summary">
            <textarea {...register("summary")} rows={2} className={inputClass} />
            {errors.summary && <p className="text-xs text-red-700">{errors.summary.message}</p>}
          </Field>
          <Field label="Tags" hint="One per line, kebab-case.">
            <Controller
              control={control}
              name="tags"
              render={({ field }) => <ListField value={field.value ?? []} onChange={field.onChange} rows={2} />}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("published")} />
            Published
          </label>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Analogy</h2>
            <RetrySectionButton
              loading={!!sectionLoading.analogy}
              hasContent={!!(analogyValue?.realWorld || analogyValue?.genericExample || analogyValue?.code)}
              onClick={() => regenerateSection("analogy")}
            />
          </div>
          {sectionError.analogy && <p className="text-sm text-red-700">{sectionError.analogy}</p>}
          <Field label="Real-world analogy">
            <Controller
              control={control}
              name="analogy.realWorld"
              render={({ field }) => <MarkdownField value={field.value ?? ""} onChange={field.onChange} />}
            />
          </Field>
          <Field label="Generic example">
            <Controller
              control={control}
              name="analogy.genericExample"
              render={({ field }) => <MarkdownField value={field.value ?? ""} onChange={field.onChange} />}
            />
          </Field>
          <Field label="Code (optional)">
            <Controller
              control={control}
              name="analogy.code"
              render={({ field }) => (
                <CodeField value={field.value ?? ""} onChange={field.onChange} language="typescript" />
              )}
            />
          </Field>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Details</h2>
            <div className="flex items-center gap-4">
              <RetrySectionButton
                loading={!!sectionLoading.details}
                hasContent={details.fields.length > 0}
                onClick={() => regenerateSection("details")}
              />
              <button
                type="button"
                onClick={() => details.append({ heading: "", body: "", keyPoints: [] })}
                className="text-sm font-semibold text-amber-700"
              >
                + Add section
              </button>
            </div>
          </div>
          {sectionError.details && <p className="text-sm text-red-700">{sectionError.details}</p>}
          {details.fields.map((item, index) => (
            <div key={item.id} className="space-y-3 border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <input
                  {...register(`details.${index}.heading`)}
                  placeholder="Heading"
                  className={`${inputClass} font-semibold`}
                />
                <button
                  type="button"
                  onClick={() => details.remove(index)}
                  className="ml-3 text-sm text-red-700"
                >
                  Remove
                </button>
              </div>
              <Controller
                control={control}
                name={`details.${index}.body`}
                render={({ field }) => <MarkdownField value={field.value ?? ""} onChange={field.onChange} />}
              />
              <Field label="Key points" hint="One per line.">
                <Controller
                  control={control}
                  name={`details.${index}.keyPoints`}
                  render={({ field }) => <ListField value={field.value ?? []} onChange={field.onChange} />}
                />
              </Field>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Questions</h2>
            <div className="flex items-center gap-4">
              <RetrySectionButton
                loading={!!sectionLoading.questions}
                hasContent={questions.fields.length > 0}
                onClick={() => regenerateSection("questions")}
              />
              <button
                type="button"
                onClick={() =>
                  questions.append({ question: "", shortAnswer: "", explanation: "", followUps: [] })
                }
                className="text-sm font-semibold text-amber-700"
              >
                + Add question
              </button>
            </div>
          </div>
          {sectionError.questions && <p className="text-sm text-red-700">{sectionError.questions}</p>}
          {questions.fields.map((item, index) => (
            <div key={item.id} className="space-y-3 border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <input
                  {...register(`questions.${index}.question`)}
                  placeholder="Question"
                  className={`${inputClass} font-semibold`}
                />
                <button
                  type="button"
                  onClick={() => questions.remove(index)}
                  className="text-sm text-red-700"
                >
                  Remove
                </button>
              </div>
              <Field label="Short answer">
                <textarea {...register(`questions.${index}.shortAnswer`)} rows={2} className={inputClass} />
              </Field>
              <Field label="Explanation">
                <Controller
                  control={control}
                  name={`questions.${index}.explanation`}
                  render={({ field }) => <MarkdownField value={field.value ?? ""} onChange={field.onChange} />}
                />
              </Field>
              <Field label="Follow-ups" hint="One per line.">
                <Controller
                  control={control}
                  name={`questions.${index}.followUps`}
                  render={({ field }) => <ListField value={field.value ?? []} onChange={field.onChange} />}
                />
              </Field>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Code snippets</h2>
            <div className="flex items-center gap-4">
              <RetrySectionButton
                loading={!!sectionLoading.snippets}
                hasContent={snippets.fields.length > 0}
                onClick={() => regenerateSection("snippets")}
              />
              <button
                type="button"
                onClick={() =>
                  snippets.append({ title: "", language: "typescript", code: "", explanation: "", pitfall: "" })
                }
                className="text-sm font-semibold text-amber-700"
              >
                + Add snippet
              </button>
            </div>
          </div>
          {sectionError.snippets && <p className="text-sm text-red-700">{sectionError.snippets}</p>}
          {snippets.fields.map((item, index) => {
            return (
              <div key={item.id} className="space-y-3 border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    {...register(`snippets.${index}.title`)}
                    placeholder="Title"
                    className={`${inputClass} font-semibold`}
                  />
                  <input type="hidden" {...register(`snippets.${index}.language`)} />
                  <button type="button" onClick={() => snippets.remove(index)} className="text-sm text-red-700">
                    Remove
                  </button>
                </div>
                <Controller
                  control={control}
                  name={`snippets.${index}.code`}
                  render={({ field }) => <CodeField value={field.value ?? ""} onChange={field.onChange} />}
                />
                <Field label="Explanation">
                  <textarea {...register(`snippets.${index}.explanation`)} rows={2} className={inputClass} />
                </Field>
                <Field label="Pitfall (optional)">
                  <textarea {...register(`snippets.${index}.pitfall`)} rows={2} className={inputClass} />
                </Field>
              </div>
            );
          })}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Resources</h2>
            <button
              type="button"
              onClick={() => resources.append({ title: "", url: "", description: "" })}
              className="text-sm font-semibold text-amber-700"
            >
              + Add resource
            </button>
          </div>
          <p className="text-sm text-slate-500">Add useful articles, documentation, and other links for this topic.</p>
          {resources.fields.map((item, index) => (
            <div key={item.id} className="space-y-3 border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <input
                  {...register(`resources.${index}.title`)}
                  placeholder="Resource title"
                  className={`${inputClass} font-semibold`}
                />
                <button type="button" onClick={() => resources.remove(index)} className="text-sm text-red-700">
                  Remove
                </button>
              </div>
              {errors.resources?.[index]?.title && (
                <p className="text-xs text-red-700">{errors.resources[index].title.message}</p>
              )}
              <Field label="URL">
                <input
                  type="url"
                  {...register(`resources.${index}.url`)}
                  placeholder="https://example.com"
                  className={inputClass}
                />
                {errors.resources?.[index]?.url && (
                  <p className="text-xs text-red-700">{errors.resources[index].url.message}</p>
                )}
              </Field>
              <Field label="Description (optional)">
                <textarea {...register(`resources.${index}.description`)} rows={2} className={inputClass} />
              </Field>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Practice</h2>
            <div className="flex items-center gap-4">
              <RetrySectionButton
                loading={!!sectionLoading.practice}
                hasContent={practice.fields.length > 0}
                onClick={() => regenerateSection("practice")}
              />
              <button
                type="button"
                onClick={() =>
                  practice.append({
                    kind: "MCQ",
                    prompt: "",
                    options: [],
                    answer: "",
                    explanation: "",
                    starterCode: "",
                    difficulty: "INTERMEDIATE",
                  })
                }
                className="text-sm font-semibold text-amber-700"
              >
                + Add item
              </button>
            </div>
          </div>
          {sectionError.practice && <p className="text-sm text-red-700">{sectionError.practice}</p>}
          {practice.fields.map((item, index) => {
            const kind = watch(`practice.${index}.kind`);
            return (
              <div key={item.id} className="space-y-3 border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-[auto_auto_auto]">
                  <select {...register(`practice.${index}.kind`)} className={inputClass}>
                    {PRACTICE_KINDS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select {...register(`practice.${index}.difficulty`)} className={inputClass}>
                    {DIFFICULTIES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => practice.remove(index)} className="text-sm text-red-700">
                    Remove
                  </button>
                </div>
                <Field label="Prompt">
                  <textarea {...register(`practice.${index}.prompt`)} rows={2} className={inputClass} />
                </Field>
                {kind === "MCQ" && (
                  <Field label="Options" hint="One per line; the answer must be one of these.">
                    <Controller
                      control={control}
                      name={`practice.${index}.options`}
                      render={({ field }) => <ListField value={field.value ?? []} onChange={field.onChange} />}
                    />
                  </Field>
                )}
                <Field label="Answer">
                  <textarea {...register(`practice.${index}.answer`)} rows={2} className={inputClass} />
                </Field>
                <Field label="Explanation">
                  <textarea {...register(`practice.${index}.explanation`)} rows={2} className={inputClass} />
                </Field>
                {kind !== "MCQ" && (
                  <Field label="Starter code (optional)">
                    <Controller
                      control={control}
                      name={`practice.${index}.starterCode`}
                      render={({ field }) => <CodeField value={field.value ?? ""} onChange={field.onChange} />}
                    />
                  </Field>
                )}
              </div>
            );
          })}
        </section>

        <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-slate-950 bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : `${editTarget ? "Update" : "Save"} "${title || "topic"}"`}
          </button>
          {submitState.status === "success" && <p className="text-sm text-teal-700">{submitState.message}</p>}
          {submitState.status === "error" && <p className="text-sm text-red-700">{submitState.message}</p>}
        </div>
      </form>
    </main>
  );
}

export default function NewTopicPage() {
  return <TopicForm />;
}
