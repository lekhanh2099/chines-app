# AGENTS.md — HanziHome Coding Rules

This file is the source of truth for AI coding agents and contributors working in this repository.

The goal is not to “make the UI look okay”. The goal is to keep HanziHome clean, reusable, responsive, accessible, warning-free, secure, and maintainable.

If a task conflicts with this file, stop and explain the conflict before coding.

---

## 0. Project Truth

HanziHome is a Chinese self-study app built with:

```txt
Next.js 16
React 19
TypeScript
Tailwind CSS 4
Supabase SSR / Supabase JS
TanStack Query
TanStack Form
Zod
Zustand
Radix / shadcn-style primitives
CVA / clsx / tailwind-merge
lucide-react
Sonner
Hanzi Writer
pinyin-pro
```

The current app direction is:

```txt
Static JSON content
+ lesson-first HanziHome workspace
+ standalone radical library
+ Supabase lightweight user state
```

Static JSON is the source of truth for:

```txt
lessons
vocabulary
grammar
radicals
review source items
```

Supabase is only for lightweight user state:

```txt
settings
progress
bookmarks
review_history
```

The only required learning table is:

```txt
public.user_learning_state
```

Do not store static lesson, vocabulary, grammar, or radical content in Supabase.

Do not mutate static JSON from the app.

Do not create local JSON write APIs.

---

## 1. Current Product IA

### 1.1. Lesson-based HanziHome workspace

Route:

```txt
/hanzihome
```

Lesson workspace modules:

```txt
Tổng quan
Từ vựng
Ngữ pháp
Ôn tập
```

Rules:

```txt
Lesson picker only affects lesson-based modules.
Vocabulary is lesson-based.
Grammar is lesson-based.
Review is lesson-based.
Overview is lesson-based.
```

### 1.2. Radical library

Radicals are standalone.

They are not a lesson tab.

Current accepted route:

```txt
/hanzihome?module=radicals
```

Future acceptable route:

```txt
/hanzihome/radicals
```

Rules:

```txt
Bộ thủ is not inside lesson tabs.
Do not fake lesson-related radicals.
Radical library shows all radicals from static JSON.
If lesson-related radicals are needed later, derive them from vocabulary characters.
```

Allowed TODO:

```ts
// TODO(hanzihome-radicals): Later derive lesson-related radicals from vocabulary characters.
```

---

## 2. Hard Non-negotiables

Every task must respect these rules:

```txt
No TypeScript errors.
No ESLint errors.
No build errors.
No unused imports.
No unused variables.
No console logs in committed code.
No avoidable any.
Code must be type-safe by design, not merely typecheck-clean.
No passing checks by type-casting around the problem: do not use as any, unsafe as unknown as, non-null !, broad Record<string, unknown>, or fake wrapper types to silence TypeScript instead of modeling the data correctly.
No giant components.
No duplicated state.
No storing derived data in state.
No horizontal overflow.
No random margin hacks.
No one-off duplicated Button / Select / Card / Badge / Tabs styles.
No inaccessible custom controls.
No server-only code imported into Client Components.
No service role key exposed to browser.
No trusting user_id from client input.
No DB schema changes without migration.
No fake XP, fake streak, fake progress, or fake reward data.
```

Required checks before finishing:

```bash
npm run lint
npm run typecheck
npm run build
```

A task is not done if any required check fails.

---

## 3. Required Project Structure

The app must follow the current cleaned HanziHome architecture.

Do not recreate the old vocabulary, grammar, HSK, DOCX import, or CRUD structure.

### 3.1. App routes

```txt
src/app/
  (auth)/
    login/
      page.tsx

  (app)/
    layout.tsx
    page.tsx

    hanzihome/
      page.tsx

    notes/
      page.tsx

  api/
    learning-state/
      route.ts
```

Rules:

```txt
Route pages must stay thin.
Page files compose feature-level components.
Do not put large UI directly inside route pages.
Do not recreate /vocabulary.
Do not recreate /grammar.
Do not recreate old HSK routes.
Do not recreate old import/reset routes.
```

Good:

```tsx
import { HanziHomePage as HanziHomeFeaturePage } from "@/features/hanzihome/HanziHomePage";

export default function HanziHomePage() {
 return <HanziHomeFeaturePage />;
}
```

