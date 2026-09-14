# Repository skill inventory and audit scorecard

Updated: 2026-09-14

This is the current-checkout inventory for repository skills. The canonical
policy kernel remains [`AGENTS.md`](../../AGENTS.md); this document records
routing, domain ownership and evidence expectations without making app commits
depend on a separate agent-document gate.

Repository skills live under `.agents/skills/<skill-name>/`. Each skill owns a
`SKILL.md` file and may provide Codex UI metadata in `agents/openai.yaml`.

## Authority and routing

Root [`AGENTS.md`](../../AGENTS.md) owns authority and task routing. Skills add
domain capability; they do not form a prerequisite chain. Canonical policy and
domain owners are listed in [`skill-authoring.md`](skill-authoring.md), which
is read only for instruction/skill maintenance.

## Skill inventory

| Skill                                                                                        | Owner and trigger surface                                         | Local contract / precedent                                          | Evidence model                                                          |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`frontend-feature-workflow`](../../.agents/skills/frontend-feature-workflow/SKILL.md)       | State/cache ownership and frontend architecture decisions         | `frontend-structure.md`, owner/consumer source, installed contracts | Root tier plus owner/consumer regression proof                          |
| [`frontend-ui-system`](../../.agents/skills/frontend-ui-system/SKILL.md)                     | UI composition, interaction and responsive/design-system work     | Concern-specific canonical UI docs and local primitives             | Root tier plus affected rendered states                                 |
| [`ui-ux-pro-max`](../../.agents/skills/ui-ux-pro-max/SKILL.md)                               | Requested broad UX audits and UX research                         | Product/UI contracts and pinned upstream adapter                    | Source and rendered findings separated from inference                   |
| [`hanzihome-content-editing`](../../.agents/skills/hanzihome-content-editing/SKILL.md)       | Lesson content, renderers, editing, import, vocab and persistence | Supabase rows, Zod schemas, stable child IDs                        | Read/write, preview/diff and sibling-isolation evidence                 |
| [`hanzihome-test-review`](../../.agents/skills/hanzihome-test-review/SKILL.md)               | Requested regression/coverage work; not isolated test maintenance | Coverage matrix, real payloads, lowest reproducing boundary         | Protected invariant and false-confidence reporting                      |
| [`hanzihome-supabase-migration`](../../.agents/skills/hanzihome-supabase-migration/SKILL.md) | Migrations, RLS, RPCs, generated types and drift                  | Migration history, generated types, repository queries              | Target, drift, lock, rollback/forward-fix and live-environment evidence |
| [`shadcn`](../../.agents/skills/shadcn/SKILL.md)                                             | Explicit invocation for registry/upstream/preset work             | Local inventory/source overrides registry guidance                  | CLI diff, consumer sweep and UI evidence                                |
| [`migrate-radix-to-base`](../../.agents/skills/migrate-radix-to-base/SKILL.md)               | Radix-to-Base investigation or approved migration                 | Installed types, shadcn golden pairs, consumer props                | Confirmation, behavior delta and manual interaction evidence            |

Existing skill names/paths are retained. `shadcn/agents/openai.yaml` disables
implicit invocation. Other invocation metadata is unchanged; narrow
descriptions and root routing determine their task scope.

## Routing review scenarios

The 2026-09-14 instruction review compared these paths with `main@a0a6ba9`.
Previously, the general skill matched any non-trivial `src/` task, content
required it as a prerequisite, six skills loaded authoring policy, and several
skills required the full gate for app-code completion. The current paths below
were reviewed against the root and skill text; they are not measured agent
runs or a model-performance benchmark.

Root/nearest subtree instructions and affected source apply to every row.
Additional skills are selected only when the actual task crosses their concern.

| Task                                | Skill/context selected                              | Evidence scope                                               |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Local UI spacing regression         | UI skill; relevant component/verification sections  | Affected viewport and targeted check                         |
| Shared primitive additive change    | UI skill; component contract and consumers          | Affected consumers and interactions                          |
| Query/state-owner bug               | Architecture workflow; state contract               | Producer/write path and deterministic regression             |
| Interface copy only                 | i18n contract; no UI/general skill                  | Parity plus real consumer in all three locales               |
| HanziHome vocabulary edit           | Content skill; HanziHome subtree                    | Canonical row, node save and sibling isolation               |
| Requested regression review         | Test-review skill and coverage matrix               | Lowest boundary reproducing the failure                      |
| Read-only Supabase migration review | Migration skill and Supabase contract               | Migration/drift evidence; no live mutation                   |
| Explicit shadcn registry add        | shadcn skill and local inventory                    | Dry-run/diff, consumers, applicable checks and authorization |
| Requested Radix-to-Base migration   | Migration skill and relevant golden-pair references | Baseline, consumers, behavior deltas and full gate           |
| Requested broad UX audit            | UX audit skill and affected UI/product contracts    | Rendered findings separated from source/inference            |

Isolated nonvisual fixes and test maintenance do not activate the general
workflow or a broad audit. Instruction changes preserve the commands and
executable gates below. Compare actual runs under the same model/environment
before claiming improvements to correctness, context usage or task latency.

## Gate responsibilities

| Gate           | Purpose                                                                  | When it should block                |
| -------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| `lint`         | Oxlint correctness/conventions                                           | targeted development + CI           |
| `typecheck`    | Next/TypeScript contract                                                 | targeted development + CI           |
| `source:check` | unsafe casts/any/suppressions, client-server boundary, dead owned source | CI/full verification                |
| `ui:check`     | design-system/component ownership drift                                  | UI subsystem/full verification + CI |
| `api:check`    | developer API inventory/route contract                                   | API/full verification + CI          |
| `test:run`     | deterministic regression suite                                           | subsystem/full verification + CI    |
| `audit:prod`   | production dependency advisory drift                                     | CI/release                          |
| `build`        | production compilation                                                   | full verification/CI/release        |
| `format:check` | Oxfmt repository formatting                                              | CI/merge cleanliness                |

There is deliberately no full-suite pre-commit hook. A small local commit must
not be blocked by unrelated repository formatting, release audit or production
build work. CI/PR is the authoritative full-repository gate.

The staged pre-commit hook runs Oxfmt with write-back and Oxlint only for staged
JavaScript/TypeScript and supported formatting files. It does not run tests,
typecheck, audit or production build.

## Residual verification rule

Policy completeness does not imply browser proof. UI claims still require the
relevant rendered viewport/state, and remote Supabase or deployment claims still
require the corresponding environment.
