# AGENTS.md — HanziHome Coding Rules

This file is the source of truth for AI coding agents and contributors working in this repository.

If a task conflicts with this file, stop and explain the conflict before coding.

HanziHome is a Chinese self-study app. The goal is not just to make the UI look acceptable; the goal is to keep the study flow safe while the data model becomes editable and backend-ready.

## 0. Project Truth

Current stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, TanStack Query, TanStack Form, Zod, Zustand, Radix/shadcn-style primitives, Sonner, Hanzi Writer, pinyin-pro, and Lexical.

Content ownership:

- Static JSON is built-in seed/fallback content.
- Supabase is for user-created content, custom lessons, drafts, user-owned overrides, notes, settings, progress, bookmarks, and review history.
- Course → Book/Volume → Lesson → Module is the current model.
- Lesson notes belong to the main Notes system and should be linked through a relation table, not embedded as note IDs inside lesson JSON.

Do not mutate static JSON from the app.

Do not create local JSON write APIs.

Do not duplicate built-in static JSON into Supabase as a second source of truth unless the task is an explicit seed import/migration task.

If seed content is editable, the persistence model must be explicit: admin-only seed edit or copy-on-write user override. Do not silently turn a shared seed row into a user-owned row.

## 1. Product IA

Home route `/` is the course library entry point.

Workspace route `/hanzihome` follows: Course → Book/Volume → Lesson → Module.

Lesson modules include overview, lesson text when available, vocabulary, grammar, review, and radicals as a standalone module. Radicals are not a lesson tab.

Rules:

- The user chooses a course before entering the learning workspace.
- Lesson picker only shows lessons in the active course.
- Book grouping comes from course/book metadata.
- Vocabulary, grammar, review, and overview are lesson-based.
- Published custom lesson drafts must keep courseId/bookId metadata.
- Course cards must show real stats, not hard-coded values.

## 2. Data Loading Contract

Before implementing any screen or feature, define the data-loading contract.

Every feature must answer:

- What data is needed above the fold?
- What data is needed only after user interaction?
- What data must not be loaded on this screen?
- Which hook/repository/endpoint owns the data?
- What is the fallback behavior?
- What is the cache/query key?
- What is the expected payload size?

Rules:

- Dashboard/library screens load summary data only.
- Course cards must not load full lesson detail.
- Lesson workspace may load only the selected lesson detail.
- Vocab/grammar examples and detail sections must be fetched only for the selected lesson or an explicit aggregate page.
- Aggregate vocab/grammar pages are the normal place to load all vocab/grammar across a book/course/all.
- Do not use one giant all-data endpoint for every screen.
- Do not fetch all records just to calculate counts.
- Counts come from summary queries, database counts, or lightweight grouped views.
- Static fallback must follow the same contract: summary fallback for dashboard, detail fallback for lesson.

Preferred split:

- `/api/hanzihome/catalog`: course/book/lesson summary and counts only.
- `/api/hanzihome/lessons/[lessonId]`: one selected lesson detail only.
- `/api/hanzihome/aggregate/vocab`: scoped aggregate vocab/review data only.
- `/api/hanzihome/aggregate/grammar`: scoped aggregate grammar/review data only.

Bad: dashboard fetches all lessons, all vocab, all examples, all detail sections, then reduces counts.

Good: dashboard fetches catalog summary; lesson workspace fetches selected lesson detail.

## 3. Hard Non-negotiables

Every task must respect these rules:

- No TypeScript errors.
- No ESLint errors.
- No build errors.
- No unused imports.
- No unused variables.
- No console logs in committed code.
- No avoidable `any`.
- Code must be type-safe by design, not merely typecheck-clean.
- Do not silence TypeScript with unsafe casts instead of modeling data correctly.
- No giant components.
- No duplicated state.
- No storing derived data in state.
- No horizontal overflow.
- No random margin hacks.
- No one-off duplicated Button/Select/Card/Badge/Tabs styles.
- No inaccessible custom controls.
- No server-only code imported into Client Components.
- No browser exposure of backend-only credentials.
- No trusting client-provided identity fields.
- No DB schema changes without migration.
- No fake XP, fake streak, fake progress, or fake reward data.

Required checks before finishing:

```bash
npm run lint
npm run typecheck
npm run build
```

A task is not done if any required check fails.

If the task touches import/parser/data migration, also run the relevant data script from `package.json`.

## 4. Project Structure Rules

Route pages must stay thin. Page files compose feature-level components.

Do not put large UI directly inside route pages.

Do not recreate old `/vocabulary`, `/grammar`, old HSK routes, old import/reset routes, or old CRUD pages unless explicitly requested.

Expected HanziHome structure:

```txt
src/features/hanzihome/
  HanziHomePage.tsx
  HanziHomeWorkspace.tsx
  static-data.ts
  db-data.ts
  types.ts
  hanzihome-api.schemas.ts
  components/
  hooks/
  editing/
```

## 5. Study Mode, Debug Mode, Edit Mode

These modes must remain separate.

Study Mode is the default learner-facing experience.

Debug/Audit Mode is for developer data inspection.

Edit Mode is for form/dialog-based content editing.

Study Mode rules:

- Do not show raw JSON.
- Do not show renderer/debug metadata unless useful to learners.
- Do not spoil exercise answers by default.
- Exercise answers must be collapsed by default.
- Keep the UI focused on learning.

Debug/Audit Mode rules:

- May show raw section/item JSON.
- May show unmapped fields.
- May show source files and payload counts.
- Must be toggled explicitly.
- Must not be the default learner path.

Edit Mode rules:

- Must not replace Study Mode.
- Must be an overlay on top of the current render tree.
- Must use forms/dialogs, not raw JSON textareas as the main editor.
- Must not mutate renderer props directly.
- Must save the smallest possible field/node change.

## 6. Editable UI Contract

The editable system must follow the current render tree.

Do not build only large dialogs such as `EditGrammarDialog` or `EditExerciseDialog` that submit a whole object by default.

Anything rendered as a small meaningful card/block should be editable as that node.

Current render tree to respect:

```txt
BookSectionContent
→ section by type

text
→ TextBlockView
→ scenes / lines / paragraphs when available

vocabulary
→ VocabMiniGrid / VocabDetailPanel
→ vocab item
→ examples
→ detail sections

proper_nouns
→ ProperNounCard

notes
→ NoteCard

grammar
→ GrammarCard
→ grammar point
→ grammar block
→ formulas
→ block items
→ examples
→ notes

exercises
→ ExerciseCard
→ ExerciseBody by type
→ questions
→ word_bank
→ answer_key
→ matching left/right/matches
→ dialogue lines
→ sample answers
→ cloze segments
→ cloze answers

reading
→ ReadingCard
→ reading item
→ paragraphs/questions/answers/cloze segments when available

character_writing
→ WritingCard
→ character writing item

summary
→ SummarySectionView
→ summary groups/items
```

Required editable node types:

- lesson
- section
- vocab_item
- vocab_example
- vocab_detail_section
- proper_noun
- character_writing_item
- grammar_point
- grammar_block
- grammar_formula
- grammar_example
- grammar_block_item
- exercise
- exercise_question
- exercise_answer_key
- exercise_word_bank
- exercise_matching_item
- exercise_dialogue_line
- exercise_cloze_segment
- exercise_cloze_answer
- reading_item
- reading_question

Correct abstraction: rendered node → edit button in Edit Mode → dialog form for that node → validate fields → save only that node/field.

Wrong abstraction: open a huge grammar/vocab/exercise dialog → submit a full object → delete/reinsert every child row.

## 7. Field/Node-Level Save Contract

This rule is critical.

UI field-level editing must map to data field/node-level persistence.

If the user edits one field, save only that field or the smallest owning node.

Do not submit a whole object when only one part changed.

Do not delete/reinsert all child arrays during normal edits.

Bad flow:

- User edits vocab meaning.
- UI submits word, pinyin, meaning, examples, and detailSections.
- API updates vocab row.
- API deletes all examples.
- API deletes all detail sections.
- API reinserts all child rows.

Good flow:

- User edits vocab meaning.
- API patches vocab core fields only.
- Examples and detail sections are untouched.

Good flow:

- User edits one vocab example translation.
- API patches that one vocab_example row only.
- Other examples are untouched.

Good flow:

- User edits one grammar detail section line.
- API patches that one grammar_detail_section row only.
- Grammar point core and other sections are untouched.

Normal save routes must never do replace-all child operations.

Replace-all is allowed only as an explicit bulk action with clear UI copy and a separate route/action name.

The phrase “field-by-field UI” is not enough. The save strategy must also be field/node-level.

## 8. Stable IDs for Editable Child Nodes

Node-level editing requires stable IDs.

Every editable child node must have an ID before it can be safely edited:

- vocab examples
- vocab detail sections
- grammar examples
- grammar detail sections
- grammar formulas
- grammar block items
- exercise questions
- exercise choices
- exercise answer key items
- exercise word bank entries when individually editable
- exercise dialogue lines
- exercise cloze segments
- exercise cloze answers
- reading questions

Do not key editable children only by array index when saving to DB.

Index-based IDs are acceptable only as a temporary static-render fallback, not as a durable backend edit contract.

## 9. Form Rules

New edit UIs must use forms.

Use TanStack Form + Zod for non-trivial editable forms.

`useState` is acceptable for dialog open/closed state and tiny UI state. Do not use `useState` as the main form engine for nested editable data that needs validation, dirty-field tracking, reset, or field-level save.