Bad:

```tsx
export default function HanziHomePage() {
 return (
  <main>
   {/* 700 lines of lesson picker, vocab, grammar, review, modals */}
  </main>
 );
}
```

---

### 3.2. HanziHome feature structure

```txt
src/features/hanzihome/
  HanziHomePage.tsx
  HanziHomeWorkspace.tsx
  static-data.ts
  types.ts

  components/
    LessonPicker.tsx
    LessonOverview.tsx

    VocabWorkspace.tsx
    VocabList.tsx
    VocabDetailPanel.tsx

    GrammarWorkspace.tsx
    GrammarPointList.tsx
    GrammarPointReader.tsx
    GrammarPracticeMini.tsx

    RadicalWorkspace.tsx

    ReviewWorkspace.tsx

  hooks/
    useHanziHomeData.ts
    useHanziHomeLesson.ts
    useLearningState.ts
    useVocabReviewSession.ts

  utils/
    vocab-view-model.ts
    grammar-view-model.ts
    learning-state.ts
```

Rules:

```txt
HanziHomeWorkspace owns high-level module selection only.
VocabWorkspace owns vocabulary tab UI state only.
GrammarWorkspace owns grammar tab UI state only.
RadicalWorkspace is standalone and must not depend on selected lesson.
ReviewWorkspace owns temporary review session state.
static-data.ts maps static JSON into domain/view models.
utils/*view-model.ts converts raw content into UI-ready view models.
UI components should consume view models, not raw JSON directly.
```

Do not create parallel folders like:

```txt
features/vocabulary-v2
features/grammar-new
features/hsk
features/learning-old
```

unless the user explicitly asks for a new architecture.

---

### 3.3. Shared UI structure

```txt
src/components/
  layout/
    Header.tsx
    Sidebar.tsx

  providers/
    QueryProvider.tsx
    ThemeProvider.tsx

  ui/
    badge.tsx
    button.tsx
    card.tsx
    input.tsx
    segmented-control.tsx
    select.tsx
    tabs.tsx

    select/
      index.tsx
```

Rules:

```txt
Shared UI primitives contain reusable styling.
Feature files should not create one-off Button/Select/Card styles.
If a UI pattern appears twice, extract it.
Long className strings belong in shared primitives, not feature pages.
```

---

### 3.4. Supabase and API structure

```txt
src/lib/
  supabase/
    client.ts
    server.ts
    middleware.ts

src/app/api/
  learning-state/
    route.ts
```

Rules:

```txt
Only /api/learning-state is required for current learning state.
Do not recreate old vocab APIs.
Do not recreate old grammar APIs.
Do not recreate old HSK APIs.
Do not recreate DOCX import/reset APIs.
```

---

### 3.5. Static data structure

```txt
data/
  hanzihome/
    hanzihome_bundle_clean.json
```

Rules:

```txt
Static JSON is read-only from the app.
Do not mutate this JSON from UI.
Do not create local JSON write APIs.
Do not import static content into Supabase.
Convert raw JSON to view models before rendering.
UI components should not know raw JSON internals like rawSections.
```

---

### 3.6. Migration structure

```txt
supabase/
  migrations/
    YYYYMMDDHHMMSS_clean_hanzihome_learning_state.sql
```

Rules:

```txt
Keep migrations minimal.
Do not keep legacy migrations that recreate old vocab/grammar tables.
New DB changes must be explicit and reviewable.
Never add tables for static lesson/vocab/grammar content unless explicitly requested.
```

---

## 4. Legacy Modules Must Not Return

Do not import, reuse, or recreate:

```txt
VocabularyLearningModule
old GrammarCoachWorkspace
old GrammarCoachCard
old HSK modules
old vocab CRUD hooks
old grammar CRUD hooks
old DOCX import/reset logic
old normalized vocab/grammar Supabase tables
old /vocabulary route
old /grammar route
old /api/vocab/*
old /api/grammar/*
old /api/hsk/*
```

Do not recreate these tables:

```txt
vocab_courses
vocab_lessons
vocab_entries
user_vocab_entry_progress
grammar_courses
grammar_lessons
grammar_points
grammar_exercises
user_grammar_point_progress
user_grammar_exercise_attempts
saved_lessons
saved_vocabulary_items
saved_grammar_points
lesson_imports
study_progress
```

