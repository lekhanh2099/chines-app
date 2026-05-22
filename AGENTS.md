# AGENTS.md — HanziHome Front-end / Next.js / Supabase Coding Rules

This file is the source of truth for AI coding agents and contributors working in this repository.

The goal is not to make the UI “look okay”. The goal is to keep the app clean, reusable, responsive, accessible, warning-free, secure, and maintainable.

If a task conflicts with this file, stop and explain the conflict before coding.

---

## 0. Project Context

This project is **HanziHome Hán ngữ 2**, a Chinese self-study app built with:

```txt
Next.js 16
React 19
TypeScript
Tailwind CSS 4
Supabase SSR / Supabase JS
Postgres / pg
TanStack Query
TanStack Form
TanStack Table
Zod
Zustand
Lexical
Hanzi Writer
pinyin-pro
Base UI / Radix Slot
CVA / clsx / tailwind-merge
lucide-react
Sonner
```

The app supports:

1. Giáo trình Hán ngữ lessons
2. HSK-style vocabulary study
3. saved AI-prepared lesson data
4. vocabulary overview
5. flashcards
6. deep vocabulary explanation
7. grammar formula review
8. forms/editors
9. Supabase-backed saved content and progress

The product goal is to turn saved lesson data into a real learning flow:

```txt
Choose lesson
→ Vocabulary overview
→ Flashcard active recall
→ Deep word study
→ Grammar formulas
→ Practice
```

---

## 1. Non-negotiable Rules

1. No TypeScript errors.
2. No ESLint errors.
3. No build warnings introduced by the change.
4. No unused imports.
5. No unused variables.
6. No React hook dependency warnings.
7. No console logs in committed code.
8. No `any` unless absolutely unavoidable and explained.
9. No fixed `px` layout values in new/refactored UI.
10. No random one-off `className` soup.
11. No duplicated Button / Select / Card / Badge / Tabs styles.
12. No duplicated state.
13. No derived data stored in state.
14. No horizontal overflow.
15. No magic margins, negative margins, zoom, or transform scaling to hide layout bugs.
16. No giant page components.
17. No direct mutation of React state.
18. No unnecessary dependencies.
19. No inaccessible custom controls.
20. No server-only code imported into Client Components.
21. No service role key exposed to the browser.
22. No trusting `user_id` from client input.
23. No DB schema changes without migration.
24. Existing saved lesson data must continue rendering.

Required checks before finishing:

```bash
npm run lint
npm run typecheck
npm run build
```

If test scripts exist, also run:

```bash
npm test
```

A task is not done if any required check fails.

---

## 2. Required Agent Workflow

Before coding, report briefly:

1. What feature/page/component is affected.
2. What repeated UI patterns should be extracted.
3. What state belongs in URL, local state, TanStack Form, TanStack Query, Zustand, or derived selectors.
4. What server/client boundary applies.
5. What files will likely change.
6. What checks will be run.

After coding, report:

1. Files changed.
2. Components extracted/reused.
3. State ownership changes.
4. Form changes, if any.
5. Server/Supabase/DB changes, if any.
6. Styling/token changes.
7. Performance considerations.
8. Checks run.
9. Remaining TODOs/risks.

Do not start by dumping more JSX into a huge existing component.

---

## 3. Architecture Rules

### 3.1. Thin pages

Page files should compose sections. They must not contain the whole UI.

Bad:

```tsx
export function StaticLearningPage() {
  return (
    <main>
      {/* 700 lines of header, filters, cards, grammar, flashcard, forms */}
    </main>
  );
}
```

Good:

```tsx
export function StaticLearningPage() {
  return (
    <LearningShell>
      <LessonHeader />
      <LearningModeTabs />
      <LearningContent />
    </LearningShell>
  );
}
```

### 3.2. Suggested structure

```txt
src/
  components/
    ui/
      Button.tsx
      IconButton.tsx
      Select.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      SearchInput.tsx
      Tabs.tsx
      SegmentedControl.tsx
      BottomSheet.tsx
      Modal.tsx
      EmptyState.tsx
      StatCard.tsx
      Skeleton.tsx

  features/
    hanzihome/
      components/
        shell/
          LearningShell.tsx
          LessonHeader.tsx
          LearningModeTabs.tsx
        vocabulary/
          VocabularyOverview.tsx
          VocabularyFilterPanel.tsx
          VocabularyGrid.tsx
          WordCard.tsx
          FlashcardStudy.tsx
          WordDetail.tsx
          QuickJump.tsx
        grammar/
          GrammarWorkspace.tsx
          GrammarNav.tsx
          GrammarPointView.tsx
          FormulaCard.tsx
      hooks/
        useLessonSelection.ts
        useVocabularyFilters.ts
        useFlashcardStudy.ts
        useGrammarSelection.ts
      utils/
        vocabularyFilters.ts
        learningProgress.ts
        vocabularyViewModels.ts
      types.ts

  lib/
    env.ts
    supabase/
      browser.ts
      server.ts
      middleware.ts
      admin.ts

  server/
    db/
      database.types.ts
      queryKeys.ts
      savedLessons.queries.ts
      savedLessons.mutations.ts
      vocabulary.queries.ts
      vocabulary.mutations.ts
      grammar.queries.ts
      grammar.mutations.ts
    actions/
      savedLessons.actions.ts
      vocabulary.actions.ts
      grammar.actions.ts
    schemas/
      savedLesson.schema.ts
      vocabulary.schema.ts
      grammar.schema.ts
    auth/
      requireUser.ts
      assertLessonOwner.ts
```

