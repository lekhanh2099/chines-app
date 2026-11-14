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
For learning-state fields, trace the persisted owner, sync agent and consumer
enqueue path using the subtree learning-state contract, especially when retry
behavior changes.
HanziHome query keys belong in `src/features/hanzihome/query-keys.ts`.

## Editing and import

Trace the validated node payload, ownership/parent checks, update and sibling
isolation. Apply the subtree
[content/import policy](../../../src/features/hanzihome/AGENTS.md#1-product-and-content-truth)
and [persistence inventory](../../../src/features/hanzihome/AGENTS.md#6-api-and-persistence)
to the affected family before preparing a write.

## Context and verification

Use root skill routing for additional concerns. UI contracts are in
[`component-contracts.md`](../../../docs/ui/component-contracts.md), rendered
checks in [`ui-verification.md`](../../../docs/ui/ui-verification.md), and
interface copy/navigation in [`i18n.md`](../../../docs/architecture/i18n.md).
Load only the affected sections.

Select the tier from [root verification](../../../AGENTS.md#6-working-method),
node/query/renderer proof from
[subtree verification](../../../src/features/hanzihome/AGENTS.md#10-verification),
and relevant cases from
[coverage requirements](../../../docs/testing/frontend-flow-coverage.md#required-proof-by-change-type).

The handoff adds the entity/node, read/write owner, stable ID, sibling evidence
and residual data risk to the root completion requirements.