If a task seems to require these, stop and ask for clarification.

---

## 5. Database Rules

The current database model is intentionally simple.

Required table:

```txt
public.user_learning_state
```

Expected columns:

```txt
user_id
settings
progress
bookmarks
review_history
updated_at
```

Expected state shape:

```ts
type UserLearningState = {
 settings: {
  lastLessonId?: string;
  lastModule?: "overview" | "vocab" | "grammar" | "review" | "radicals";
  density?: "comfortable" | "compact" | "focus";
  vocabDetailTab?: string;
 };

 progress: {
  vocab?: Record<
   string,
   {
    level: number;
    status: "new" | "learning" | "known" | "hard";
    lastReviewedAt?: string;
   }
  >;

  grammar?: Record<
   string,
   {
    level: number;
    status: "new" | "learning" | "known" | "hard";
    lastReviewedAt?: string;
   }
  >;
 };

 bookmarks: {
  lessons?: string[];
  vocab?: string[];
  grammar?: string[];
  radicals?: string[];
 };

 reviewHistory: Array<{
  type: "vocab" | "grammar" | "radical";
  id: string;
  result: "again" | "hard" | "known";
  answeredAt: string;
 }>;
};
```

Rules:

```txt
Use RLS.
User can only manage their own row.
Never trust user_id from client input.
Derive user_id from authenticated session.
Do not expose service role key.
Do not use admin client for normal user learning state.
```

---

## 6. Supabase Client Rules

Expected clients:

```txt
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
```

Browser client:

```txt
Only for RLS-safe operations.
Never import service role key.
Never use it for privileged operations.
```

Server client:

```txt
Use in Server Components, Server Actions, and Route Handlers.
Use cookie-aware Supabase SSR client.
Do not import server client into Client Components.
```

Middleware client:

```txt
Keep middleware minimal.
Use it for auth/session routing only.
Do not fetch large app data in middleware.
```

Admin client:

```txt
Only if explicitly needed.
Must be server-only.
Must never be imported into Client Components.
Must manually validate authorization.
```

---

## 7. UI Primitive Rules

### 7.1. Required shared primitives

Use or create shared primitives before styling feature UI:

```txt
Button
IconButton
Select
SimpleSelect or AppSelect
SegmentedControl
Tabs
Card
Badge
Input
SearchInput
Textarea
EmptyState
Modal
BottomSheet
DropdownMenu
SectionHeader
StatCard
Skeleton
```

Do not create one-off button/select/card styles in feature files.

---

### 7.2. Select rules

The core Select must be a real Radix/shadcn-style primitive.

Core primitive should export:

```ts
Select;
SelectTrigger;
SelectValue;
SelectContent;
SelectItem;
```

Accepted usage:

```tsx
<Select value={value} onValueChange={setValue}>
 <SelectTrigger>
  <SelectValue placeholder="Chọn bài học" />
 </SelectTrigger>

 <SelectContent>
  <SelectItem value="hanyu2-bai-01">Bài 1: 田芳去哪儿了</SelectItem>
 </SelectContent>
</Select>
```

If there is an option-based wrapper, name it clearly:

```txt
SimpleSelect
AppSelect
```

Do not export a native `<select>` wrapper as the core `Select`.

Bad:

```tsx
export function Select(props) {
 return <select {...props} />;
}
```

Good:

```tsx
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
```

---

### 7.3. Variants

Repeated visual states must use variants through CVA or the project’s existing pattern.

Good:

```ts
const buttonVariants = cva(
 "inline-flex items-center justify-center font-bold transition-colors",
 {
  variants: {
   variant: {
    default: "...",
    outline: "...",
    ghost: "...",
    danger: "...",
   },
   size: {
    sm: "...",
    md: "...",
    lg: "...",
    icon: "...",
   },
  },
 },
);
```

Bad:

```tsx
<button className="h-10 rounded-xl bg-red-500 px-3 text-sm font-black text-white shadow-sm hover:bg-red-600">
 Save
</button>
```

---

## 8. HanziHome UI Rules

### 8.1. Overview

Overview should guide the learner into the lesson.

Show:

```txt
lesson title
vocab count
grammar point count
real progress summary if available
action cards
```