---

## 4. Styling and Design System Rules

### 4.1. rem-first and token-first

Use `rem`, design tokens, Tailwind scale, `clamp()`, `minmax()`, and logical properties.

Do not hard-code layout with `px`.

Bad:

```tsx
<div className="w-[320px] h-[240px] rounded-[20px]" />
```

Good:

```tsx
<div className="w-full max-w-card rounded-2xl" />
```

Better:

```css
.card {
  max-inline-size: var(--card-max);
  border-radius: var(--radius-2xl);
}
```

Allowed exceptions:

1. Hairline borders if isolated and intentional.
2. Third-party config that requires pixel values.
3. Canvas/image intrinsic rendering where CSS layout is not affected.

Prefer tokens anyway:

```css
--border-thin: 0.0625rem;
```

### 4.2. Required base tokens

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;
  --radius-pill: 999rem;

  --shell-max: 80rem;
  --reading-max: 60rem;
  --flashcard-max: 48rem;
  --sidebar-width: 14rem;
  --filter-width: 17.5rem;

  --bottom-nav-height: 4.75rem;
  --topbar-height: 4rem;
  --border-thin: 0.0625rem;
}
```

### 4.3. Breakpoints

Use `rem` / `em`, not `px`.

```css
@media (max-width: 40rem) {}
@media (min-width: 40rem) {}
@media (min-width: 64rem) {}
@media (min-width: 80rem) {}
```

Meaning:

```txt
< 24rem       small mobile
<= 40rem      mobile
>= 40rem      tablet
>= 64rem      desktop
>= 80rem      wide
```

### 4.4. Global overflow guard

```css
html,
body,
#root {
  inline-size: 100%;
  min-block-size: 100%;
  overflow-x: clip;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

img,
svg,
canvas,
video {
  max-inline-size: 100%;
  block-size: auto;
}

button,
input,
select,
textarea {
  font: inherit;
  max-inline-size: 100%;
}

[data-shell],
[data-page],
[data-panel],
[data-card],
[data-grid-item] {
  min-inline-size: 0;
  max-inline-size: 100%;
}
```

### 4.5. No className soup

Bad:

```tsx
<button className="h-10 rounded-xl bg-red-500 px-3 text-sm font-black text-white shadow-sm hover:bg-red-600 disabled:opacity-50">
  Save
</button>
```

Good:

```tsx
<Button variant="primary" size="md">
  Save
</Button>
```

Long classes are acceptable inside shared primitives, not scattered across feature pages.

---

## 5. Component System Rules

### 5.1. Required shared primitives

Use or create these before styling feature UI:

1. `Button`
2. `IconButton`
3. `Select`
4. `SegmentedControl`
5. `Tabs`
6. `Card`
7. `Badge`
8. `Input`
9. `SearchInput`
10. `Textarea`
11. `EmptyState`
12. `BottomSheet`
13. `Modal`
14. `DropdownMenu`
15. `SectionHeader`
16. `StatCard`
17. `Skeleton`
18. `FormTextField`
19. `FormTextarea`
20. `FormSelect`
21. `FormCheckbox`
22. `FormSwitch`
23. `FormErrorMessage`
24. `FormActions`

Do not create one-off button/select/card/form styles in feature files.

If a UI pattern appears twice, extract it.

### 5.2. Variants

Repeated visual states must use variants via CVA, tailwind-variants, or an equivalent project pattern.

Example:

```ts
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted",
        outline: "border border-border bg-background hover:bg-muted",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "bg-success text-success-foreground hover:bg-success/90",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-sm",
        md: "h-10 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-2xl px-5 text-base",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
```

---

## 6. Layout Rules

### 6.1. Logical properties

Prefer:

```css
inline-size
block-size
margin-inline
padding-inline
inset-inline
```

over hard-coded left/right width logic in CSS modules/global CSS.

### 6.2. No random grid templates

Bad:

```tsx
<div className="grid lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]" />
```

Good:

```tsx
<LearningSplitLayout sidebar={<FilterPanel />} content={<VocabularyGrid />} />
```

or:

```css
.learning-split-layout {
  display: grid;
  grid-template-columns: var(--filter-width) minmax(0, 1fr);
  gap: var(--space-5);
}
```

### 6.3. Content-safe grids

```css
.vocab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.5rem), 1fr));
  gap: var(--space-4);
}
```

Do not use fixed columns like `grid-cols-3` unless the content is guaranteed to fit.

### 6.4. No fixed content width/height

Bad:

```tsx
<div className="w-[760px] h-[420px]" />
```

Good:

```css
.flashcard-shell {
  inline-size: 100%;
  max-inline-size: var(--flashcard-max);
  margin-inline: auto;
}

