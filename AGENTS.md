<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# chines-app — Repository Agent Contract

This file defines repository-wide engineering rules for AI agents and contributors.
More specific `AGENTS.md` files override this file for their subtree.

Authority order is:

1. explicit user requirements;
2. nearest applicable `AGENTS.md`, then this root contract;
3. generated types, installed documentation, local contracts and source;
4. repository skills and domain documentation;
5. vendor or generic guidance.

Local repository truth always overrides remembered framework/library behavior.

## 1. Load only relevant instructions

Before a non-trivial task:

1. Read this file.
2. Read the nearest nested `AGENTS.md` for every target file.
3. Read the matching skill:
   - general React/Next/state/forms/queries/refactor: `.agents/skills/frontend-feature-workflow/SKILL.md`;
   - UI/UX/design-system/responsive/accessibility: `.agents/skills/frontend-ui-system/SKILL.md`;
   - broad UI/UX audit/research heuristics: read `.agents/skills/frontend-ui-system/SKILL.md` first, then `.agents/skills/ui-ux-pro-max/SKILL.md`; local UI contracts remain authoritative;
   - HanziHome content/data/editing: `.agents/skills/hanzihome-content-editing/SKILL.md`;
   - regression/test review: `.agents/skills/hanzihome-test-review/SKILL.md`;
   - Supabase migrations/RLS/generated types: `.agents/skills/hanzihome-supabase-migration/SKILL.md`;
   - shadcn component work: `.agents/skills/shadcn/SKILL.md`;
   - Radix/Base investigation: `.agents/skills/migrate-radix-to-base/SKILL.md`.
4. For UI work also read `docs/ui/component-contracts.md` and `docs/ui/ui-verification.md`.
5. For architecture/state ownership read `docs/architecture/frontend-structure.md`.
6. For high-risk work read `docs/agent/risk-confirmation.md`.

Do not load every repository document for every task.

## 2. Verified project truth

- Package manager: npm.
- Runtime: Node.js 22+.
- Framework: Next.js App Router.
- UI: React, TypeScript, Tailwind CSS 4, local shadcn-style components.
- Data/state: Supabase, TanStack Query, TanStack Form, TanStack Store, Zod.
- `src/components/ui/**` is the design-system primitive boundary.
- Local component source is authoritative.
- `npm run check` is the full repository quality gate used by CI/release work.

For Next.js behavior, inspect the installed version-matched docs under `node_modules/next/dist/docs/` before relying on memory.

## 3. Repository boundaries

```text
src/app/                 routes, layouts, route handlers, thin composition
src/components/ui/       low-level reusable UI primitives
src/components/patterns/ reusable cross-feature interaction patterns
src/components/form/     TanStack Form adapters
src/components/layout/   app shell and cross-route layout
src/features/<feature>/  feature UI, behavior, hooks and schemas
src/lib/                 infrastructure/framework-agnostic helpers
src/services/            data/service orchestration
src/stores/              truly cross-feature client state
scripts/                 CI/release/audit/import tooling
```

Rules:

- Route pages stay thin.
- Feature behavior stays in its feature.
- Shared code must not import feature implementation code.
- Client Components must not import server-only modules.
- External/untrusted data is validated or normalized at its owning boundary.
- Generated files are not edited manually unless the generator contract is understood.
- Do not create a new global architecture layer without proving the current model cannot express the requirement.

## 4. State ownership

One value has one authoritative owner:

```text
URL/shareable navigation -> route/search params
server/remote state       -> TanStack Query
form state                -> TanStack Form
cross-feature client UI   -> scoped TanStack Store
local transient UI        -> local React state
pure derivation           -> compute from current inputs
persisted browser state   -> versioned schema + safe parsing/migration
```

Do not:

- mirror Query/Form/Store/route values into local state;
- use `useEffect` for pure derivation;
- synchronize two state owners bidirectionally;
- repair rendering with timeout/random keys/force-render;
- hide error/loading/empty behind one fallback value.

Every state-writing effect must represent a real external-system/subscription/imperative bridge and be idempotent.

## 5. UI component boundary

Feature/layout code uses project components before custom controls.

Primitive-library imports from `radix-ui`, `@radix-ui/*`, or `@base-ui/react*` belong inside `src/components/ui/**` or a documented integration adapter.

Before adding UI:

```text
need
-> existing primitive?
-> existing pattern/composite?
-> missing stable reusable contract?
-> use | extend | create | justified local exception
```

Application headings/body/captions use `Typography`. HanziHome learner content uses its feature-owned Hanzi/Pinyin/translation typography. Do not use learner typography as a generic badge, pill or surface wrapper.

### `className` ownership

Shared primitives own:

- visual tokens;
- border/radius/background/shadow;
- internal spacing/density;
- typography;
- focus/hover/active/disabled behavior;
- overlay stack;
- internal icon sizing.