Every form must have:

- initial values from an adapter
- field-level validation where practical
- submit validation
- clear error rendering
- disabled/loading state during submit
- reset/cancel behavior
- dirty-state awareness when practical

Dialog footer should generally include: Hủy, Reset when useful, Preview diff when useful, and Lưu.

Do not use a raw JSON textarea as the main editor. Raw JSON can exist only in Debug/Audit Mode or explicit developer tools.

## 10. Required Update Schemas

Do not rely on one full-object update schema for normal edits.

Vocab update contracts should be split at minimum into:

- updateVocabCorePayloadSchema
- updateVocabExamplePayloadSchema
- updateVocabDetailSectionPayloadSchema

Grammar update contracts should be split at minimum into:

- updateGrammarCorePayloadSchema
- updateGrammarExamplePayloadSchema
- updateGrammarDetailSectionPayloadSchema

Exercise update contracts should be split by node/type, for example:

- updateExerciseMetadataPayloadSchema
- updateExerciseQuestionPayloadSchema
- updateExerciseAnswerKeyPayloadSchema
- updateExerciseWordBankPayloadSchema
- updateExerciseMatchingItemPayloadSchema
- updateExerciseDialogueLinePayloadSchema
- updateExerciseClozeSegmentPayloadSchema
- updateExerciseClozeAnswerPayloadSchema

Reading update contracts should be split by node, for example:

- updateReadingItemPayloadSchema
- updateReadingQuestionPayloadSchema
- updateReadingClozeSegmentPayloadSchema
- updateReadingAnswerPayloadSchema

Each schema should validate only the fields owned by that node.

## 11. API/DB Persistence Rules

Server routes must never trust client identity fields.

Always get the user from the server-side session.

Always verify ownership/editability server-side.

Always verify parent-child relationships server-side:

- vocab example belongs to vocab item
- vocab item belongs to lesson
- grammar example belongs to grammar point
- grammar point belongs to lesson
- exercise question belongs to exercise
- exercise belongs to lesson

Do not accept lessonId as proof. Use it only as an expected constraint, then verify it against DB rows.

Do not perform multi-step destructive updates in route handlers without a transaction.

If a save flow requires update parent, delete children, and insert children, it must be an explicit bulk replace operation and should be implemented transactionally.

Normal field/node edits should be single-row updates whenever possible.

## 12. Seed, Custom, and Override Rules

DB rows must have a clear content ownership model.

Supported concepts:

- seed = built-in/shared content imported from static sources
- custom = user-created content
- user_override = user-owned override of seed content

If the DB currently only supports `source: "seed" | "custom"`, do not fake a user override by mutating shared seed rows unless the product explicitly says seed is admin-editable only.

For normal users editing seed content, prefer copy-on-write:

- seed row remains unchanged
- user override row is created
- view model resolves user override over seed row

For admin seed edits:

- verify admin role server-side
- edit seed row directly
- invalidate/rebuild seed-derived views when needed

A route that updates seed content must state whether it is admin seed edit or user override edit.

## 13. Draft Patch Layer

Before expanding backend persistence to all lesson nodes, prefer a draft patch layer for UI validation.

Patch shape:

```ts
type DraftPatch = {
 id: string;
 lessonId: string;
 entityType: string;
 entityId: string;
 parentEntityType?: string;
 parentEntityId?: string;
 path?: Array<string | number>;
 op: "update" | "create" | "delete" | "reorder";
 before?: unknown;
 after?: unknown;
 createdAt: string;
};
```

Use draft patches to prove:

- which node the UI edits
- which fields change
- whether the renderer updates correctly
- what backend contract is actually needed

Do not expand DB PATCH routes for complex practice/exercise data until the edit node and patch shape are clear.

## 14. Exercise and Practice Coverage Rules

Exercise/practice data is the highest-risk area.

Do not add DB persistence for a new exercise type until all rendered subparts are identified.

For each exercise type, document and cover:

- metadata
- instruction
- rendering config
- questions/items
- word bank
- choices/options
- answer / answers / answer_key
- acceptable answers
- explanations
- grammar refs
- vocab refs
- dialogue lines
- sample answers
- cloze passage segments
- cloze answers
- matching left/right/matches

Known exercise families to respect:

- choose_words_fill_blank
- fill_blank
- answer_with_pattern
- correct_sentence
- multiple_choice
- matching
- phonetics
- read_aloud
- substitution
- complete_dialogue
- communication_dialogue
- reading_cloze
- reading_true_false
- reading_short_answer
- reading_multiple_choice
- generic fallback

Practice edit acceptance for each supported type:

