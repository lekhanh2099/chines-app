<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read version-matched docs before coding

Before any Next.js work, find and read the relevant documentation in
`node_modules/next/dist/docs/`. Installed documentation is the source of truth
for the Next.js version in this repository.

<!-- END:nextjs-agent-rules -->

# chines-app — Repository Agent Contract

This file defines repository-wide rules for AI agents and contributors.

Normative words are intentional:

- **MUST / MUST NOT**: hard requirement.
- **SHOULD / SHOULD NOT**: default; deviations need evidence.
- **MAY**: optional.
- **STOP AND CONFIRM**: do not mutate until the user decides.

More specific `AGENTS.md` files apply to their directory subtree and override
this file where they are more specific.

## 1. Load the correct instructions

Before a non-trivial task:

1. Read this file.
2. Read the nearest nested `AGENTS.md` for every file you may touch.
3. Read the matching repo skill:
   - General React/Next.js implementation, debugging, refactoring, state,
     forms, queries, routes, API, or cleanup:
     `.agents/skills/frontend-feature-workflow/SKILL.md`
   - UI, UX, component reuse, Dialog, Button, Select, Popover, Menu, Sheet,
     Tabs, Card, Input, command/search, responsive layout, accessibility, or
     visual consistency:
     `.agents/skills/frontend-ui-system/SKILL.md`
   - HanziHome content editing, Supabase-backed lesson data, vocab, grammar,
     exercises, reading, renderers, or edit persistence:
     `.agents/skills/hanzihome-content-editing/SKILL.md`
   - shadcn component APIs, registry operations, `components.json`, component
     installation, or upstream component docs:
     `.agents/skills/shadcn/SKILL.md`
4. For UI work, read:
   - `docs/ui/component-contracts.md`
   - `docs/ui/ui-verification.md`
5. For architecture or state ownership, read:
   - `docs/architecture/frontend-structure.md`
6. For risky work, read:
   - `docs/agent/risk-confirmation.md`
7. For task wording and completion language, read:
   - `docs/agent/instruction-language.md`

Do not load every detailed document for every task. Load only the instructions
that match the files and behavior being changed.

## 2. Verified project truth

- Package manager: npm.
- Runtime: Node.js 22 or newer.
- Framework: Next.js App Router.
- UI: React, TypeScript, Tailwind CSS 4, local shadcn-style source components.
- Data/state: Supabase, TanStack Query, TanStack Form, Zustand, Zod.
- UI primitive dependencies include both Radix and Base UI.
- `src/components/ui/**` is the design-system primitive boundary.
- Local component source is the source of truth, not generic shadcn examples.
- `npm run check` is the repository quality gate.

Before assuming an API, inspect `package.json`, `components.json`, the local
component implementation, and version-matched framework documentation.

## 3. Repository boundaries

Use the current ownership model:

```text
src/app/                 routing, layouts, route handlers, thin composition
src/components/ui/       low-level reusable UI primitives
src/components/patterns/ reusable cross-feature interaction patterns
src/components/form/     TanStack Form adapters using the shared UI system
src/components/layout/   application shell and cross-route layout
src/features/<feature>/  feature UI, domain behavior, feature hooks and schemas
src/lib/                 infrastructure and framework-agnostic helpers
src/services/            server/data service orchestration
src/stores/              truly cross-feature client state
scripts/                 audits, import, migration and build tooling
```

Rules:

- Route pages MUST remain thin.
- Feature business behavior MUST remain in its feature.
- Shared code MUST NOT import feature implementation code.
- Feature code MUST NOT import another feature's internal implementation.
- Client Components MUST NOT import server-only modules.
- External data MUST be validated or normalized at a boundary.
- Generated files MUST NOT be edited manually unless the generator contract is
  understood and the source generator is updated.
- Do not create a new global folder or architecture layer without proving the
  current ownership model cannot express the requirement.

## 4. State ownership

A value MUST have one source of truth.

- URL/shareable navigation state: route/search params.
- Server state: TanStack Query.
- Form values, validation, dirty state and submission: TanStack Form.
- Small transient interaction state: local React state.
- Cross-feature client preferences: an existing scoped Zustand store.
- Purely derived values: compute from current inputs; do not mirror them into
  state.
- Persisted browser state: versioned schema, safe parsing and migration.

MUST NOT:

- copy query data into local state without an explicit editable-draft contract;
- mirror form values into `useState`;
- repair stale state with `setTimeout`, random keys, or force-render logic;
- use `useEffect` for pure derivation;
- hide loading, error and empty states behind the same fallback value.

## 5. UI component boundary

Feature and layout code MUST use project components before custom markup.

Primitive-library imports from `radix-ui`, `@radix-ui/*`, or
`@base-ui/react*` are allowed only inside:

- `src/components/ui/**`;
- explicitly documented third-party integration adapters.

