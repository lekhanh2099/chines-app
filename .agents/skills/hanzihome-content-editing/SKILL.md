---
name: hanzihome-content-editing
description: Trace and change HanziHome content loading, rendering, node-level editing, import and persistence. Use when lesson data or edit contracts are affected, not for styling, copy-only changes or unrelated UI state.
metadata:
  author: chines-app
  version: "3.0"
  compatibility: chines-app HanziHome; Supabase; TanStack Query; TanStack Form; Zod
---

# HanziHome Content Editing

[`HanziHome AGENTS.md`](../../../src/features/hanzihome/AGENTS.md) owns the
Study/Edit/Debug, vocabulary, learning-state, identity and persistence
invariants. Read it with the affected implementation; do not load a general
frontend workflow as a prerequisite.

## Trace the content contract

Identify mode (Study, Debug/Audit, Edit, API, DB, Import or Query), content family,
rendered node, stable identity, parent relationship, query key and write target.

```text
Supabase/import payload
→ schema/normalizer
→ repository/query
→ view model/renderer
→ editable node/form
→ smallest owning save
→ smallest correct invalidation
```

Start from the smallest editable node, not a large parent dialog or full-object
payload. Inspect unsupported shapes before editing.

For vocabulary, follow the canonical row and lesson resource/query cache from
the subtree contract through mini-grid, workspace, review and editor consumers.
For learning-state fields, inspect every existing owner before adding state,
progress, mastery, review or settings. Persisted writes require an expected
remote version and deterministic conflict-rebase proof. Trace the single
app-level sync agent and consumer enqueue path when retry behavior changes.
HanziHome query keys belong in `src/features/hanzihome/query-keys.ts`.

## Editing and import

Trace the validated node payload, ownership/parent checks, update and sibling
isolation. If seed-edit policy or the write target is unclear, use the subtree
stop conditions. Import/bulk edit requires complete validation, count/identity
reconciliation and a preview/diff before persistence; preview is evidence,
not write authorization.

Exercise persistence needs a family-specific inventory before editing support:
metadata, instruction, questions/items, choices, word bank, answer/key,
acceptable answers, explanations, refs, dialogue, sample answers, cloze
segments/answers and matching sides/matches. Do not generalize one exercise
shape to all families.

## Context and verification

Use root skill routing for additional concerns. UI contracts are in
[`component-contracts.md`](../../../docs/ui/component-contracts.md), rendered
checks in [`ui-verification.md`](../../../docs/ui/ui-verification.md), and
interface copy/navigation in [`i18n.md`](../../../docs/architecture/i18n.md).
Load only the affected sections.

Use root verification tiers and applicable existing data scripts. Verify the
changed node against representative real lesson data, unchanged siblings,
conflict handling, invalidation and intact Study Mode. For learning-state
changes, prove unrelated remote changes survive conflict rebase and consumers
do not install duplicate retry listeners. Report unsupported shapes and any
unverified persistence boundary. Schema, persisted-format, authorization and
multi-surface changes require the full gate; a local node fix uses targeted
proof unless its affected contract is broader.

The handoff adds the entity/node, read/write owner, stable ID, sibling evidence
and residual data risk to the root completion requirements.