.flashcard-card {
  min-block-size: 24rem;
}
```

### 6.5. Bottom safe area

```css
.page-content {
  padding-block-end: calc(
    var(--bottom-nav-height) + env(safe-area-inset-bottom) + var(--space-6)
  );
}
```

Floating/debug buttons must not cover bottom nav.

---

## 7. HanziHome Learning UI Rules

### 7.1. Vocabulary Overview

Purpose: scan, filter, select, jump to detail, start study.

Cards show only:

1. Hanzi
2. pinyin
3. Hán Việt
4. Vietnamese meaning
5. status badge
6. optional one example preview

Do not show full chiết tự, comparisons, or cultural notes in overview cards.

### 7.2. Flashcard

Before reveal, show only:

1. progress
2. large Hanzi
3. reveal button
4. previous / next

After reveal, show:

1. pinyin
2. Hán Việt
3. meaning
4. one short example
5. one warning if available
6. rating actions: `Đã biết`, `Học lại`, `Còn khó`

### 7.3. Word Detail

Full content belongs in detail view:

1. Meaning
2. Hán Việt & Vietnamese connection
3. Chiết tự / logic
4. Collocations
5. Examples
6. Comparison
7. Common mistakes
8. China-Vietnam note

### 7.4. Grammar

Each grammar point must use:

1. Logic cốt lõi
2. Công thức
3. Ví dụ nhanh
4. Bẫy sai
5. So sánh
6. Practice

No long unstructured article-like grammar pages.

### 7.5. Quick Jump

Desktop:

```txt
Normal content section, not floating by default.
```

Mobile:

```txt
Button opens BottomSheet.
```

Do not let chip lists overlay content.

---

## 8. State Ownership Rules

Before adding `useState`, Zustand, TanStack Query, Context, or form state, answer:

```txt
Who owns this state?
Can it be derived?
Should it survive reload?
Should it be shareable by URL?
Is it server/cache data?
Is it only temporary UI state?
Is it form state?
```

### 8.1. Decision tree

| State type | Put it where | Examples |
|---|---|---|
| Shareable navigation state | URL search params / route params | lessonId, system, mode, submode, selectedWordId, grammarPointId |
| Shareable filter/sort state | URL search params | status filter, keyword, category, sort, page |
| Async/server/cache state | TanStack Query | Supabase rows, remote user data, generated content list |
| Local temporary UI state | Component local state | modal open, active dropdown, answer revealed, current flashcard index |
| Form draft state | TanStack Form | input values, dirty fields, touched fields, validation errors |
| Cross-route persisted client state | Zustand or persistence layer | study progress, known/hard/learning status, user preferences |
| Derived data | selector / `useMemo` / pure function | filtered words, progress counts, current selected item |
| Non-rendering mutable value | `useRef` | timers, DOM refs, previous value |

### 8.2. Shareability rule

Before keeping state local, ask:

```txt
If the user sends this page to someone else, should the receiver see the same thing?
If the user reloads, should this state remain?
If the user presses Back/Forward, should this state be restored?
```

If yes, use URL state.

Use URL/search params for:

1. selected learning system
2. lesson id
3. main mode
4. submode
5. selected vocabulary word id
6. selected grammar point id
7. search keyword
8. category filter
9. status filter
10. sorting
11. pagination
12. view density if it materially changes the page

Do not use URL/search params for:

1. modal open/closed
2. dropdown open/closed
3. unsaved form field values
4. flashcard answer revealed
5. transient hover/focus state

### 8.3. URL state must be typed

Bad:

```ts
const mode = searchParams.get("mode") as any;
```

Good:

```ts
const mode = parseLearningMode(searchParams.get("mode"));
```

Example:

```ts
const learningModeValues = ["vocabulary", "grammar"] as const;
type LearningMode = (typeof learningModeValues)[number];

function parseLearningMode(value: string | null): LearningMode {
  return learningModeValues.includes(value as LearningMode)
    ? (value as LearningMode)
    : "vocabulary";
}
```

Invalid URL params must fall back safely.

### 8.4. Do not duplicate state

Bad:

```ts
const [items, setItems] = useState(vocabulary);
const [filteredItems, setFilteredItems] = useState(vocabulary);
const [selectedItem, setSelectedItem] = useState(vocabulary[0]);
```

Good:

```ts
const [selectedId, setSelectedId] = useState<string | null>(null);
const [filters, setFilters] = useState<VocabularyFilters>(defaultFilters);

