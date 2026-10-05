# Interview Preparation App Plan

## Goal

Build a GitHub-maintained interview preparation library covering any software topic (JavaScript, TypeScript, HTML, CSS, React, Next.js, Node.js, testing, system design, DevOps...). Content must be easy to review, version, search, and extend without a database.

## Rendering strategy

- Content lives in PostgreSQL and is read through server components with `revalidate`/tag-based ISR, so pages stay fast but do not need a rebuild after every edit.
- Client-side only for search interactions, filters, practice mode, and local progress state.

## Data store

**PostgreSQL (Neon or Supabase) with Prisma.** The content is genuinely relational: tech -> topics -> questions/snippets/practice, many-to-many tags, and topic-to-topic prerequisites. Cross-topic queries (mixed practice sessions, tag filters, search) are first-class in SQL, Prisma gives typed nested writes so one API call saves a whole topic, and JSONB covers the free-form sections without extra tables.

Hybrid modelling rule:
- Relational tables for anything queried **across** topics: `Question`, `Snippet`, `PracticeItem`, `Tag`.
- JSONB columns for sections only ever read **as a whole**: `Topic.details`, `Topic.analogy`.

Schema lives in [prisma/schema.prisma](prisma/schema.prisma). Ordering of child rows is explicit via a `position` column, re-derived from array order on every write.

## HTTP API

All write endpoints require a signed-in session with the `admin` role (Neon Managed Better Auth, see [src/lib/api/auth.ts](src/lib/api/auth.ts)). Bodies are validated with Zod in [src/lib/api/schemas.ts](src/lib/api/schemas.ts).

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/techs` | List techs with topic counts |
| POST | `/api/techs` | Create a tech |
| GET | `/api/techs/[tech]` | Tech with its topic list |
| PATCH | `/api/techs/[tech]` | Partial update |
| DELETE | `/api/techs/[tech]` | Delete tech and cascade topics |
| GET | `/api/topics` | Filter by `tech`, `difficulty`, `tag`, `q`, `published`, paginated |
| POST | `/api/topics` | Create a topic with all five sections in one transaction |
| GET | `/api/topics/[tech]/[topic]` | Full topic including every section |
| PATCH | `/api/topics/[tech]/[topic]` | Partial update; a supplied section replaces the old one wholesale |
| PUT | `/api/topics/[tech]/[topic]` | Idempotent create-or-replace, for sync scripts |
| DELETE | `/api/topics/[tech]/[topic]` | Delete topic and cascade sections |

## Content hierarchy

```
Tech (javascript)
  └── Topic (closures, prototypes, oops, solid-principles, event-loop, ...)
        ├── 1. Details
        ├── 2. Questions
        ├── 3. Code snippets
        ├── 4. Practice questions
        └── 5. Analogy + generic example
```

A `Tech` is the container (language / library / framework / discipline). A `Topic` is one learnable unit and always owns the same five sections, so every page renders from one predictable shape.

## Content model

Mirrors [prisma/schema.prisma](prisma/schema.prisma); the API request/response shape is the same minus ids and timestamps.

```ts
type Tech = {
  slug: string;          // "javascript"
  name: string;          // "JavaScript"
  category: "language" | "framework" | "library" | "tooling" | "concept";
  description: string;
};

