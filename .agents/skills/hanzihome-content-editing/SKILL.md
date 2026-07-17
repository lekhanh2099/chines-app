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
Read contract:
Write contract:
Stable ID:
Query invalidation:
Sibling preservation:
Checks:
Unsupported shapes:
Residual data risk:
```