const filteredItems = useMemo(
  () => filterVocabulary(items, filters),
  [items, filters],
);

const selectedItem = useMemo(
  () => items.find((item) => item.id === selectedId) ?? null,
  [items, selectedId],
);
```

Store IDs, not duplicated objects.

### 8.5. Do not store derived data

Do not store:

1. filtered list
2. sorted list
3. selected object
4. progress totals
5. status counts
6. current lesson title
7. grouped vocabulary
8. visible cards
9. grammar count
10. vocabulary count

Use pure functions/selectors.

### 8.6. Reducer for multi-step flows

Use `useReducer` when:

1. multiple state values change together,
2. transitions matter,
3. component has modes/states,
4. bugs are caused by partially updated state.

Example:

```ts
type FlashcardState =
  | { status: "question"; index: number }
  | { status: "answer"; index: number }
  | { status: "completed" };
```

---

## 9. Zustand, Context, Query Rules

### 9.1. Zustand

Use Zustand only for state that is cross-route, persistent, or shared across distant components.

Good candidates:

1. study progress by word id
2. known / hard / learning status
3. user learning preferences
4. persisted settings for flashcard behavior

Bad candidates:

1. modal open state
2. dropdown state
3. current input value
4. selected tab if it belongs in URL
5. form field values
6. filtered list
7. selected object derived from id

Use selectors.

Bad:

```ts
const store = useLearningStore();
```

Good:

```ts
const knownWordIds = useLearningStore((state) => state.knownWordIds);
const markKnown = useLearningStore((state) => state.markKnown);
```

### 9.2. Context

Do not put frequently changing state in broad Context.

Context is okay for:

1. stable configuration
2. locale
3. theme
4. narrow scoped provider
5. stable services

Context is risky for:

1. every flashcard change
2. every form input change
3. current card index
4. large vocabulary collections
5. rapidly changing progress counters

### 9.3. TanStack Query

Use TanStack Query for async/server/cache state.

Use it for:

1. Supabase data
2. remote generated lesson data
3. user account data
4. async save/load operations
5. server mutations from Client Components

Do not mirror query data into component state unless editing a draft.

Bad:

```ts
const { data } = useQuery(...);
const [items, setItems] = useState(data);
```

Good:

```ts
const { data: items = [] } = useQuery(...);
```

Query keys must be structured and stable.

Example:

```ts
const savedLessonKeys = {
  all: ["saved-lessons"] as const,
  list: (userId: string) => [...savedLessonKeys.all, "list", userId] as const,
  detail: (lessonId: string) => [...savedLessonKeys.all, "detail", lessonId] as const,
};
```

---

## 10. Form Rules

### 10.1. Use TanStack Form for non-trivial forms

Use TanStack Form for:

1. saved lesson editor
2. vocabulary editor
3. grammar editor
4. settings forms
5. profile forms
6. forms with validation
7. forms with async submit
8. forms with dirty/touched/error state
9. forms that may grow later

Do not recreate complex form state with many `useState` calls.

Bad:

```ts
const [title, setTitle] = useState("");
const [pinyin, setPinyin] = useState("");
const [meaning, setMeaning] = useState("");
const [errors, setErrors] = useState({});
const [isDirty, setIsDirty] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

Good:

```ts
const form = useAppForm({
  defaultValues,
  validators: {
    onSubmit: lessonSchema,
  },
  onSubmit: async ({ value }) => {
    await saveLesson(value);
  },
});
```

### 10.2. Form ownership

| Concern | Owner |
|---|---|
| Field value | TanStack Form |
| Field touched/dirty | TanStack Form |
| Field validation errors | TanStack Form |
| Form submission pending | TanStack Form / mutation state |
| Server save result | TanStack Query mutation or Server Action result |
| Current form route | URL if shareable |
| Modal open state | Local state |
| Saved entity after submit | Query cache / database |
| Toast after submit | UI side effect |

Do not mirror form values into Zustand or local React state.

### 10.3. Schema-first validation

Use Zod or the project’s chosen schema system consistently.

Rules:

1. Define schemas outside components.
2. Infer TypeScript types from schemas when possible.
3. Validate at form/server boundaries.
4. Show field errors near fields.
5. Show form-level errors for cross-field/server issues.
6. Do not scatter random validation `if` statements through JSX.

Example:

```ts
const vocabularySchema = z.object({
  hanzi: z.string().min(1, "Hán tự là bắt buộc"),
  pinyin: z.string().min(1, "Pinyin là bắt buộc"),
  hanViet: z.string().min(1, "Hán Việt là bắt buộc"),
  meaning: z.string().min(1, "Nghĩa tiếng Việt là bắt buộc"),
});

type VocabularyFormValues = z.infer<typeof vocabularySchema>;
```

### 10.4. Form UX