Action cards:

```txt
Học từ vựng
Học ngữ pháp
Ôn tập bài này
```

Do not show fake XP, fake streak, fake heatmap, or fake rewards.

Only show stats from static data or user_learning_state.

---

### 8.2. Vocabulary

Vocabulary tab is the highest-priority study surface.

Layout:

```txt
Left panel:
  Search input
  Category groups
  Word list
  Status badge
  Bookmark indicator

Right panel:
  Word header
  Detail sections
```

Left panel requirements:

```txt
Search by Chinese word.
Search by pinyin.
Search by Hán Việt.
Search by Vietnamese meaning.
Group words by category.
Show selected state clearly.
Show status: new / learning / hard / known.
Show bookmark indicator.
Keep list scrollable.
```

Right panel header:

```txt
Hanzi large
pinyin
Hán Việt
Vietnamese meaning
part of speech if available
level if available
bookmark button
status buttons
```

Status buttons:

```txt
Học mới
Đang học
Còn khó
Đã biết
```

Detail section order:

```txt
1. Nghĩa
2. Chiết tự / logic
3. So sánh
4. Kết hợp thường gặp
5. Ví dụ
6. Văn hóa
7. Lưu ý lỗi sai
```

Rules:

```txt
Hide empty sections.
Do not render raw arrays as flat paragraph spam.
Each section must have a clear title.
Long text must wrap nicely.
Examples must render as cards.
```

Example card structure:

```txt
Chinese sentence: bold
Pinyin: below
Vietnamese translation: below
Analysis/note: smaller text below
```

---

### 8.3. Grammar

Grammar tab is a reader first, not a coach screen.

Minimum structure:

```txt
Grammar point list
Grammar point reader
Optional quick practice
```

Grammar reader should show:

```txt
Title
Core explanation
Formula / structure
Examples
Notes / traps
Bookmark
Status actions
```

Do not bring back the old grammar coach.

---

### 8.4. Review

Review mode should be simple and useful.

Review queue:

```txt
current lesson vocab
current lesson grammar
hard/learning first
new next
known last
```

Review card should show:

```txt
item type badge: vocab / grammar
front side
back side
progress count
```

Actions:

```txt
Học lại
Còn khó
Đã biết
```

Keyboard shortcuts are allowed:

```txt
Space: flip
1: again
2: hard
3: known
ArrowRight: next
```

Do not implement advanced SRS unless explicitly requested.

---

### 8.5. Radical library

Radical library is standalone.

It should show:

```txt
all radicals from static JSON
search
radical list/grid
detail panel
index
stroke count
Vietnamese name/meaning
variants if available
recognition note if available
distinguish note if available
```

Rules:

```txt
Do not depend on selected lesson.
Do not claim radicals are related to selected lesson unless derived from vocab characters.
Do not use placeholder slicing by lesson number.
```

---

## 9. State Ownership Rules

Before adding state, answer:

```txt
Who owns this state?
Can it be derived?
Should it survive reload?
Should it be shareable by URL?
Is it server/cache data?
Is it only temporary UI state?
Is it form state?
```

Use URL/search params for shareable navigation state:

```txt
selected lesson id
main module
selected vocab id if shareable
selected grammar point id if shareable
search keyword if shareable
filter if shareable
sort if shareable
```

Use local component state for temporary UI state:

```txt
dropdown open
modal open
answer revealed
current review index
hover/focus state
section filter inside one panel
```

Use TanStack Query for async/server/cache state:

```txt
user_learning_state
Supabase reads/writes
remote user data
```

Use derived selectors or useMemo for:

```txt
filtered words
grouped words
selected word object
selected grammar object
progress totals
status counts
review queue
```

Do not store derived data in state.

Bad:

```tsx
const [filteredWords, setFilteredWords] = useState(words);
const [selectedWord, setSelectedWord] = useState(words[0]);
```

Good:

```tsx
const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

const selectedWord = useMemo(
 () => words.find((word) => word.id === selectedWordId) ?? words[0] ?? null,
 [words, selectedWordId],
);
```

---

## 10. URL State Rules

URL state must be typed.

Bad:

```ts
const mode = searchParams.get("mode") as any;
```

Good:

```ts
const module = parseHanziHomeModule(searchParams.get("module"));
```

