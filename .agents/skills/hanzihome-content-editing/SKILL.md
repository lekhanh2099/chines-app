---
name: hanzihome-content-editing
description: Implement, debug, review, or design HanziHome lesson content loading, rendering, editing, forms, Supabase persistence, query invalidation, import normalization, vocab, grammar, exercises, reading, radicals, notes, stable child IDs, or field/node-level saves. Use for any non-trivial change under src/features/hanzihome that touches study data or edit behavior.
compatibility: chines-app HanziHome; Supabase; TanStack Query; TanStack Form; Zod
metadata:
  author: chines-app
  version: "2.0"
---

# HanziHome Content Editing

## 1. Required context

Read:

```bash
cat AGENTS.md
cat src/features/hanzihome/AGENTS.md
git status --short
```

Also load `frontend-feature-workflow`.

Read `docs/agent/skill-authoring.md`.

Load `frontend-ui-system` when the task changes UI.

## 2. Classify mode and entity

State:

- Study, Debug/Audit, Edit, API, DB, Import or Query;
- content family;
- rendered node;
- database/write target;
- stable identity;
- parent-child relationship;
- current query keys.

Do not start with a large parent dialog or full-object payload.

### Verification tier

- **Fast:** one node, mapper, or query owner; no shared write contract; a
  deterministic boundary test can reproduce the failure.
- **Subsystem:** a lesson resource, renderer family, query invalidation,
  import/bulk-edit path, or several consumers share the affected contract.
- **Full:** schema, migration, persisted format, authorization, or
  multi-surface study/edit behavior is involved.

Start with the smallest deterministic proof and escalate when sibling,
authorization, data-shape, or persistence evidence crosses the local boundary.

## 3. Trace the contract

```text
Supabase/import payload
→ schema/normalizer
→ repository/query
→ view model
→ renderer
→ editable node
→ form adapter
→ smallest save route
→ smallest invalidation
```

Identify unsupported or guessed shapes before coding.

### Vocabulary source invariant

For vocabulary work, trace and preserve this ownership:

```text
hanzihome_vocab_items
→ hanzihome_vocab_examples / hanzihome_vocab_detail_sections
→ dedicated lesson vocabulary resource and query cache
→ mini-grid / workspace / review / editor
```

Vocabulary lesson sections contain metadata and ordering only. Persist
`payload.items` as `[]`; never hydrate and write those derived mini-grid items
back to the section row.

One active word or phrase is unique within its lesson by
`(lesson_id, word, pinyin)`. The same vocabulary may intentionally recur in a
different lesson. Before adding or importing an item, reuse the existing
lesson-scoped canonical row or report a conflict; do not create a second source
or weaken the unique key.

## 4. Persistence

Normal edit:

```text
one rendered node
→ one validated node payload
→ one smallest owning update
```

MUST NOT:

- replace child arrays for a small edit;
- trust client identity;
- skip ownership/parent verification;
- mutate seed artifacts from the app;
- silently edit shared seed rows;
- use array index as durable identity.

STOP AND CONFIRM when the ownership or seed-edit policy is unclear.

### Import and bulk edit

Validate the complete input at the owning boundary, reconcile record counts and
stable identities, then produce a preview/diff before persistence. Leave
mismatches untouched and report them. Preview is evidence, not write
authorization.

## 5. Exercises

Exercise persistence is high risk.

Before editing support, inventory:

- metadata;
- instruction;
- questions/items;
- choices;
- word bank;
- answer/answer key;
- acceptable answers;
- explanations;
- refs;
- dialogue;
- sample answers;
- cloze segments/answers;
- matching sides and matches.

Do not generalize one exercise shape to all families.

## 6. Verification

Run applicable data scripts plus:

```bash
npm run check
```

Verify:

- one field/node save does not modify siblings;
- mutation conflict behavior;
- smallest correct invalidation;
- representative real lesson data;
- Study Mode remains intact;
- unsupported shapes are reported.

## 7. Handoff

Report:

```text
Mode:
Entity/node:
Precedent used:
Read contract:
Write contract:
Data flow:
Stable ID:
Query invalidation:
Sibling preservation:
Invariant protected:
Tier selected:
Checks:
Unsupported shapes:
Residual data risk:
```