1. Show required fields clearly.
2. Show validation errors near fields.
3. Disable submit while submitting.
4. Prevent double submit.
5. Preserve input on validation error.
6. Confirm destructive actions.
7. Use toast for save success/failure.
8. Use form-level alert for server errors.
9. Do not clear form after failed submit.

---

## 11. Next.js Server/Client Boundary Rules

### 11.1. Before adding `"use client"`

Ask:

```txt
Does this component really need browser interactivity?
Does it use browser APIs?
Does it use hooks?
Does it need local state?
Does it need event handlers?
```

Default to Server Components for:

1. static/read-heavy content
2. lesson pages
3. vocabulary detail pages
4. grammar reading pages
5. data loading from database
6. SEO/shareable pages
7. content that does not need browser state

Use Client Components only for:

1. flashcard interaction
2. filters with live UI
3. forms
4. modals
5. dropdowns
6. audio/player controls
7. Hanzi Writer interaction
8. Lexical editor
9. resizable panels
10. browser APIs

Do not mark an entire page as `"use client"` because one child needs interactivity.

Bad:

```tsx
"use client";

export default function LessonPage() {
  return (
    <>
      <StaticLessonContent />
      <FlashcardStudy />
    </>
  );
}
```

Good:

```tsx
export default async function LessonPage() {
  const lesson = await getLessonById(...);

  return (
    <>
      <StaticLessonContent lesson={lesson} />
      <FlashcardStudy initialItems={lesson.vocabulary} />
    </>
  );
}
```

Only `FlashcardStudy` should be client-side.

### 11.2. Current Next/React rule

This project uses Next 16 and React 19.

Before using older patterns, check current official docs and compatibility.

Rules:

1. Do not copy old Next tutorials blindly.
2. Prefer Server Components for static/read-heavy content.
3. Keep Client Component boundaries small.
4. Do not put heavy static content into client state.
5. Do not fetch the same data server/client without reason.
6. React 19 form/action APIs may be considered where appropriate, but complex app forms should remain TanStack Form for consistency.

---

## 12. Supabase Rules

### 12.1. Separate clients

Never use one Supabase client everywhere.

Expected files:

```txt
src/lib/supabase/
  browser.ts
  server.ts
  middleware.ts
  admin.ts
```

### 12.2. Browser client

Use only for RLS-safe client operations.

Rules:

1. Only use public anon/publishable key.
2. Never import service role key.
3. Never expose privileged tables.
4. RLS must protect all browser-accessed data.

### 12.3. Server client

Use in Server Components, Server Actions, and Route Handlers.

Rules:

1. Use cookie-aware Supabase SSR client.
2. Do not use browser client on the server.
3. Do not use server client in Client Components.
4. Keep auth/session handling centralized.

### 12.4. Middleware client

Rules:

1. Keep middleware minimal.
2. Middleware is for auth/session routing, not page data.
3. Do not fetch large app data in middleware.
4. Do not put business logic in middleware.

### 12.5. Admin client

Admin/service role client is server-only and dangerous.

Rules:

1. Must import `"server-only"`.
2. Never import this file into Client Components.
3. Never expose service role key.
4. Use only for trusted server-side jobs.
5. Prefer RLS-aware server client whenever possible.
6. Every admin action must validate authorization manually.

---

## 13. Environment Variables

Public browser-safe env vars must use:

```txt
NEXT_PUBLIC_*
```

Secret env vars must not use `NEXT_PUBLIC_`.

Expected:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
```

Rules:

1. Never log secrets.
2. Never commit `.env`.
3. Never expose service role key.
4. Validate required env vars at the boundary.
5. Do not scatter `process.env.*` across feature files.

Recommended helper:

```ts
export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}
```

---

## 14. Data Access Layer Rules

Do not call Supabase directly from random components.

Create a data access layer.

Suggested:

```txt
src/server/db/
  lessons.queries.ts
  lessons.mutations.ts
  vocabulary.queries.ts
  vocabulary.mutations.ts
  grammar.queries.ts
  grammar.mutations.ts

src/server/actions/
  lessons.actions.ts
  vocabulary.actions.ts
  grammar.actions.ts
```

Rules:

1. Queries go in `*.queries.ts`.
2. Mutations go in `*.mutations.ts` or Server Actions.
3. UI components call hooks/actions, not raw database code.
4. All server DB files import `"server-only"`.
5. Validate inputs before mutation.
6. Return typed results.

Bad:

```tsx
const supabase = createClient(...);
const { data } = await supabase.from("lessons").select("*");
```

inside a random component.

Good:

```ts
const lesson = await getLessonById(lessonId);
```

---

## 15. Server Actions and Route Handlers

### 15.1. Server Actions

Use Server Actions for mutations:

1. create lesson
2. update lesson
3. delete lesson
4. save vocabulary item
5. update grammar point
6. save progress to server
7. import saved AI lesson data

Server Actions must:

1. be async,
2. validate input with Zod,
3. check auth,
4. check authorization/ownership,
5. perform mutation,
6. revalidate affected routes/tags if needed,
7. return typed success/error result,
8. not leak raw database errors to UI.

Example:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
```

