---
name: frontend-feature-workflow
description: Implement, debug, refactor, review, or clean up React and Next.js code in the chines-app repository. Use for feature, page, route, component, hook, state ownership, TanStack Query, TanStack Form, Zod, API, TypeScript, architecture, performance, source cleanup, or any non-trivial change under src/.
compatibility: chines-app; npm; Node.js 22+; Next.js App Router; React; TypeScript
metadata:
  author: chines-app
  version: "2.0"
---

# Frontend Feature Workflow

## 1. Preflight

From the repository root:

```bash
cat AGENTS.md
git status --short
```

Read the nearest nested `AGENTS.md` for every target file.

Read:

```bash
cat docs/architecture/frontend-structure.md
cat docs/agent/skill-authoring.md
```

When UI is involved, also load `frontend-ui-system`.

For Next.js behavior, inspect the relevant installed documentation under:

```text
node_modules/next/dist/docs/
```

Do not rely on remembered APIs when version-matched docs are available.

## 2. Classify the task

Choose the primary category:

- route/server composition;
- data loading/query/cache;
- local or global state;
- form and validation;
- UI interaction;
- API/service;
- Supabase persistence;
- renderer/data normalization;
- refactor/dead-code cleanup.

Do not mix categories merely because adjacent code is imperfect.

Choose a verification tier:

- Fast: one local owner, no shared/public contract change, targeted regression
  proof is sufficient.
- Subsystem: a feature boundary, query, form, store, API/Zod boundary,
  renderer family, shared additive component, or several local consumers.
- Full: dependency, schema, route/public API, persisted state, shared migration,
  multi-surface behavior, or release preparation.

Start targeted and escalate only when evidence shows a wider contract.

## 3. Trace before editing

Trace the real path:

```text
route/entry
→ feature component
→ hooks/store/form
→ query/service/API
→ schema/normalizer
→ rendered component
→ tests/checks
```

Identify:

- source of truth;
- external boundaries;
- direct consumers;
- loading/empty/error states;
- current component contract;
- root cause or missing contract.

Do not patch only the visible symptom.

For regression work, reproduce the reported failure before or alongside the
change. Test the lowest boundary that still fails for the real regression; do
not substitute an easier test that cannot prove it.

## 4. State ownership

Use the repository matrix:

- route state: URL/search params;
- server state: TanStack Query;
- form state: TanStack Form;
- transient interaction: local state;
- cross-feature client preference: existing scoped store;
- derived data: pure calculation.

Reject:

- mirrored form/query state;
- effect-driven pure derivation;
- force render;
- random keys as state repair;
- `setTimeout` as render repair;
- broad cache invalidation hiding unclear ownership.

## 5. Plan

Before mutation, report:

```text
Verified behavior:
Root cause / contract gap:
Files and consumers:
State owner:
Smallest coherent change:
Behavior preserved:
Risk:
Confirmation required:
Verification:
```

A smallest coherent change may span several files when a boundary contract is
the root cause. It is not necessarily the fewest changed lines.

## 6. Implementation

- Keep route pages thin.
- Keep feature behavior in the feature.
- Validate/normalize external data at boundaries.
- Normalize IDs once.
- Keep errors observable.
- Add abstractions only for stable repeated semantics.
- Preserve unrelated changes.
- Do not broaden scope into UI redesign or data migration without explicit
  requirement.

When touching a shared component, search all consumers before changing its API.

## 7. Risk

Read `docs/agent/risk-confirmation.md`.

STOP AND CONFIRM for high-risk work.

Do not use confirmation to avoid investigation.

## 8. Verification

Use the selected tier. Fast and subsystem feedback starts with applicable
targeted commands:

```bash
npm run typecheck
npm run lint
npm run test:run
```

Run `npm run check` once for the full path, app-code completion or release
preparation.

For UI, load and follow `frontend-ui-system`.

## 9. Handoff

Report:

```text
Scope:
Root cause / contract gap:
Precedent used:
Authoritative contract:
Data / state flow:
Invariant protected:
Files changed:
Behavior preserved:
Checks run:
Rejected broader abstraction:
Risk:
Residual risks:
Confirmation still required:
```

Do not claim completion without evidence.
