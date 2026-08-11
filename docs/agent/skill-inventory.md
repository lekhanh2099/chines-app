# Repository skill inventory and audit scorecard

Updated: 2026-08-11

This is the current-checkout inventory for repository skills. The canonical
policy kernel remains [`AGENTS.md`](../../AGENTS.md); this document records
routing, domain ownership and evidence expectations without making app commits
depend on a separate agent-document gate.

## Authority and routing

```text
user request
→ nearest AGENTS.md
→ generated types / schemas / installed docs / local source
→ repository skills and domain docs
→ vendor guidance
```

## Skill inventory

| Skill                                                                                       | Owner and trigger surface                                         | Local contract / precedent                                                         | Evidence model                                                         |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`frontend-feature-workflow`](../../.agents/skills/frontend-feature-workflow/SKILL.md)      | React/Next routes, state, forms, queries, APIs, refactors         | `AGENTS.md`, installed Next docs, feature owners, TanStack contracts               | Fast/subsystem/full; targeted proof before full gate                    |
| [`frontend-ui-system`](../../.agents/skills/frontend-ui-system/SKILL.md)                    | Components, responsive UI, accessibility, visual consistency      | UI contracts, local primitives, viewport evidence                                  | Fast/subsystem/full visual verification                                |
| [`hanzihome-content-editing`](../../.agents/skills/hanzihome-content-editing/SKILL.md)      | Lesson content, renderers, editing, import, vocab and persistence | Supabase rows, Zod schemas, stable child IDs                                       | Read/write, preview/diff and sibling-isolation evidence                 |
| [`hanzihome-test-review`](../../.codex/skills/hanzihome-test-review/SKILL.md)               | Regression, renderer/API/state/edit/migration tests               | Coverage matrix, real payload shapes, lowest reproducing boundary                  | Protected invariant and false-confidence reporting                     |
| [`hanzihome-supabase-migration`](../../.codex/skills/hanzihome-supabase-migration/SKILL.md) | Migrations, RLS, RPCs, generated types and drift                  | Migration history, generated types, repository queries                             | Target, drift, lock, rollback/forward-fix and live-environment evidence |
| [`shadcn`](../../.agents/skills/shadcn/SKILL.md)                                            | Registry/component installation or upstream component work        | Local component inventory/source overrides generic registry guidance               | CLI diff, consumer sweep and UI evidence                               |
| [`migrate-radix-to-base`](../../.agents/skills/migrate-radix-to-base/SKILL.md)              | Radix-to-Base investigation or approved migration                 | Installed types, shadcn golden pairs, consumer props                               | Confirmation, behavior delta and manual interaction evidence           |

## Shared engineering contract

- Use authoritative generated/library/Zod contracts at real boundaries; do not
  add casts, suppressions, fake guards or compatibility layers to hide a
  mismatch.
- Normal TypeScript unions/discriminated unions remain valid internal modeling.
- `unknown` is valid at a genuine untrusted/library boundary when narrowed
  before domain/UI use; explicit `any` remains prohibited.
- Choose the smallest verification tier that can falsify the change.
- Production code teaches through ownership, names, direct data flow and
  invariant-focused tests.
- `npm run source:check` enforces high-value machine-detectable source rules.
- `npm run ui:check` enforces project-specific UI ownership rules.
- `npm run check` is the complete CI/release gate and is intentionally not a
  pre-commit hook.

## Gate responsibilities

| Gate | Purpose | When it should block |
| --- | --- | --- |
| `lint` | ESLint correctness/conventions | targeted development + CI |
| `typecheck` | Next/TypeScript contract | targeted development + CI |
| `source:check` | unsafe casts/any/suppressions, client-server boundary, dead owned source | CI/full verification |
| `ui:check` | design-system/component ownership drift | UI subsystem/full verification + CI |
| `api:check` | developer API inventory/route contract | API/full verification + CI |
| `test:run` | deterministic regression suite | subsystem/full verification + CI |
| `audit:prod` | production dependency advisory drift | CI/release |
| `build` | production compilation | full verification/CI/release |
| `format:check` | repository formatting | CI/merge cleanliness |

There is deliberately no full-suite pre-commit hook. A small local commit must
not be blocked by unrelated repository formatting, release audit or production
build work. CI/PR is the authoritative full-repository gate.

## Residual verification rule

Policy completeness does not imply browser proof. UI claims still require the
relevant rendered viewport/state, and remote Supabase or deployment claims still
require the corresponding environment.
