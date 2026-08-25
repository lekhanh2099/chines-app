---
name: frontend-feature-workflow
description: Implement, debug, refactor, review, or clean up React and Next.js code in the chines-app repository. Use for feature, page, route, component, hook, state ownership, TanStack Query, TanStack Form, TanStack Store, Zod, API, TypeScript, architecture, performance, source cleanup, or any non-trivial change under src/.
metadata:
  author: chines-app
  compatibility: chines-app; npm; Node.js 22+; Next.js App Router; React; TypeScript; TanStack Query/Form/Store
  version: "2.3"
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

When navigation, routing, user-facing UI copy, locale selection or i18n is
involved, also read:

```bash
cat docs/architecture/i18n.md
```

When UI, UX, information architecture or interaction flow is involved, also
load `frontend-ui-system`.

For Next.js behavior, inspect the relevant installed documentation under:

```text
node_modules/next/dist/docs/
```

Do not rely on remembered APIs when version-matched docs are available.

## 2. Classify the task

Choose the primary category:

- route/server composition;
- data loading/query/cache;
- local or cross-feature state;
- form and validation;
- UI/UX interaction flow;
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
  information-architecture change, multi-surface behavior, or release
  preparation.

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
- current component/flow contract;
- root cause or missing contract.

Do not patch only the visible symptom.

For regression work, reproduce the reported failure before or alongside the
change. Test the lowest boundary that still fails for the real regression; do
not substitute an easier test that cannot prove it.

## 4. State ownership — TanStack first where it owns the problem

Use this matrix:

```text
URL/shareable navigation state  -> route/search params
server/cache/async remote state -> TanStack Query
form values/dirty/validation    -> TanStack Form
cross-feature client UI/prefs   -> scoped TanStack Store
local transient interaction     -> local React state
purely derived values           -> compute from authoritative inputs
```

One value has one authoritative owner.

Reject:

- mirrored form/query/store/route state;
- copying query data into `useState` without an explicit editable-draft contract;
- effect-driven pure derivation;
- two effects synchronizing the same value in opposite directions;
- force render;
- random keys as state repair;
- `setTimeout` as render repair;
- broad cache invalidation hiding unclear ownership.

Every state-writing effect must synchronize with an external system or bridge a
verified ownership boundary, and it must be idempotent: running again with the
same authoritative inputs cannot keep producing a state change. This is a hard
review point for preventing update-depth loops.

## 5. UI/UX flow changes

When the user explicitly authorizes UX/system refactoring, preserving the old
screen flow is not an invariant. The implementation MAY move, merge or remove
steps when evidence shows duplicated navigation, hidden active state,
unnecessary interaction cost or poor task orientation.

Before changing flow, document:

```text
User goal:
Current friction:
New flow:
State owner at every transition:
Business/data invariants preserved:
Back/deep-link behavior:
Loading/error/empty behavior:
Keyboard/touch behavior:
```

Changing flow does not authorize changing database semantics, persisted data,
API contracts or authorization rules unless those changes are separately in
scope.

## 6. Plan

Before mutation, report:

```text
Verified behavior:
Root cause / contract gap:
Files and consumers:
State owner:
Smallest coherent change:
Behavior preserved:
Intentional UX behavior changed:
Risk:
Confirmation required:
Verification:
```

A smallest coherent change may span several files when a boundary contract is
the root cause. It is not necessarily the fewest changed lines.

## 7. Implementation

- Keep route pages thin.
- Keep feature behavior in the feature.
- Validate/normalize external data at boundaries.
- Normalize IDs once.
- Keep errors observable.
- Add abstractions only for stable repeated semantics.
- Preserve unrelated changes.
- Prefer the existing TanStack owner instead of adding a parallel React state
  layer.
- Application navigation uses locale-free logical hrefs through
  `@/i18n/navigation`; do not hand-build locale prefixes in feature code.
- Every new or changed user-facing interface string uses a semantic message key
  owned by `Common`, `Shell` or the relevant feature namespace. This includes
  visible labels, descriptions, placeholders, empty/error/status text,
  tooltips, titles and accessible names such as `aria-label`. Do not leave raw
  interface copy in JSX or component props.
- Search the owning namespace before adding a key. Reuse a key only when the
  product meaning and interaction role are identical; do not key messages by
  source-language sentences. Add or change the key in `vi`, `en` and `zh-CN`
  atomically.
- Course/lesson content remains owned by HanziHome data/view models and MUST NOT
  be copied into UI locale catalogs merely for translation plumbing.
- When a feature surface becomes complex because transport/domain/UI logic are
  co-located in a route page, move the behavior into its feature before adding
  more local styling or state.
- Do not broaden into database/API migration without explicit requirement.

When touching a shared component, inspect its consumers and authoritative local
contract before changing its API.

## 8. Risk

Read `docs/agent/risk-confirmation.md`.

STOP AND CONFIRM for high-risk work that has not already been explicitly
authorized by the user. Do not use confirmation to avoid investigation.

## 9. Verification

Use the selected tier. Fast and subsystem feedback starts with applicable
targeted commands:

```bash
npm run typecheck
npm run lint
npm run test:run
```

When interface messages change, the targeted verification MUST include:

```bash
npm run test:run -- src/i18n/messages.test.ts
```

Message-file parity, typecheck and a successful build are necessary but are not
proof that the requested copy is visible. Render the affected consumer with the
real `loadAppMessages(locale)` path for `vi`, `en` and `zh-CN`, then assert the
expected visible label, placeholder, status text or accessible name. The
rendered output MUST NOT contain an unresolved namespace or message key. If a
running dev server still serves old messages after a locale JSON change, restart
it and repeat the rendered check before claiming completion.

Before handoff, inspect the changed lines for new raw interface strings. Font
samples, technical identifiers, test fixtures and course/lesson content data
are not interface copy; a user-facing label is not exempt merely because it is
short or appears only in `aria-label`.

Run `npm run check` once for the full path, app-code completion or release
preparation.

For UI/UX, load and follow `frontend-ui-system`, including actual viewport and
keyboard verification when the environment supports rendering.

If the environment cannot run the gate, state the exact missing capability and
do not claim completion from source inspection alone.

## 10. Handoff

Report:

```text
Scope:
Root cause / contract gap:
Intentional flow changes:
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