### 15.2. Route Handlers

Use Route Handlers when:

1. Client Components need a conventional API endpoint.
2. Webhooks are needed.
3. External services call the app.
4. File upload/download endpoints are needed.
5. Streaming/custom response behavior is needed.

Route Handlers must:

1. validate params/body,
2. check auth when needed,
3. return proper HTTP status,
4. avoid leaking secrets,
5. not contain UI logic.

---

## 16. Auth, RLS, and Security

Assume every client request is untrusted.

Database rules:

1. Enable RLS on user-owned tables.
2. Policies must restrict rows by `auth.uid()` or equivalent ownership.
3. Never rely only on UI hiding.
4. Browser client must be safe under RLS.
5. Admin client bypasses RLS, so every admin call needs manual authorization.
6. Never use service role for normal user CRUD if RLS client can do it safely.

App rules:

1. Check authenticated user on server before user-specific reads/writes.
2. Check ownership before update/delete.
3. Do not accept `user_id` from the client as trusted.
4. Derive `user_id` from authenticated session.
5. Do not expose private data in public routes.

Bad:

```ts
await supabase
  .from("saved_lessons")
  .update(input)
  .eq("id", input.id);
```

Good:

```ts
const user = await requireUser();

await supabase
  .from("saved_lessons")
  .update(safeInput)
  .eq("id", lessonId)
  .eq("user_id", user.id);
```

Never:

1. expose service role key,
2. disable RLS to “fix” access,
3. trust client user ID,
4. commit `.env`,
5. log tokens/cookies/secrets,
6. put secrets in client bundles,
7. render unsanitized HTML from user/AI content,
8. use admin client for normal user operations,
9. skip auth checks in mutations,
10. leak raw database errors to users.

---

## 17. Postgres / Database Rules

Database changes must be explicit and reviewable.

Rules:

1. Do not change DB schema from UI code.
2. Use migrations for schema changes.
3. Keep migration files small and named clearly.
4. Never edit an already-applied production migration.
5. Add indexes for frequent filters/searches.
6. Add constraints for required integrity.
7. Use foreign keys for relations.
8. Prefer DB constraints over UI-only validation.
9. Keep enum-like values consistent between DB and TypeScript.
10. Avoid storing large derived blobs if they can be computed.

Suggested user-owned tables:

```txt
saved_lessons
saved_vocabulary_items
saved_grammar_points
study_progress
lesson_imports
```

Every user-owned table should usually include:

```txt
id
user_id
created_at
updated_at
```

Common constraints:

```txt
NOT NULL
UNIQUE where appropriate
CHECK for enum-like status
FOREIGN KEY
```

### 17.1. Database types

Generate or maintain database types.

Expected:

```txt
src/server/db/database.types.ts
```

Use typed aliases:

```ts
type SavedLessonRow = Database["public"]["Tables"]["saved_lessons"]["Row"];
type SavedLessonInsert = Database["public"]["Tables"]["saved_lessons"]["Insert"];
type SavedLessonUpdate = Database["public"]["Tables"]["saved_lessons"]["Update"];
```

UI should not consume raw database rows directly.

Use:

```txt
Database row → domain model → view model → UI
```

### 17.2. `pg` rule

Use direct Postgres only when:

1. Supabase client is insufficient,
2. migration scripts need direct DB,
3. batch scripts need SQL,
4. server-only analytics/maintenance needs it.

Rules:

1. `pg` must never be imported into Client Components.
2. `pg` modules must import `"server-only"` in app code.
3. Use parameterized queries.
4. Never concatenate user input into SQL.
5. Close/reuse pools correctly.
6. Prefer Supabase client for normal CRUD unless there is a clear reason.

Bad:

```ts
await client.query(`select * from lessons where id = '${id}'`);
```

Good:

```ts
await client.query("select * from lessons where id = $1", [id]);
```

---

## 18. Import Saved Lesson Data

AI-prepared lesson data is untrusted input.

Before saving imported data:

1. validate schema,
2. normalize strings,
3. generate stable IDs/slugs,
4. check duplicates,
5. limit payload size,
6. reject malformed examples,
7. preserve raw input only if needed,
8. store normalized version for UI.

Do not let imported content crash the app.

Do not render imported HTML unsafely.

---

## 19. Caching and Revalidation

Before adding caching, decide:

```txt
Is this user-specific?
Can it be public?
How stale can it be?
What mutation invalidates it?
```

Rules:

1. User-specific data must not be cached publicly.
2. Public/static lesson data may be cached.
3. After mutations, revalidate affected paths/tags or invalidate TanStack Query cache.
4. Do not serve another user’s data from cache.
5. Avoid duplicate fetches across server/client.

---

## 20. Performance Rules

### 20.1. Rendering

Avoid rerendering a full grid when one item changes.