Example:

```ts
const moduleValues = [
 "overview",
 "vocab",
 "grammar",
 "review",
 "radicals",
] as const;

type HanziHomeModule = (typeof moduleValues)[number];

function parseHanziHomeModule(value: string | null): HanziHomeModule {
 return moduleValues.includes(value as HanziHomeModule)
  ? (value as HanziHomeModule)
  : "overview";
}
```

Invalid URL params must fall back safely.

---

## 11. Component Boundary Rules

No giant component.

Bad:

```txt
One component owns:
lesson
vocab
grammar
review
filter
progress
API
keyboard shortcut
render logic
```

Good:

```txt
HanziHomeWorkspace:
  high-level module and URL state

VocabWorkspace:
  vocabulary tab UI state

VocabDetailPanel:
  selected word rendering

GrammarWorkspace:
  grammar tab UI state

RadicalWorkspace:
  standalone radical library UI

ReviewWorkspace:
  temporary review session

useLearningState:
  persistence and user state updates
```

Rules:

```txt
Components should have one clear job.
Hooks should own reusable logic.
Utils should own pure transformations.
View models should prepare data for UI.
Feature UI should not parse raw JSON deeply.
```

---

## 12. Server / Client Boundary Rules

Default to Server Components for static/read-heavy content.

Use Client Components only for:

```txt
interactive lesson selection
tabs
filters
dropdowns
review cards
bookmark/status buttons
forms
modals
audio/player controls
Hanzi Writer
browser APIs
```

Do not mark an entire page as `"use client"` because one child needs interactivity.

Thin route pages should generally stay server-side unless necessary.

Do not import server-only code into Client Components.

---

## 13. Styling Rules

Use:

```txt
Tailwind scale
design tokens
rem-based sizes
grid/flex/gap
minmax()
clamp()
logical properties where useful
```

Avoid:

```txt
random fixed px values
negative margins
transform scaling to hide layout bugs
magic widths
horizontal overflow
className soup in feature files
```

Shared primitives may contain longer className strings.

Feature files should stay readable.

Good layout:

```tsx
<div className="mx-auto flex w-full max-w-7xl flex-col gap-4">...</div>
```

Bad layout:

```tsx
<div className="ml-[-20px] w-[1390px] scale-[0.96]">...</div>
```

---

## 14. Accessibility Rules

Controls must be accessible.

Rules:

```txt
Use real buttons for actions.
Use real links for navigation.
Icon buttons need aria-label.
Dropdowns must be keyboard accessible.
Dialogs and sheets must handle focus.
Do not remove focus outlines unless replacing with visible focus style.
Color cannot be the only status indicator.
Inputs need labels or accessible names.
Text contrast must be readable.
```

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

## 15. Data and View Model Rules

Static data flow:

```txt
raw JSON
→ normalization / parsing
→ domain model
→ view model
→ UI
```

Do not scatter defensive raw JSON checks across UI components.

Good:

```txt
buildVocabViewModel()
buildGrammarViewModel()
```

UI should receive clean fields like:

```ts
type VocabViewModel = {
 id: string;
 word: string;
 pinyin: string;
 hanViet: string;
 meaning: string;
 category: string;
 examplesParsed: VocabExample[];
 detailSections: Array<{
  key: string;
  title: string;
  lines: string[];
 }>;
};
```

UI should not need to know raw `rawSections` internals.

---

## 16. Forms

Use TanStack Form only for non-trivial forms.

Current HanziHome core does not require lesson/vocab/grammar CRUD forms.

Do not add forms for editing static JSON content unless explicitly requested.

If forms are added later:

```txt
Use schema validation.
Define schemas outside components.
Show field errors near fields.
Disable submit while submitting.
Prevent double submit.
Preserve input on validation error.
```

---

## 17. TanStack Form Rules for CRUD

The app will have more CRUD forms later. All non-trivial CRUD forms must use TanStack Form.

Do not build CRUD forms with many `useState` calls.

Do not pass form values around as loose objects.

Do not silence form type errors with casts.

Code must be type-safe by design, not merely typecheck-clean.

No passing checks by type-casting around the problem: do not use `as any`, unsafe `as unknown as`, non-null `!`, broad `Record<string, unknown>`, or fake wrapper types to silence TypeScript instead of modeling the data correctly.

