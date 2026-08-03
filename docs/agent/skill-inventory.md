# Repository skill inventory and audit scorecard

Updated: 2026-08-03

This is the current-checkout inventory for the seven repository skills. The
canonical policy kernel remains [`AGENTS.md`](../../AGENTS.md); this document
records routing, domain ownership, evidence expectations and residual risk so
skill drift is reviewable without relying on chat history.

## Authority and routing

Every skill follows this order:

```text
user request
→ nearest AGENTS.md
→ generated types / schemas / installed docs / local source
→ repository skills and domain docs
→ vendor guidance
```

The root contract routes all seven skills. `docs/agent/skill-authoring.md`
defines the shared structure, tier model, handoff evidence and scorecard.

## Skill inventory

| Skill                                                                                       | Owner and trigger surface                                         | Local contract / precedent                                                         | Tier and evidence status                                                                             | Residual risk                                                         |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`frontend-feature-workflow`](../../.agents/skills/frontend-feature-workflow/SKILL.md)      | React/Next routes, state, forms, queries, APIs, refactors         | `AGENTS.md`, installed Next docs, feature owners, TanStack contracts               | Fast/subsystem/full routing; reproduce-first; evidence handoff                                       | Browser evidence depends on the affected task                         |
| [`frontend-ui-system`](../../.agents/skills/frontend-ui-system/SKILL.md)                    | Components, responsive UI, accessibility, visual consistency      | `docs/ui/component-contracts.md`, `component-inventory.md`, local primitives       | Fast/subsystem/full visual verification; state/keyboard/viewport evidence                            | Rendering is still required for visual claims                         |
| [`hanzihome-content-editing`](../../.agents/skills/hanzihome-content-editing/SKILL.md)      | Lesson content, renderers, editing, import, vocab and persistence | Supabase rows, Zod schemas, stable child IDs, node-level routes                    | Fast/subsystem/full routing; read/write, preview/diff and sibling-isolation evidence                 | Live data evidence depends on the authorized environment              |
| [`hanzihome-test-review`](../../.codex/skills/hanzihome-test-review/SKILL.md)               | Regression, coverage, renderer/API/state/edit/migration tests     | `references/coverage-matrix.md`, real payload shapes, lowest reproducing boundary  | Fast/subsystem/full routing; protected invariant and false-confidence reporting                      | Full browser or live migration proof remains task-specific            |
| [`hanzihome-supabase-migration`](../../.codex/skills/hanzihome-supabase-migration/SKILL.md) | Migrations, RLS, RPCs, generated types and drift                  | Migration history, generated types, repository queries, migration review checklist | Fast/subsystem/full routing; target, drift, lock, rollback/forward-fix and live-environment evidence | Remote verification requires `SUPABASE_PROJECT_REF` and authorization |
| [`shadcn`](../../.agents/skills/shadcn/SKILL.md)                                            | Registry, component installation/update, composition and presets  | Local component inventory/source overrides generic registry guidance               | Fast/subsystem/full routing; CLI diff, consumer sweep and UI evidence                                | Upstream registry drift must be rechecked when a component changes    |
| [`migrate-radix-to-base`](../../.agents/skills/migrate-radix-to-base/SKILL.md)              | Radix-to-Base investigation or approved migration                 | Installed `.d.ts`, shadcn golden pairs, consumer-props and risk confirmation       | Fast/subsystem/full routing; confirmation, behavior delta and manual interaction evidence            | No migration is authorized by this inventory alone                    |

## Shared anti-garbage and learning contract

- Use authoritative generated/library/Zod contracts; do not add casts,
  suppressions, fake guards or compatibility layers to hide mismatches.
- Choose the smallest tier that can falsify the change and escalate only when
  the consumer graph or risk crosses that boundary.
- Handoffs identify precedent, contract owner, data/state flow, protected
  invariant, smallest coherent scope, rejected abstraction and residual risk.
- Production code teaches through names, ownership, direct data flow and
  invariant-focused tests; comments explain only non-obvious constraints.
- `npm run agent:check` verifies routing/reference/line-budget/package-gate
  integrity. `npm run source:check` enforces unsafe syntax and exact assertion
  debt. Semantic scope and evidence still require diff review.

## Scorecard

| Dimension                              | Current result                              | Evidence                                                                      |
| -------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| Authority and precedence               | Pass                                        | Root order plus local-over-vendor rules                                       |
| Scope and minimal diff                 | Pass by policy                              | Root scope lock and tier escalation                                           |
| Authoritative types/runtime boundaries | Pass                                        | Zod/generated/library contract rules and source guard                         |
| Executable anti-bypass enforcement     | Pass                                        | Agent/source/UI guards; assertion budget is zero                              |
| State/data ownership                   | Pass                                        | Architecture docs and domain skill contracts                                  |
| Regression proof                       | Pass by workflow                            | Test-review matrix and targeted/full gate requirements                        |
| UI/accessibility evidence              | Policy pass; runtime evidence task-specific | UI verification contract                                                      |
| Migration/security safety              | Policy pass; live evidence unavailable here | Supabase migration checklist and risk confirmation                            |
| Workflow efficiency                    | Pass                                        | Fast/subsystem/full routing in all seven skills                               |
| Learning from code                     | Pass                                        | Canonical handoff and code-learning rules                                     |
| Drift/update discipline                | Pass with semantic-review limit             | `agent:check` validates links and skill size; reviewers validate domain truth |

## Acceptance and residuals

The skill architecture is considered policy-complete when:

- all seven skills are routed from the root contract;
- every skill links the canonical authoring contract;
- every skill exposes fast/subsystem/full routing and evidence fields;
- local UI, data, migration and vendor precedence is explicit;
- source/UI/agent guards and `npm run check` pass;
- no new assertion debt or broad exception is introduced.

The current checkout satisfies those policy criteria. It does not claim that
every product flow has browser evidence, that remote Supabase types were
verified, or that baseline npm advisories were removed. Those are separate
runtime/deployment/dependency tasks.