- Editing exercise metadata does not touch questions/answers.
- Editing one question does not touch other questions.
- Editing one answer key item does not touch other answer key items.
- Editing word_bank does not touch questions unless explicitly intended.
- Editing a dialogue line does not touch sample answers.
- Editing a cloze segment does not touch unrelated answers.
- Normal edits do not delete/reinsert full arrays.

## 15. Lesson Overview Renderer Rules

The lesson overview renderer is data-sensitive.

Rules:

- Do not make Study Mode parse arbitrary raw JSON in every component forever.
- Unknown/flexible shape handling belongs in import adapters, normalizers, or debug fallback renderers.
- Study renderer should prefer typed view models.
- Debug renderer may show raw/unmapped payload.
- Do not hide available data silently.
- If data cannot be rendered, show a clear fallback and report the unmapped field/type.

When adding a new renderer:

- identify the exact data shape
- add a type/schema if stable
- add a renderer only for that shape
- add debug fallback for unmapped fields
- add UI audit coverage when practical

## 16. Backend Migration Strategy

Do not migrate by breaking the current study flow.

Preferred strategy:

- keep static fallback
- introduce repository/data-access layer
- add API compatibility endpoint if needed
- compare static and API output
- gradually move modules to smaller DTOs/endpoints

Do not immediately replace the current UI with ten small endpoint calls.

Do not force the client to reconstruct a lesson from unrelated API calls unless the repository layer owns that composition.

Backend DTOs should be designed from proven UI edit/read contracts, not guessed from raw JSON blobs.

Raw import data, domain entities, API DTOs, and UI view models are separate concepts:

```txt
Raw import data ≠ domain model ≠ API DTO ≠ UI view model
```

## 17. Query and Cache Rules

Use stable TanStack Query keys.

Keys must include every variable that changes the returned data.

Good:

```ts
["hanzihome", "catalog"][("hanzihome", "lesson-detail", lessonId)][
 ("hanzihome", "lesson", lessonId, "vocab", filters)
][("hanzihome", "vocab", vocabItemId)];
```

Bad:

```ts
["lesson"][("hanzihome", "data")];
```

After mutation, invalidate the smallest correct scope.

Do not invalidate the entire catalog when only one vocab example changed unless the catalog stats depend on that change.

## 18. UI and Accessibility Rules

Use existing shared UI primitives where possible.

Rules:

- Keep typography hierarchy clear.
- Avoid cramped cards.
- Avoid random margins.
- No horizontal overflow.
- Clickable custom controls need keyboard support and aria labels when necessary.
- Dialog focus must be managed by the dialog primitive.
- Do not show answer content by default in practice UI.
- Do not show developer raw JSON in Study Mode.

For Chinese text:

- Set `lang="zh-CN"` where appropriate.
- Preserve pinyin visibility controls.
- Preserve Vietnamese meaning visibility controls.
- Do not assume Japanese glyph fonts for Mainland Chinese learning content unless explicitly labeled.

## 19. Import, Normalization, and Data Audit Rules

Import scripts must not silently drop content.

When normalizing raw lesson data:

- preserve source references when available
- add stable IDs for editable nodes
- validate required fields
- report unmapped fields
- report missing pinyin/meaning where expected
- report duplicate IDs
- report orphan refs

UI should not compensate forever for bad import data.

If a renderer needs many fallback keys, consider moving that logic into an import adapter/normalizer.

## 20. Task Workflow for AI Agents

Before coding:

- Read the relevant files.
- Identify current data shape.
- Identify current render tree.
- Identify whether the task is Study, Debug, Edit, API, DB, or Import.
- State the smallest safe implementation slice.

While coding:

- Make minimal focused changes.
- Do not mix UI redesign, DB migration, and parser changes in one task unless explicitly requested.
- Do not expand scope from vocab/grammar to exercises without asking.
- Do not add direct DB writes for new content families until the edit contract is reviewed.

Before finishing:

- Run required checks.
- Explain what changed.
- List any unsupported shapes or follow-up risks.
- Be honest if something is not fully covered.

## 21. Explicit Stop Conditions

Stop and ask before coding if:

- The requested change would mutate static JSON from the app.
- The change requires editing seed DB rows but admin/copy-on-write policy is unclear.
- The change requires delete/reinsert of child rows for a normal small edit.
- The feature would fetch all lessons/content for dashboard use.
- The exercise type shape is unknown.
- The renderer would need broad arbitrary JSON guessing in Study Mode.
- The task would require DB schema changes but no migration is provided.
- The task would break current Study Mode.

## 22. Current Priority

The current priority is not to make a bigger CRUD system.

The current priority is:

- preserve the study flow
- keep static fallback safe
- make editable UI node-based
- make saves field/node-level
- avoid destructive replace-all updates
- prove edit contracts before expanding backend persistence

If Codex or another agent starts adding more DB PATCH routes that submit full parent objects and replace child arrays, stop that work and refactor to field/node-level updates first.
