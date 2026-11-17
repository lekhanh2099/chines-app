---
name: hanzihome-content-editing
description: Trace and change HanziHome content loading, rendering, static content generation, import and the remaining database content (radicals, vocabulary store rows). Use when lesson data or content contracts are affected, not for styling, copy-only changes or unrelated UI state.
metadata:
  author: chines-app
  version: "4.0"
  compatibility: chines-app HanziHome; static JSON content; Supabase; TanStack Query; TanStack Form; Zod
---

# HanziHome Content Editing

[`HanziHome AGENTS.md`](../../../src/features/hanzihome/AGENTS.md) owns the
Study/Debug, content-source, vocabulary, learning-state and persistence
invariants. Read it with the affected implementation; do not load a general
frontend workflow as a prerequisite.

## Trace the content contract

Identify mode (Study, Debug/Audit, API, DB, Import or Query), content family,
rendered node, stable identity, query key and source.

```text
static JSON (textbooks, converted courses, Hanzi Studio seed)
→ schema/adapter (static-json/*, reader-adapters/*)
→ server route or server page
→ view model/renderer
```

Lesson content is not edited in the app: change the JSON or its generator
(`course-conversion/`, `npm run content:build-courses`) and review the diff.
Inspect unsupported shapes before changing a renderer.

For vocabulary, follow the store row (`hanzihome_vocab_items`) through
`data/server/supabase-hanzihome-vocabulary.ts` into the unified vocabulary store
(`vocabulary-index/`). `word_id` is assigned by the database trigger, never by a
caller. For learning-state fields, trace the persisted owner, sync agent and
consumer enqueue path using the subtree learning-state contract.
HanziHome query keys belong in `src/features/hanzihome/query-keys.ts`.

For explained characters, edit the notes in `docs/radicals/` and regenerate
with `npm run content:radical-characters`.

## Editing and import

The remaining in-app edits are radicals and library covers. Trace the
validated payload, editor capability, optimistic-concurrency token and the
smallest invalidation. Apply the subtree
[content/import policy](../../../src/features/hanzihome/AGENTS.md#1-product-and-content-truth)
and [persistence inventory](../../../src/features/hanzihome/AGENTS.md#4-api-and-persistence)
before preparing a write or an import.

## Context and verification

Use root skill routing for additional concerns. UI contracts are in
[`component-contracts.md`](../../../docs/ui/component-contracts.md), rendered
checks in [`ui-verification.md`](../../../docs/ui/ui-verification.md), and
interface copy/navigation in [`i18n.md`](../../../docs/architecture/i18n.md).
Load only the affected sections.

Select the tier from [root verification](../../../AGENTS.md#6-working-method),
renderer/query proof from
[subtree verification](../../../src/features/hanzihome/AGENTS.md#8-verification),
and relevant cases from
[coverage requirements](../../../docs/testing/frontend-flow-coverage.md#required-proof-by-change-type).

The handoff adds the content family, read owner, stable ID and residual data
risk to the root completion requirements.
