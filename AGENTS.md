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

Read the nearest nested `AGENTS.md` for each target file, the implementation,
direct consumers and the closest local precedent. An isolated fix that preserves
architecture does not require a general workflow skill.

Load a skill only for its matching task:

- state/query/cache ownership, feature boundaries or server/client architecture:
  `.agents/skills/frontend-feature-workflow/SKILL.md`;
- UI design, implementation or interaction review:
  `.agents/skills/frontend-ui-system/SKILL.md`;
- HanziHome content loading, rendering, editing or import:
  `.agents/skills/hanzihome-content-editing/SKILL.md`;
- requested HanziHome regression/coverage review:
  `.agents/skills/hanzihome-test-review/SKILL.md`;
- Supabase migration, RLS, generated types or drift:
  `.agents/skills/hanzihome-supabase-migration/SKILL.md`;
- explicit `$shadcn` invocation for registry/upstream component work:
  `.agents/skills/shadcn/SKILL.md`;
- requested broad UX audit or UX research:
  `.agents/skills/ui-ux-pro-max/SKILL.md`;
- requested Radix-to-Base investigation or migration:
  `.agents/skills/migrate-radix-to-base/SKILL.md`.

Skills are not prerequisites for each other. When a task spans domains, select
each relevant skill directly; do not load a general skill just because another
skill is in use. Copy-only changes and isolated test additions use the relevant
contract and source without a UI or general workflow skill.

Canonical details are loaded by concern, using only the affected sections:

- architecture/state: `docs/architecture/frontend-structure.md`;
- UI semantics/ownership: `docs/ui/component-contracts.md`;
- component existence/status: `docs/ui/component-inventory.md`;
- theme/palette: `docs/ui/theme-contract.md`;
- rendered UI evidence: `docs/ui/ui-verification.md`;
- navigation, locale or interface copy: `docs/architecture/i18n.md`;
- high-risk work: `docs/agent/risk-confirmation.md`;
- creating, editing or auditing skills/instructions only:
  `docs/agent/skill-authoring.md`.

Do not reread unchanged instructions already loaded in the task.

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

Directory responsibilities and state ownership are defined in
`docs/architecture/frontend-structure.md`. Global invariants:

- Route pages stay thin.
- Feature behavior stays in its feature.
- Shared code must not import feature implementation code.
- Client Components must not import server-only modules.
- External/untrusted data is validated or normalized at its owning boundary.
- Generated files are not edited manually unless the generator contract is understood.
- Do not create a new global architecture layer without proving the current model cannot express the requirement.
- One value has one authoritative state owner; do not introduce a second owner.

## 4. UI component boundary

Feature/layout code uses project components before custom controls.

Primitive-library imports from `radix-ui`, `@radix-ui/*`, or `@base-ui/react*` belong inside `src/components/ui/**` or a documented integration adapter.

Application headings/body/captions use `Typography`. HanziHome learner content uses its feature-owned Hanzi/Pinyin/translation typography. Do not use learner typography as a generic badge, pill or surface wrapper.

Component selection, visual `className` ownership and accessibility behavior
follow `docs/ui/component-contracts.md`. Features must not repair primitive
visuals or create a parallel component system.

## 5. TypeScript and runtime contracts

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

## 6. Working method

### Workflow tiers

Use the smallest verification tier that can falsify the change:

- **Fast path**: one local owner, targeted lint/type/test or direct reproduction.
- **Subsystem path**: feature/shared additive contract, targeted checks plus affected consumers/states.
- **Full path**: dependency/schema/public API/persisted state/shared migration/multi-surface/release work, ending with `npm run check`.

This is the canonical tier definition. Skills and domain docs add the evidence
needed for their domain; they do not require the full gate merely because an
application file changed. Read-only review does not authorize live probes or
mutations.

`npm run check` is deliberately a full CI/release gate. It is not a pre-commit hook and not the first feedback loop for a small edit.

There is no repository pre-commit gate that runs the full suite. Local commits must stay cheap; CI/PR owns full-repository validation. Developers may run targeted commands before commit and `npm run check` before merge/release when appropriate.

Regression work reproduces the failure before or alongside the change and adds the smallest deterministic test that proves the invariant.

For UI claims, source inspection is insufficient: render/interact with the affected viewport/state when the environment supports it.

### Approved implementation checkpoints

For an approved checkpoint-based plan, keep the repository plan current. Mark a
checkpoint `[x]` only after all of its acceptance criteria and required gates
pass on the final source. Record the changed owners, actual commands/results,
remaining limitations and rollback before starting the next checkpoint. Keep
partial, failed or blocked checkpoints unchecked; never substitute a partial
test pass for completion. Respect any stricter publish/CI gate in the plan.

Clean code is a mandatory completion criterion: audit the full diff for scope,
authoritative types, existing ownership and meaningful regression coverage.
Do not leave speculative abstractions, unused symbols, debug code, commented-out
implementations, temporary migration scaffolding or safety-critical TODOs.
Never weaken types, schemas, tests or gates to obtain a pass. Preserve unrelated
user changes and report out-of-scope blockers instead of cleaning them up.

## 7. Risk and confirmation

Read `docs/agent/risk-confirmation.md` for high-risk work.

STOP AND CONFIRM before unapproved:

- DB schema/RLS/auth/production-data mutation;
- dependency installation/removal or major upgrade;
- breaking public API/route/persisted-state changes;
- destructive Git operations, merge or production deployment;
- deleting code whose reachability/data compatibility is uncertain.

Routine reversible choices resolved by repository evidence and local precedent
do not require confirmation. Preserve authorization already given by the user;
do not ask for confirmation merely to avoid investigation.

## 8. Verification and completion language

Use targeted checks during implementation. Use `npm run check` for full-path completion, PR/CI, or release preparation.

Do not report a check as passed unless it actually ran. For visual claims, state the rendered viewport/state. If the environment cannot execute a required check, state that limitation directly.

Keep the handoff proportional to the change: what changed and why, the precedent
and files involved, checks actually run, and remaining limitations. State
whether new files, abstractions, dependencies or contracts were introduced.
Add owner/data flow for architecture work, rendered states for UI claims, and
target/data impact/rollback for database work. Do not require an empty reporting
template for a small fix.
