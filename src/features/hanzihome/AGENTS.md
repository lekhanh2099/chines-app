# HanziHome Subtree Contract

This file applies to `src/features/hanzihome/**` and overrides repository-wide
rules only where it is more specific.

The root policy kernel, local HanziHome contracts and this subtree source
override generic or vendor skill advice. HanziHome skills route the workflow;
they do not redefine these domain invariants.

## 1. Product and content truth

HanziHome is a Chinese self-study workspace.

Current hierarchy:

```text
Course → Book/Volume → Lesson → Module
```

Study Mode, Debug/Audit Mode and Edit Mode MUST remain separate.

- Study Mode is the learner-facing default.
- Debug/Audit Mode is explicit and may expose raw or unmapped data.
- Edit Mode overlays the current study render tree; it MUST NOT replace Study
  Mode.

Supabase normalized tables are the runtime content source.

External static seed artifacts are migration/bootstrap/audit inputs. The app
MUST NOT:

- mutate external seed artifacts;
- create local JSON write APIs;
- silently use static files as a runtime fallback;
- silently convert shared seed rows into user-owned rows.

Vocabulary has one canonical runtime ownership model:

- `hanzihome_vocab_items` owns each vocabulary word or phrase;
- `hanzihome_vocab_examples` and `hanzihome_vocab_detail_sections` are child
  content, not additional vocabulary sources;
- vocabulary lesson sections preserve ordering and metadata only; their
  persisted `payload.items` MUST remain empty;
- mini-grid, lesson view models, vocab workspace, review and editing MUST share
  the normalized vocabulary resource/query cache;
- one active word or phrase is unique within a lesson by
  `(lesson_id, word, pinyin)`;
- the same word or phrase MAY appear in a different lesson.

Import, seed, migration or editing work MUST NOT recreate vocabulary items in a
lesson-section payload, maintain two independently editable vocab copies, or
weaken the active lesson/word/pinyin uniqueness invariant.

Import or bulk-edit work MUST validate the complete input, reconcile counts and
stable identities, and produce a preview/diff before persistence. A mismatch
MUST remain untouched and be reported; preview is not authorization to write.

Editing seed content requires an explicit policy:

- admin seed edit; or
- copy-on-write user override.

If that policy is unclear, STOP AND CONFIRM.

## 2. Data-loading contract

Before implementing a HanziHome screen, state:

- data required above the fold;
- data loaded only after interaction;
- data that MUST NOT load on the screen;
- owning query/repository/route;
- query key;
- fallback behavior;
- expected payload scope.

Rules:

- Library/dashboard surfaces load summaries, not full lesson details.
- A lesson workspace loads only selected lesson detail.
- Aggregate vocab/grammar pages own cross-lesson aggregates.
- Do not fetch all records merely to calculate counts.
- Query keys MUST include every variable that changes returned data.
- Invalidate the smallest correct scope after mutation.

## 3. Render and edit contract

The edit system follows the rendered node tree.

Examples of meaningful editable nodes include:

- lesson and section;
- text block, scene, line or paragraph;
- vocab item, example and detail section;
- grammar point, block, formula, example and block item;
- exercise metadata, question, choice, answer key, word bank, matching item,
  dialogue line, cloze segment and cloze answer;
- reading item, paragraph, question and answer;
- character-writing item;
- note and proper noun.

Required flow:

```text
rendered node
→ edit action visible only in Edit Mode
→ form for the smallest owning node
→ Zod validation
→ smallest field/node persistence
→ smallest correct query invalidation
```

Normal edits MUST NOT:

- submit an entire parent object for one field;
- delete and reinsert child arrays;
- mutate renderer props;
- key durable editable children only by array index;
- expose raw JSON as the main editor.

Bulk replace is allowed only as an explicit bulk action with clear UI copy and
a separate route/action contract.

## 4. Stable identity

Every durable editable child needs a stable database identity before direct
persistence.

Index-based identity is only a temporary static-render fallback.

When a node has no stable write target:

- do not invent one in the client;
- use a draft patch only if the task explicitly supports it;
- otherwise report the missing contract.

## 5. Forms

Non-trivial edit forms use the repository TanStack Form adapter and Zod.

Each form needs:

- adapter-derived initial values;
- appropriate field and submit validation;
- visible error rendering;
- submit disabled/loading state;
- cancel/reset behavior;
- dirty-state handling when loss is possible.

The form library owns form state. Do not mirror it into `useState`.

## 6. API and persistence

Server routes MUST:

- derive user identity from the server session;
- verify ownership/editability;
- verify parent-child relationships;
- treat client IDs as expected constraints, not proof;
- avoid destructive multi-step updates without a transaction.

Normal field/node edits SHOULD map to a single-row update whenever practical.

Exercise and practice persistence is high risk. Before supporting a new exercise
family, identify every rendered and persisted subpart.

## 7. Study renderer

Study Mode SHOULD render typed view models.

Flexible or unknown-shape handling belongs in:

- import adapters;
- normalizers;
- audit/debug renderers.

Study Mode MUST NOT silently hide available fields.

If data cannot be rendered safely:

- show a clear fallback;
- report the unmapped shape;
- do not guess arbitrary keys throughout UI components.

## 8. HanziHome UI

Preserve:

- pinyin visibility controls;
- Vietnamese meaning visibility controls;
- answer reveal defaults;
- `lang="zh-CN"` for Chinese text where appropriate;
- iPad portrait usability;
- current study-flow scroll ownership;
- gradient/glass brand roles defined by the shared UI system.

Do not expose answer content by default in practice UI.

Do not expose developer JSON in Study Mode.

## 9. Stop conditions

STOP AND CONFIRM before code mutation when:

- seed edit policy is unclear;
- DB schema/RLS changes are required;
- a small edit appears to require replace-all child operations;
- a dashboard would need full content loading;
- an exercise shape is unknown;
- a Study renderer would need broad arbitrary JSON guessing;
- the change would break the current Study Mode;
- the task expands from one content family to another without a reviewed
  contract.

## 10. Verification

In addition to repository checks:

- renderer changes: inspect representative real payloads;
- edit changes: verify one field/node save does not modify siblings;
- query changes: verify first load, stale/refetch, empty and error states;
- exercise changes: verify every supported subpart;
- UI changes: verify iPad portrait and keyboard interaction.