---

### 17.1. Required form architecture

Create one app-level form setup.

Expected structure:

```txt
src/components/form/
  form-context.ts
  use-app-form.ts
  fields/
    FormTextField.tsx
    FormTextarea.tsx
    FormSelect.tsx
    FormCheckbox.tsx
    FormSwitch.tsx
    FormErrorMessage.tsx
    FormActions.tsx
```

Rules:

```txt
useAppForm must be created once and reused.
Form field components must be registered through the app form hook.
Do not create one-off form inputs in CRUD feature files.
Do not duplicate field error rendering.
Do not duplicate submit button loading logic.
Form components must use shared UI primitives from src/components/ui.
```

---

### 17.2. Required form setup pattern

Use `createFormHook` / `createFormHookContexts` to create one reusable `useAppForm`.

Baseline pattern:

```tsx
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { FormTextField } from "@/components/form/fields/FormTextField";
import { FormTextarea } from "@/components/form/fields/FormTextarea";
import { FormSelect } from "@/components/form/fields/FormSelect";
import { FormCheckbox } from "@/components/form/fields/FormCheckbox";
import { FormSwitch } from "@/components/form/fields/FormSwitch";
import { FormActions } from "@/components/form/fields/FormActions";

const { fieldContext, formContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
 fieldContext,
 formContext,
 fieldComponents: {
  TextField: FormTextField,
  Textarea: FormTextarea,
  Select: FormSelect,
  Checkbox: FormCheckbox,
  Switch: FormSwitch,
 },
 formComponents: {
  Actions: FormActions,
 },
});
```

Rules:

```txt
Do not call raw useForm in every CRUD form unless documented.
Prefer useAppForm.
Prefer form.AppField.
Field names must be type-checked.
Field components must read value/error/meta from TanStack Form field state.
```

---

### 17.3. Schema-first CRUD forms

Every CRUD form must have a Zod schema.

Expected structure:

```txt
src/features/<feature>/
  schemas/
    <feature>.schema.ts

  components/
    <Feature>Form.tsx

  actions/ or api/
    save logic
```

Example:

```ts
import { z } from "zod";

export const noteFormSchema = z.object({
 title: z.string().min(1, "Vui lòng nhập tiêu đề"),
 content: z.string().min(1, "Vui lòng nhập nội dung"),
 tags: z.array(z.string()).default([]),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
```

Rules:

```txt
Schema is the source of truth for form values.
Infer form value types from schema.
Do not manually duplicate form value interfaces if z.infer can be used.
Validate at form boundary and server/API boundary.
Server must not trust client-side validation.
```

---

### 17.4. Default values rule

Default values must be explicit and type-safe.

Good:

```ts
const defaultValues: NoteFormValues = {
 title: "",
 content: "",
 tags: [],
};
```

Bad:

```ts
const defaultValues = {} as NoteFormValues;
```

Bad:

```ts
const defaultValues = existingData as any;
```

For edit forms, create a mapper:

```ts
function toNoteFormValues(note: NoteViewModel): NoteFormValues {
 return {
  title: note.title ?? "",
  content: note.content ?? "",
  tags: note.tags ?? [],
 };
}
```

Rules:

```txt
Do not feed raw DB rows directly into form default values.
Map DB/domain/view data into form values.
Avoid nullable values inside form state unless the field truly supports null.
```

---

### 17.5. Submit pattern

CRUD submit must use this flow:

```txt
form submit
→ schema-validated value
→ mutation/server action/API call
→ invalidate or update query cache
→ toast success/failure
→ close dialog or navigate only after success
```

Example:

```tsx
const form = useAppForm({
 defaultValues,
 validators: {
  onSubmit: noteFormSchema,
 },
 onSubmit: async ({ value }) => {
  await saveNoteMutation.mutateAsync(value);
 },
});
```

Form tag:

```tsx
<form
 onSubmit={(event) => {
  event.preventDefault();
  event.stopPropagation();
  void form.handleSubmit();
 }}
>
 ...
</form>
```

Rules:

```txt
Do not submit with raw button onClick when a real form submit is appropriate.
Do not duplicate submit state in local useState.
Use TanStack Form state and mutation pending state.
Disable submit while submitting.
Prevent double submit.
Server/API validates again.
Mutation invalidates or updates query cache.
```