Feature code MUST NOT create a new visual control by styling raw
`button`, `input`, `select`, dialog, popover, or menu markup unless:

1. no current primitive/composite can represent the required semantics;
2. the interaction is intentionally native or library-specific;
3. the reason is documented in the change;
4. repeated use is promoted to a shared primitive or pattern.

Before adding or changing UI, classify the need:

```text
need
→ existing primitive?
→ existing pattern/composite?
→ missing reusable contract?
→ use | extend | create | justified local exception
```

Do not overwrite an installed shadcn component automatically. Inspect local
code and consumers, then use CLI dry-run/diff before any merge.

## 6. `className` ownership

Shared primitives own their internal visual contract.

Allowed at call sites:

- parent-imposed width or max-width;
- grid/flex placement;
- responsive visibility;
- external margin only when the parent owns spacing;
- parent-owned scroll constraints;
- `sr-only` and similar accessibility utilities.

Forbidden at call sites:

- component color/tone;
- border appearance;
- radius;
- internal padding or density;
- typography;
- shadow;
- hover/focus/active styling;
- overlay z-index;
- icon sizing that the primitive owns.

If an allowed layout adjustment repeats in at least two meaningful consumers,
promote it to a typed variant or reusable pattern.

Do not add a variant for a one-off value merely to satisfy this rule. First
decide whether the variation is a stable design-system contract.

## 7. React and TypeScript rules

- Keep components focused on one interaction or rendering responsibility.
- Prefer explicit domain names over `Wrapper`, `Container`, `Item`, or `Common`.
- Do not introduce abstraction without real consumers and a stable semantic
  boundary.
- Avoid `any`; parse `unknown` at boundaries.
- Normalize IDs once at the boundary.
- Keep transport types, domain/view models and rendered props distinct when
  they have different semantics.
- Do not memoize by default. `useMemo` and `useCallback` require a concrete
  correctness or performance reason.
- Every effect MUST be explainable as synchronization with an external system,
  subscription, browser API, imperative integration, or analytics.
- Errors MUST remain observable. Do not convert errors into fake empty states.

## 8. UI and accessibility minimum

Interactive work MUST preserve:

- keyboard access;
- visible focus;
- correct button/link semantics;
- explicit toggle state (`aria-pressed`, Switch, Checkbox, or equivalent);
- Dialog title and managed focus;
- Menu trigger/menu item semantics;
- loading, empty, error, disabled and stale states;
- touch-sized targets where the app is used on iPad/mobile;
- no accidental horizontal overflow;
- Chinese text language metadata where appropriate.

A styled Popover with `role="menu"` is not a complete menu contract unless its
items and keyboard behavior follow the same interaction model.

## 9. Working method

Before editing:

1. Inspect `git status --short`.
2. Identify the entry point and direct consumers.
3. Trace data and state ownership.
4. Identify existing primitive/pattern contracts.
5. State the root cause or implementation gap.
6. Classify risk.
7. Propose the smallest coherent change.
8. STOP AND CONFIRM only when required by the risk policy.

While editing:

- Keep the diff focused.
- Preserve unrelated user changes.
- Do not mix UI redesign, data migration and persistence changes unless the
  request explicitly requires all three.
- Do not perform broad search-and-replace for component migrations.
- Migrate one surface or interaction contract at a time.

Before completion:

1. Inspect the final diff.
2. Run targeted checks.
3. Run `npm run check` for app-code changes.
4. For UI work, render and interact with the affected surface.
5. Report exact checks and unresolved risks.

## 10. Risk and confirmation

Use `docs/agent/risk-confirmation.md`.

Always STOP AND CONFIRM before:

- database schema, RLS, auth or production-data mutation;
- dependency installation/removal or major upgrade;
- overwriting local shadcn primitives;
- Radix-to-Base migration;
- breaking shared component API;
- repository-wide component migration;
- route/public API/persisted-state contract change;
- global token or brand-system redesign;
- destructive Git operations, commit, push, merge or PR creation;
- deleting code whose reachability or data compatibility is uncertain.

Do not ask for confirmation merely to avoid reading the source. Investigate
first and present a recommendation.

## 11. Verification

Use scripts from `package.json`.

App-code completion normally requires:

```bash
npm run check
```

Also run targeted checks where relevant.

A task MUST NOT be reported as complete when:

- required checks were not run;
- a check failed;
- the UI was not rendered for a visual/interaction claim;
- unsupported states remain;
- the implementation depends on an unresolved product or data decision.

## 12. Completion report

End non-trivial work with:

```text
Scope:
Root cause / contract gap:
Files changed:
Behavior preserved:
Checks run:
UI states verified:
Risk level:
Residual risks / unsupported states:
Confirmation still required:
```

Use “implemented” or “changed” for code edits. Use “verified” only when there is
evidence. Do not use “fixed”, “done”, “final”, or “production-ready” without
completed verification.
