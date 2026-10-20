import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, NoObjectGeneratedError } from "ai";
import { format } from "prettier";
import {
  generateSectionResultSchemas,
  generateTopicResultSchema,
  practiceSectionResultSchema,
  type GenerateTopicRequest,
  type TopicSectionKey,
} from "@/lib/api/schemas";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

type OpenRouterModel = {
  id: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  supported_parameters?: string[];
};

let cachedModelIds: Promise<string[]> | null = null;

/// Picks a currently-live free OpenRouter model instead of a hardcoded slug that can 404 when deprecated.
async function resolveFreeModelIds() {
  let data: OpenRouterModel[];
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) throw new Error("OpenRouter model list unavailable");

    ({ data } = (await res.json()) as { data: OpenRouterModel[] });
  } catch {
    throw new Error("OpenRouter could not provide its model list. Check your network connection and try again.");
  }

  const candidates = data
    .filter(
      (model) =>
        model.id.endsWith(":free") &&
        model.pricing?.prompt === "0" &&
        model.pricing?.completion === "0" &&
        model.supported_parameters?.includes("structured_outputs")
    )
    .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0));

  const configured = process.env.OPENROUTER_MODEL;
  const preferred = candidates.find((model) => model.id === configured);
  const ordered = preferred
    ? [preferred, ...candidates.filter((model) => model.id !== preferred.id)]
    : candidates;

  if (ordered.length === 0) {
    throw new Error("OpenRouter has no currently available free models that support structured output.");
  }

  return ordered.map((model) => model.id);
}

async function generateObjectWithFallback<T>(generate: (modelId: string) => Promise<T>) {
  cachedModelIds ??= resolveFreeModelIds();
  const modelIds = (await cachedModelIds).slice(0, 2);
  let lastError: unknown;

  for (const modelId of modelIds) {
    try {
      return await generate(modelId);
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error;
      lastError = error;
    }
  }

  throw lastError;
}

const SYSTEM_PROMPT = `You are an experienced developer sharing concise interview notes with another developer.

Writing style:
- Use plain, direct language and short sentences. Sound like a person explaining something at a desk, not a course, textbook, marketing page, or AI assistant.
- Start with the substance. Never use scene-setting phrases such as "Imagine", "In today's world", "Let's dive in", "Picture this", or "Think of it as".
- Avoid filler, grand claims, repeated conclusions, rhetorical questions, and headings such as "Understanding X" or "Why X Matters".
- Explain one idea at a time. Define necessary jargon immediately and do not restate the same point in several fields.

Examples:
- Build the topic around a concrete, less-common scenario chosen specifically for it. Prefer examples from real engineering work, such as reconciling duplicate webhook deliveries, expiring a feature flag during a deployment, resuming a chunked upload, or preserving audit history after a retry.
- Do not use stock examples commonly repeated in courses: animals or vehicles for inheritance, fruit lists, toy counters, generic todo apps, coffee shops, library books, calculators, or "Hello World".
- An example must expose behavior, an edge case, or a tradeoff. Renaming variables in a textbook example does not make it original.
- Keep examples coherent across sections when useful, but do not repeat the same explanation or code.
- Keep scenarios realistic and restrained. Do not force a story where a small technical example is clearer.
- Code snippets must contain no comments. Do not include //, /* */, <!-- -->, or # comments in code fields; put any explanation in the explanation or pitfall field instead.

When drafting a full topic, fill all five sections with accurate, practical content:
1. details: 2-4 sections, each with a heading, a body paragraph (markdown), and 2-5 concise key points.
2. questions: 3-5 realistic interview questions that test reasoning about the topic, with a direct short answer, a useful explanation, and natural follow-up questions.
3. snippets: 1-3 small, runnable code snippets that demonstrate the concept or reveal a non-obvious behavior, with a title, language, explanation, and an optional genuine pitfall. Each snippet must be a complete example with at least 4 meaningful lines of code, not an import-only fragment.
4. practice: 3-5 self-assessment items mixing MCQ, PREDICT_OUTPUT, and CODING kinds. Test understanding rather than recall. MCQ items need >=2 plausible options and the answer must be one of them.
5. analogy: teach the named topic through one brief comparison. In realWorld, first describe a familiar situation, then explicitly say what each important person, object, or action represents in the topic. Use clear mapping sentences such as "The dispatcher represents..." instead of leaving the reader to infer the connection. If the topic contains several rules or principles, map and name every one separately. In genericExample, leave the analogy and show the same idea as a step-by-step software design using neutral pseudocode or component names. End by stating the practical lesson and, when useful, where the analogy stops matching the technical behavior.

Also provide a one- or two-sentence summary and up to 8 precise kebab-case tags. Keep code idiomatic for the given tech. Check every technical claim and code result before returning it.`;