---

### 17.6. Field pattern

Use `form.AppField`.

Good:

```tsx
<form.AppField
 name="title"
 children={(field) => (
  <field.TextField label="Tiêu đề" placeholder="Nhập tiêu đề" />
 )}
/>
```

Bad:

```tsx
<input value={title} onChange={(event) => setTitle(event.target.value)} />
```

Bad:

```tsx
<form.AppField
 name={"title" as any}
 children={(field) => <field.TextField label="Tiêu đề" />}
/>
```

Rules:

```txt
Field names must be literal and type-checked.
Do not cast field names.
Field components should own label, input, error, help text, disabled state, and accessibility wiring.
Use field.handleChange, field.handleBlur, and field.state.value.
Do not manually keep mirror state.
```

---

### 17.7. Validation timing

Default validation:

```txt
onSubmit for expensive or final validation
onBlur for normal field validation
onChange only for cheap fields where immediate feedback is useful
onChangeAsync only with debounce
```

Rules:

```txt
Do not run expensive validation on every keystroke.
Do not call server validation on every keystroke without debounce.
Use async validators only when needed.
Prefer server-side uniqueness checks during submit unless real-time feedback is required.
```

---

### 17.8. Mutation ownership

Use TanStack Query mutations or route handlers/server actions for CRUD saves.

Rules:

```txt
Form owns draft values.
Mutation owns server pending/error state.
Query cache owns saved server state.
Toast owns success/failure feedback.
Component local state only owns temporary UI state like dialog open/closed.
```

Do not put form draft values into Zustand.

Do not put form draft values into URL.

Do not mirror query data into form state except as initial default values.

---

### 17.9. Form component requirements

Each app form field component must support:

```txt
label
placeholder
description/help text
disabled
required indicator
error display
aria-describedby
aria-invalid
```

Each field must render errors from TanStack Form meta.

Do not render errors manually in every CRUD form.

---

### 17.10. Type-safety checklist for every CRUD form

Before finishing any CRUD form, verify:

```txt
Schema exists.
Form values are inferred from schema.
Default values are explicit.
Edit values are mapped through a mapper.
No as any.
No unsafe as unknown as.
No non-null ! to silence errors.
No fake broad type wrappers.
Field names are typed.
No duplicate local useState for form values.
Submit uses form.handleSubmit().
Server/API validates again.
Mutation invalidates or updates cache.
```

If the code passes typecheck but violates this checklist, the task is not done.

---

### 17.11. Allowed exceptions

One-off useForm is allowed only for tiny forms when all are true:

```txt
The form has 1–2 fields.
It will not grow.
It does not need reusable field components.
It does not touch persisted CRUD data.
The final report explains why useAppForm was not used.
```

CRUD forms should not use this exception by default.

---

## 18. Error, Empty, Loading States

Every data-rendering surface must handle:

```txt
loading
empty
error
no results after filtering
```

Examples:

```txt
Không có từ nào khớp bộ lọc.
Thử đổi từ khóa hoặc reset bộ lọc.
```

```txt
Bài này chưa có điểm ngữ pháp.
```

```txt
Không có bộ thủ phù hợp bộ lọc.
```

Do not leave blank white panels.

Server errors should return user-safe messages.

Do not leak raw database errors to UI.

---

## 19. Import and Naming Rules

Imports should be grouped:

```txt
React / framework
external libraries
shared UI
feature components
hooks / utils
types
```

Use `import type` for type-only imports.

Good component names:

```txt
HanziHomeWorkspace
LessonOverview
VocabWorkspace
VocabList
VocabDetailPanel
GrammarWorkspace
GrammarPointReader
RadicalWorkspace
ReviewWorkspace
```

Avoid:

```txt
Box
Thing
Content
Card2
NewUI
Temp
```

Good function names:

```txt
buildVocabViewModel
buildGrammarViewModel
filterVocabulary
getReviewQueue
normalizeLearningState
```

Avoid:

```txt
flag
check
open2
showThing
handleStuff
```

---

## 20. No Junk Rules

Do not commit:

```txt
commented-out code
vague TODOs
console logs
debug panels
unused files
dead CSS
duplicated constants
temporary names
fake data
```