type Topic = {
  slug: string;          // "closures"
  techSlug: string;      // "javascript"
  title: string;
  summary: string;
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  tags: string[];
  prerequisites: string[];   // topic slugs
  related: string[];         // topic slugs

  details: DetailSection[];  // { heading, body (markdown), keyPoints[] }
  questions: QA[];           // { id, question, shortAnswer, explanation, followUps[] }
  snippets: Snippet[];       // { id, title, language, code, explanation, pitfall? }
  practice: PracticeItem[];  // mcq | predict-output | coding
  analogy: {
    realWorld: string;       // "a backpack the function carries around"
    genericExample: string;  // language-neutral walkthrough
    code?: string;
  };
};
```

Rules:
- The database is the single source of truth; content is authored through the API, not files.
- `(techId, slug)` is unique, so a topic slug only has to be unique inside its tech.
- Any section may be empty; that tab renders a "not written yet" state instead of breaking.
- Deleting a tech or topic cascades to its children.

## Route plan

- `/` - dashboard: progress, continue studying, featured techs
- `/tech` - all techs grouped by category
- `/tech/[tech]` - topic index for a tech, with difficulty/tag filters
- `/tech/[tech]/[topic]` - redirects to the `details` tab
- `/tech/[tech]/[topic]/[section]` - one of `details | questions | snippets | practice | analogy`
- `/search` - client-side search across techs, topics, questions
- `/practice` - mixed practice session across selected techs

The section tab is a **route segment, not component state**. That gives deep links, back/forward support, per-tab static generation, and lets a shared `layout.tsx` render the topic header plus the tab bar once.

`generateStaticParams` produces `tech × topic × 5 sections` at build time; all content pages stay server components.

## State management

Split state by kind instead of putting everything in one store.

| State | Where it lives | Tool |
| --- | --- | --- |
| Content (techs, topics, sections) | PostgreSQL | Server Components querying Prisma directly + cache tags. No client store. |
| Active tab, tech, topic | URL path | Route segments + `usePathname` |
| Search text, filters, sort | URL query | `useSearchParams` + `router.replace` (shareable, no duplicated state) |
| Progress: completed, bookmarks, notes, practice answers, streak | Client, persisted | Zustand + `persist` middleware (localStorage) |
| Ephemeral UI: accordion open, copy toast, reveal answer | Component | `useState` |
| Practice session run (index, score, timer) | Feature-scoped | `useReducer` inside a `PracticeSessionProvider` |

Why Zustand for progress:
- Progress is read in many unrelated places (dashboard, tech list, topic header, tab bar); Context would re-render the whole tree on every toggle, Zustand gives selector-based subscriptions.
- `persist` handles localStorage plus versioned migrations for free.
- Tiny, works with React 19 / App Router, needs no provider.

Zero-dependency alternative: `useSyncExternalStore` over a hand-rolled localStorage store — same model, more code. Redux Toolkit is overkill; there are no async server mutations yet.

Hydration rule: persisted state must not be read during the first render of a server-rendered page. Gate it with a `hasHydrated` flag (or `skipHydration` + manual rehydrate in an effect) and render a neutral placeholder until then, otherwise progress badges cause hydration mismatches.

Store sketch:

```ts
type ProgressState = {
  completed: Record<string, "todo" | "learning" | "done">; // key: `${tech}/${topic}`
  bookmarks: string[];
  notes: Record<string, string>;
  practiceResults: Record<string, { correct: number; total: number; at: number }>;
  hasHydrated: boolean;
  setStatus(key: string, status: Status): void;
  toggleBookmark(key: string): void;
};
```

When accounts/sync arrive later, keep Zustand for optimistic local state and add TanStack Query or Server Actions for the round-trip — the table above does not change.

## Delivery phases

1. **Foundation** - Prisma schema, migrations, REST API, `/tech`, `/tech/[tech]`, `/tech/[tech]/[topic]/[section]` with the 5-tab layout. Seed the existing questions into the database.
2. **Content seeding** - 8-10 JavaScript topics (closures, scope & hoisting, `this`, prototypes & OOP, event loop, promises/async-await, SOLID principles, modules, memory & GC, ES6+ features) filled across all five sections.
3. **Progress** - Zustand persist store, status toggles, bookmarks, dashboard progress, prev/next topic navigation.
4. **Discovery** - Postgres full-text search (`tsvector` + GIN index), tag/difficulty filters in URL query, related topics.
5. **Practice mode** - `PracticeSessionProvider`, MCQ / predict-output / coding prompts, scoring, spaced-repetition review queue.
6. **Authoring UI** - admin forms over the API, draft/publish workflow, cache revalidation on write.
7. **Publishing** - GitHub Actions (lint, typecheck, `prisma migrate deploy`) and Vercel deployment.

## Initial techs

JavaScript, TypeScript, React, Next.js, Node.js, HTML, CSS, testing, system design, databases, APIs, security, DevOps, behavioral, and coding problems.