Feature call sites may own parent layout, width constraints, placement, responsive visibility, external spacing and scroll constraints.

If a visual variation repeats, extend the semantic owner with a typed API instead of repairing it at call sites.

## 6. TypeScript and runtime contracts

TypeScript is the primary static contract. Zod is the runtime-boundary contract, not a replacement for ordinary TypeScript modeling.

### Authoritative types

Before defining or changing a boundary type, inspect in this order:

1. generated DB/API contract;
2. existing Zod schema;
3. existing service/query/store/form/domain contract;
4. installed library-exported type;
5. verified runtime boundary.

Use indexed access, `ComponentProps`, `Parameters`, `ReturnType`, generated Supabase helpers, and library-owned types instead of redeclaring an existing contract.

### Zod usage

Use Zod for values that cross an actual runtime trust boundary, including:

- external JSON/API responses;
- request payloads;
- localStorage/persisted browser data;
- environment/provider/file input;
- database content when generated/static typing is insufficient at runtime.

Do not create a Zod schema merely to avoid writing an ordinary internal TypeScript union, DOM type, callback type or component prop type.

### Unions and `unknown`

Handwritten unions/discriminated unions are valid for internal compile-time modeling when the contract is local and no runtime parsing is required. Prefer reusing an owner type when one already exists.

`unknown` is valid at a genuine untrusted/library/error boundary because it forces narrowing. It must be narrowed before entering domain state or rendered props. Do not replace `unknown` with `any` or a cast merely to silence TypeScript.

### Hard prohibitions

Owned application source must not introduce:

- explicit `any`;
- `z.any()` or `z.unknown()` as an unconstrained escape hatch;
- type assertions used to force an incompatible value through the compiler;
- chained/double assertions;
- non-null assertions used as data repair;
- TypeScript suppressions or TypeScript-related ESLint disables;
- fake guards/normalizers/coercion added only to hide an internal mismatch;
- fallback/optional fields invented only to silence TypeScript.

When types conflict, fix the authoritative owner/query/schema/service/store/caller. Do not widen a correct shared contract to accommodate an incorrect consumer.

`scripts/check-source-standards.mjs` intentionally checks only machine-detectable high-value rules: unsafe explicit `any`, unconstrained Zod escape hatches, assertions, non-null assertions, TypeScript suppressions, client/server import boundaries, deprecated Zod APIs, and unreachable owned modules. It does not ban normal TypeScript unions or properly narrowed `unknown`.

## 7. UI/accessibility minimum

Interactive work preserves:

- correct button/link semantics;
- keyboard operation and visible focus;
- explicit selected/toggle state;
- Dialog/Menu/Select semantics;
- loading/empty/error/disabled states;
- touch targets appropriate for iPad/mobile;
- no accidental horizontal overflow;
- Chinese language/font metadata where required.

Do not add ARIA to compensate for the wrong interaction model.

## 8. Working method

### Workflow tiers

Use the smallest verification tier that can falsify the change:

- **Fast path**: one local owner, targeted lint/type/test or direct reproduction.
- **Subsystem path**: feature/shared additive contract, targeted checks plus affected consumers/states.
- **Full path**: dependency/schema/public API/persisted state/shared migration/multi-surface/release work, ending with `npm run check`.

`npm run check` is deliberately a full CI/release gate. It is not a pre-commit hook and not the first feedback loop for a small edit.

There is no repository pre-commit gate that runs the full suite. Local commits must stay cheap; CI/PR owns full-repository validation. Developers may run targeted commands before commit and `npm run check` before merge/release when appropriate.

Regression work reproduces the failure before or alongside the change and adds the smallest deterministic test that proves the invariant.

For UI claims, source inspection is insufficient: render/interact with the affected viewport/state when the environment supports it.

## 9. Risk and confirmation

Read `docs/agent/risk-confirmation.md` for high-risk work.

STOP AND CONFIRM before unapproved:

- DB schema/RLS/auth/production-data mutation;
- dependency installation/removal or major upgrade;
- breaking public API/route/persisted-state changes;
- destructive Git operations, merge or production deployment;
- deleting code whose reachability/data compatibility is uncertain.

Do not ask for confirmation merely to avoid investigation.

## 10. Verification and completion language

Use targeted checks during implementation. Use `npm run check` for full-path completion, PR/CI, or release preparation.

Do not report a check as passed unless it actually ran. For visual claims, state the rendered viewport/state. If the environment cannot execute a required check, state that limitation directly.

Non-trivial handoff should identify:

```text
Scope:
Root cause / contract gap:
Authoritative owner:
State/data flow:
Files changed:
Behavior preserved / intentionally changed:
Checks actually run:
UI states actually rendered:
Residual risk / unverified states:
```
