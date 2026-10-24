# Contributing

Read `AGENTS.md` before changing HanziHome code. Inspect the current data and render path first, then choose the smallest safe slice.

## Change workflow

Before implementation, state the goal, non-goals, observable acceptance criteria,
closest existing precedent, authoritative types and expected affected files.
For a bug, include a current reproduction and behavior that must remain unchanged.
Choose risk/required approvals from [the risk policy](docs/agent/risk-confirmation.md)
and Fast/Subsystem/Full verification from `AGENTS.md`; these are separate decisions.
Keep the brief proportional: a small task can use the chat, while significant
changes retain decisions and acceptance with their existing task owner.

For new GitHub tasks, use the [Engineering task form](.github/ISSUE_TEMPLATE/engineering-task.yml).
Keep progress/evidence on that issue; do not infer READY or approval from form submission.

1. State the read owner, payload boundary, cache key, loading/error/empty behavior, and expected payload size.
2. For edits, state the stable entity ID, owned fields, authorization check, parent relationship check, and invalidation scope.
3. Add or update Zod boundary tests when an API/form contract changes.
4. Add a timestamped Supabase migration for schema changes; never edit production schema only through the dashboard.
5. Run the smallest targeted checks that can falsify the change, then run `npm run check` before merge/release work or when the change crosses a full-path boundary.

Do not commit secrets, generated build output, raw production data, or app code that writes external static seed artifacts.

## Review and completion

- Map each acceptance criterion to a test, observed result or explicit unverified
  limitation. Required acceptance still open means the task is not complete.
- Record commands actually run, results, source SHA or working-diff scope and
  environment. Keep local checks, remote CI and production evidence separate.
- Review the complete diff for scope, existing ownership and type integrity.
  Use independent review when risk/complexity requires it; findings need a concrete
  failure scenario and evidence. Resolve blockers or obtain explicit risk acceptance.
- For user-facing behavior, record the rendered viewport/state and interaction
  checked when applicable. Follow the user's browser-automation constraints.
- Report local implementation, human acceptance, merge and deployment separately.
  Mark steps that do not apply with a reason. A docs/audit task need not deploy.
  If the target branch auto-deploys production, treat merge as a release action.
- Before a session handoff, retain decisions, evidence and remaining acceptance
  at the existing task owner; the next session checks current source and diff.

The [quality audit master](docs/refactors/feature-quality-audit-enhancement-2026-10-04.md)
remains its program's only queue. Do not mirror its state into Issues or a new plan
without an explicit ownership transition. GitHub Issues/OpenSpec adoption and
the pilot are described in the [Solo AI workflow](docs/agent/solo-ai-engineering-workflow.md);
they are not prerequisites for routine fixes or permission to publish/install tools.

## Script ownership

Keep scripts required by the current CI/E2E flow and the Supabase schema/type workflow. The remaining `.mjs` files run directly as Node ES modules. Vitest discovers their tests; API inventory modules and the audit baseline support their owning guard.

Historical Studio packaging tools and manual performance/session/font utilities were retired on 11/10/2026. Their removal preserves the checked-in Studio seed, generated database types and font assets. The former Studio regeneration tooling remains recoverable in Git history.

| Entry point                                                    | Current purpose                                                    | Execution and writes                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `npm run source:check`, `route:check`, `ui:check`, `api:check` | Source ownership/types, navigation, UI contracts and API inventory | Read-only guards in the full local check and code-change CI.                                                          |
| `npm run audit:prod`                                           | Dependency advisories against `scripts/npm-audit-baseline.json`    | Reads the npm registry; the empty baseline allows no advisory exceptions. No dependency install or baseline update.   |
| `npm run test:run -- scripts`                                  | Guard and CI workflow regression tests                             | Node tests; fixture writes use temporary directories. No browser or Supabase required.                                |
| `npm run e2e:seed`                                             | Isolated product E2E accounts and content                          | CI product E2E setup; writes fixtures and requires a localhost Supabase target.                                       |
| `npm run types:supabase`, `types:supabase:check`               | Generated database contract and remote drift                       | Manual, authenticated remote schema read; generation writes `src/types/supabase.generated.ts`, `--check` compares it. |

CI selection stays in [the existing workflow](.github/workflows/ci.yml). Manual tools are not default CI steps; keep their execution separate from ordinary checks.

The workflow's `CI gate` aggregates `changes`, `verify` and the selected browser/E2E
suites. A selected suite must succeed; an unselected suite may be skipped. Use
this stable check for branch protection only after the workflow is published and
the check has run remotely. A local workflow file does not enforce GitHub merges.