Use:

1. stable item IDs,
2. memoized selectors,
3. component boundaries,
4. `React.memo` only where it helps,
5. stable callbacks when they prevent real rerenders.

Do not add `useMemo` and `useCallback` everywhere. Use them when they prevent real work or stabilize props for memoized children.

### 20.2. Large lists

If a list grows beyond roughly 200 visible items or card rendering becomes heavy, use pagination, grouping, or virtualization.

Do not render huge hidden lists just because CSS hides them.

### 20.3. Expensive work

Do not filter/sort/parse directly inside JSX.

Bad:

```tsx
{items
  .filter(...)
  .sort(...)
  .map(...)}
```

Good:

```ts
const visibleItems = useMemo(
  () => getVisibleVocabulary(items, filters, sort),
  [items, filters, sort],
);
```

### 20.4. Dependencies and bundle

Before adding a dependency:

1. Check if the project already has an equivalent.
2. Check official docs/changelog.
3. Check compatibility with Next 16 and React 19.
4. Check bundle impact.
5. Check if maintained.
6. Explain why needed.

Do not add a dependency for one small helper.

Do not import whole icon packs.

Bad:

```ts
import * as Icons from "lucide-react";
```

Good:

```ts
import { BookOpen, GraduationCap } from "lucide-react";
```

### 20.5. CSS performance

Avoid:

```css
transition: all;
```

Prefer:

```css
transition-property: color, background-color, border-color, box-shadow, transform;
```

Avoid animating layout-heavy properties:

1. width,
2. height,
3. top,
4. left,
5. margin.

---

## 21. Library Update Policy

Before installing, updating, or replacing a library:

1. Inspect `package.json`.
2. Check official docs/changelog.
3. Check compatibility with Next 16 and React 19.
4. Check whether the project already has a library for the same job.
5. Check bundle impact.
6. Check if the change creates migration work.
7. Explain why the dependency is needed.

Suggested update groups:

1. Next + eslint-config-next together.
2. React + React DOM + @types/react together.
3. TanStack packages together only after checking compatibility.
4. Lexical packages together.
5. Tailwind packages together.
6. Supabase packages together.

Do not update everything blindly in one commit unless explicitly requested.

Current library roles:

| Library | Role |
|---|---|
| Next | App framework, routing, server/client boundary |
| React | UI rendering and local component state |
| TanStack Query | async/server/cache state |
| TanStack Form | complex form state and validation |
| TanStack Table | real data tables, not layout grids |
| Zustand | persisted/cross-route client state with selectors |
| Zod | schemas and validation |
| Base UI / Radix Slot | accessible primitives/composition |
| Lexical | rich text editor |
| Hanzi Writer | stroke animation / character writing |
| pinyin-pro | pinyin processing |
| date-fns | date formatting/manipulation |
| lucide-react | icons, direct imports only |
| CVA / clsx / tailwind-merge | component variants and class merging |
| Sonner | toast notifications |
| react-resizable-panels | resizable split panels only when needed |
| pg | server-only direct Postgres, scripts, special SQL tasks |

Do not misuse libraries:

1. Do not use TanStack Table for layout cards.
2. Do not use Zustand for form field state.
3. Do not use Context as a global dumping ground.
4. Do not use Query for local UI state.
5. Do not use Lexical for plain text inputs.
6. Do not use resizable panels on mobile unless there is a clear UX reason.

---

## 22. Accessibility Rules

1. Use real buttons for actions.
2. Use real links for navigation.
3. Icon buttons need `aria-label`.
4. Dialogs and bottom sheets must trap focus.
5. Dropdowns must be keyboard accessible.
6. Do not remove focus outlines unless replacing them with visible focus styles.
7. Color cannot be the only status indicator.
8. Form inputs need labels or accessible names.
9. Text contrast must be readable.
10. Components must support keyboard operation.

Bad:

```tsx
<div onClick={handleNext}>Next</div>
```

Good:

```tsx
<button type="button" onClick={handleNext}>
  Next
</button>
```

---

## 23. Data, View Model, and Rendering Rules

### 23.1. Validate at the boundary

For static JSON / saved lesson data:

```txt
raw JSON → schema validation / normalization → typed domain model → view model → UI
```

Do not scatter defensive checks everywhere in UI.

### 23.2. View models

Create display-ready view models.

Example:

```ts
type VocabularyCardViewModel = {
  id: string;
  hanzi: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  status: StudyStatus;
  examplePreview?: string;
};
```

UI components should not know the raw JSON or raw DB row shape.

---

## 24. Error, Empty, Loading States

Every data-rendering page must handle:

1. loading,
2. empty,
3. error,
4. no results after filtering.

Examples:

```txt
Không có thẻ nào khớp bộ lọc.
Thử đổi trạng thái hoặc reset bộ lọc.
[Reset bộ lọc]
```

```txt
Bài này chưa có nội dung đã soạn.
Bạn có thể thêm dữ liệu JSON cho bài này.
```