Allowed TODO format:

```ts
// TODO(hanzihome-review): Add spaced repetition after the basic review flow is stable.
```

---

## 21. Security Rules

Assume every client request is untrusted.

Rules:

```txt
Enable RLS on user-owned tables.
Restrict rows by auth.uid().
Never trust client user_id.
Derive user_id from authenticated session.
Never expose service role key.
Never disable RLS to fix access.
Never log secrets.
Never commit .env.
Never render unsanitized HTML from user or AI content.
```

Normal user learning state should use RLS-safe server/client logic, not service role bypass.

---

## 22. Performance Rules

Avoid unnecessary rerenders.

Use:

```txt
stable IDs
derived selectors
useMemo for expensive transformations
component boundaries
pagination/grouping for large lists
```

Do not filter/sort/parse directly inside JSX.

Bad:

```tsx
{items
  .filter(...)
  .sort(...)
  .map(...)}
```

Good:

```tsx
const visibleItems = useMemo(
 () => getVisibleItems(items, filters),
 [items, filters],
);
```

Do not import whole icon packs.

Bad:

```ts
import * as Icons from "lucide-react";
```

Good:

```ts
import { BookOpen, GraduationCap } from "lucide-react";
```

---

## 23. Dependency Rules

Before adding a dependency:

```txt
Check package.json.
Check whether the project already has an equivalent.
Check compatibility with Next 16 and React 19.
Check bundle impact.
Explain why it is needed.
```

Do not add a dependency for one small helper.

Do not update everything blindly in one commit.

Current library roles:

```txt
Next: app framework and routing
React: UI rendering and local component state
TanStack Query: async/server/cache state
TanStack Form: complex CRUD form state
Zod: validation
Zustand: persisted/cross-route state if really needed
Radix / shadcn-style primitives: accessible UI primitives
CVA / clsx / tailwind-merge: component variants and class merging
Lucide: icons
Sonner: toast
Hanzi Writer: character writing/stroke animation
pinyin-pro: pinyin processing
Supabase: auth and user_learning_state
```

Do not misuse libraries:

```txt
Do not use TanStack Query for local UI state.
Do not use Zustand for form field state.
Do not use Context as global dumping ground.
Do not use TanStack Table for layout cards.
Do not use Lexical for plain text inputs.
```

---

## 24. Required Agent Workflow

Before coding, report briefly:

```txt
1. Affected feature/page/component.
2. Existing patterns to reuse.
3. State ownership plan.
4. Server/client boundary.
5. Files likely to change.
6. Checks to run.
```

After coding, report:

```txt
1. Files changed.
2. Components extracted/reused.
3. State ownership changes.
4. Server/Supabase/DB changes, if any.
5. Styling/token changes.
6. Performance considerations.
7. Checks run.
8. Remaining TODOs/risks.
```

Do not start by dumping more JSX into a huge existing component.

---

## 25. Final Report Format

Every task final report should include:

```txt
Changed files:
- ...

Components extracted/reused:
- ...

State ownership:
- URL:
- Local:
- TanStack Query:
- TanStack Form:
- Derived selectors:

Server/client boundary:
- Server Components:
- Client Components:
- Route Handlers:

Supabase/DB:
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

If an area was not touched, say so.

---

## 26. Definition of Done

A task is done only when:

```txt
UI works on mobile, tablet, desktop.
No horizontal overflow exists.
TypeScript passes.
ESLint passes.
Build passes.
No new warnings are introduced.
No unused imports/variables remain.
Reusable UI patterns are extracted.
Repeated visual states use variants.
State ownership is correct.
Derived data is not stored as state.
Server/client boundary is correct.
Form state uses TanStack Form for non-trivial CRUD.
Auth/ownership checks exist for user mutations.
No secrets are exposed.
Static JSON content still renders.
Final report is clear.
```

---

## 27. If Unsure

If a requested change would make the code dirtier, stop and propose a cleaner alternative.

Prefer:

```txt
extracting a component
adding a variant
creating a hook
adding a pure utility
normalizing data
reducing state
moving shareable state to URL
moving form state to TanStack Form
moving persistence to useLearningState
```

over patching a page with more one-off JSX.

Never “just make it work” by adding another wrapper with hard-coded dimensions.