const SECTION_INSTRUCTIONS: Record<TopicSectionKey, string> = {
  overview:
    "Write only the topic overview: a clear one- or two-sentence summary and up to 8 precise kebab-case tags. The summary must explain what the topic is and why a developer uses it without course-style filler.",
  details: "Write only the details section: 2-4 sections, each with a heading, a markdown body, and 2-5 key points.",
  questions:
    "Write only the questions section: 3-5 realistic interview questions with a short answer, an explanation, and follow-ups.",
  snippets:
    "Write only the snippets section: 1-3 illustrative code snippets with title, language, working code, an explanation, and an optional pitfall. Return raw source in each code field without Markdown fences. Use normal line breaks and indentation; never compress a program onto one line. Code fields must contain zero comments: do not add //, /* */, <!-- -->, or # comments.",
  practice:
    "Write only the practice section: 3-5 items mixing MCQ, PREDICT_OUTPUT, and CODING kinds. Test reasoning with topic-specific situations. MCQ items need >=2 plausible options and the answer must be one of them.",
  analogy:
    "Write only the analogy section in Markdown. Use separate paragraphs and a Markdown numbered list for step-by-step examples; never place numbered steps inline in one paragraph. The realWorld value must explicitly name the topic and map every part of the scenario to it; for multi-part topics such as SOLID, name and explain each principle separately. The genericExample value must show the equivalent software design step by step, not merely label the scenario. Prefer clarity over cleverness and avoid stock teaching analogies.",
};

function buildPrompt(request: GenerateTopicRequest) {
  return [
    `Tech: ${request.techSlug}`,
    `Topic title: ${request.title}`,
    `Difficulty: ${request.difficulty}`,
    request.notes ? `Extra notes: ${request.notes}` : null,
    request.context
      ? `Existing topic content, for consistency (do not just repeat it verbatim):\n${JSON.stringify(request.context)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function requireApiKey() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
}

function normalizePractice<T extends { kind: string; options: string[]; answer: string }>(items: T[]) {
  return items.map((item) => {
    if (item.kind !== "MCQ") return item;

    const options = item.options.length >= 2 ? item.options : [...item.options, "None of the above"];
    const answer = options.includes(item.answer) ? item.answer : options[0];
    return { ...item, options, answer };
  });
}

async function formatGeneratedSnippets<T extends { code: string; language: string }>(items: T[]) {
  return Promise.all(
    items.map(async (item) => {
      const source = item.code
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .trim();
      const language = item.language.toLowerCase().split(/[ (]/, 1)[0];
      const parser = language === "typescript" || language === "ts" ? "typescript" : language === "javascript" || language === "js" ? "babel" : null;

      if (!parser) return { ...item, code: source };

      try {
        return { ...item, code: (await format(source, { parser, printWidth: 90 })).trim() };
      } catch {
        const fallback = source
          .replace(/;\s+(?=[A-Za-z_$])/g, ";\n")
          .replace(/\{\s*/g, " {\n")
          .replace(/\s*\}/g, "\n}\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        return { ...item, code: fallback };
      }
    })
  );
}

/// Calls the LLM to draft a full topic body; the caller still owns slug/techSlug/position/published.
export async function generateTopicContent(request: GenerateTopicRequest) {
  requireApiKey();

  const { object } = await generateObjectWithFallback((modelId) =>
    generateObject({
      model: openrouter(modelId),
      schema: generateTopicResultSchema,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(request),
    })
  );

  return generateTopicResultSchema.parse({
    ...object,
    snippets: await formatGeneratedSnippets(object.snippets),
    practice: normalizePractice(object.practice),
  });
}

/// Regenerates a single section, e.g. to retry just the analogy without disturbing the rest of the form.
export async function generateTopicSection(request: GenerateTopicRequest & { section: TopicSectionKey }) {
  requireApiKey();

  const { object } = await generateObjectWithFallback((modelId) =>
    generateObject({
      model: openrouter(modelId),
      schema: generateSectionResultSchemas[request.section],
      system: `${SYSTEM_PROMPT}\n\n${SECTION_INSTRUCTIONS[request.section]} Return only that section.`,
      prompt: buildPrompt(request),
    })
  );

  if (request.section === "practice") {
    const practiceResult = generateSectionResultSchemas.practice.parse(object);
    return practiceSectionResultSchema.parse({
      practice: normalizePractice(practiceResult.practice),
    });
  }

  if (request.section === "snippets") {
    const snippetResult = generateSectionResultSchemas.snippets.parse(object);
    return generateSectionResultSchemas.snippets.parse({
      snippets: await formatGeneratedSnippets(snippetResult.snippets),
    });
  }

  return object;
}