Do not leave blank white panels.

Server errors should be logged safely and returned as user-safe messages.

Bad:

```ts
return { error: error.message };
```

Good:

```ts
console.error("updateLesson failed", {
  lessonId,
  userId: user.id,
  cause: error,
});

return {
  ok: false,
  error: "Không thể lưu bài học. Vui lòng thử lại.",
};
```

Do not log secrets or sensitive payloads.

---

## 25. Import, Naming, Junk Rules

### 25.1. Imports

1. Remove unused imports.
2. Use `import type` for type-only imports.
3. Keep imports grouped:
   - React / framework
   - external libraries
   - shared UI
   - feature components
   - hooks/utils
   - types

Example:

```ts
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";

import type { VocabularyItem } from "../types";
```

### 25.2. Names

Good component names:

```txt
LearningShell
LessonHeader
VocabularyOverview
VocabularyFilterPanel
WordCard
FlashcardStudy
GrammarWorkspace
FormulaCard
```

Avoid:

```txt
Box
Thing
Content
StaticPart
Card2
NewUI
Temp
```

Good function names:

```txt
filterVocabulary
sortVocabulary
getStudyProgress
normalizeLessonData
buildVocabularyViewModel
```

Good boolean names:

```txt
isAnswerRevealed
hasExamples
canGoNext
shouldShowFilterSheet
```

Avoid:

```txt
flag
check
open2
showThing
```

### 25.3. No junk

Do not commit:

1. commented-out code,
2. vague TODOs,
3. console logs,
4. debug panels in production,
5. unused files,
6. dead CSS,
7. duplicated constants,
8. temporary names.

Allowed TODO format:

```ts
// TODO(hanzihome-ui): Replace this fallback after saved lesson schema v2 is finalized.
```

---

## 26. Testing and QA

If testing tools exist, add tests for:

1. pure utilities,
2. filtering/sorting logic,
3. learning progress calculation,
4. flashcard reducer,
5. data normalization,
6. server validation schemas.

At minimum, pure functions must be easy to test.

Manual QA checklist:

1. Desktop wide.
2. Desktop normal.
3. Tablet.
4. Mobile.
5. No horizontal overflow.
6. Flashcard before reveal.
7. Flashcard after reveal.
8. Empty filter.
9. No lesson selected.
10. Long Chinese title.
11. Long Vietnamese meaning.
12. Long pinyin.
13. Bottom nav.
14. Modal/bottom sheet.
15. Keyboard navigation.
16. Server mutation success.
17. Server mutation error.
18. Auth/ownership path if relevant.

---

## 27. State Review Checklist

Before adding state, answer:

```txt
1. Is this state shareable?
2. Should it be in the URL?
3. Can it be derived?
4. Is it server/cache state?
5. Is it form state?
6. Is it cross-route persisted state?
7. Can it stay local?
8. Does it need a reducer?
9. Will it cause broad rerenders?
10. What resets it?
```

If these questions are not answered, do not add the state yet.

---

## 28. Final Report Requirements

For every task, final report must include:

```txt
Changed files:
- ...

Components extracted/reused:
- ...

State ownership:
- URL:
- Local:
- TanStack Form:
- TanStack Query:
- Zustand:
- Derived selectors:

Forms:
- Schema:
- Validation:
- Submit owner:
- Error handling:

Server/client boundary:
- Server Components:
- Client Components:
- Server Actions:
- Route Handlers:

Supabase/DB:
- Browser client:
- Server client:
- Admin client:
- Tables touched:
- Migrations:
- RLS impact:

Styling:
- Tokens:
- Variants:
- Responsive changes:

Checks:
- npm run lint:
- npm run typecheck:
- npm run build:

Remaining TODOs/risks:
- ...
```

If an area was not touched, explicitly say so.

---

## 29. Definition of Done

A task is done only when:

1. UI works on mobile, tablet, desktop.
2. No horizontal overflow exists.
3. TypeScript passes.
4. ESLint passes.
5. Build passes.
6. No new warnings are introduced.
7. No unused imports/variables remain.
8. Reusable UI patterns are extracted.
9. Repeated visual states use variants.
10. State ownership is correct.
11. Derived data is not stored as state.
12. Forms use TanStack Form + schema validation when non-trivial.
13. Server/client boundary is correct.
14. Auth/ownership checks exist for mutations.
15. No secrets are exposed.
16. Existing saved lesson data still renders.
17. Final report is clear.

---

## 30. If Unsure

If a requested change would make the code dirtier, stop and propose a cleaner alternative.

Prefer:

1. extracting a component,
2. adding a variant,
3. creating a hook,
4. adding a utility,
5. normalizing data,
6. reducing state,
7. moving shareable state to URL,
8. moving server logic to server layer,

over patching a page with more one-off JSX.

Never “just make it work” by adding another wrapper with hard-coded dimensions.
