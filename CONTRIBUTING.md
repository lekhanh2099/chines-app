# Contributing

Read `AGENTS.md` before changing HanziHome code. Inspect the current data and render path first, then choose the smallest safe slice.

## Change workflow

1. State the read owner, payload boundary, cache key, loading/error/empty behavior, and expected payload size.
2. For edits, state the stable entity ID, owned fields, authorization check, parent relationship check, and invalidation scope.
3. Add or update Zod boundary tests when an API/form contract changes.
4. Add a timestamped Supabase migration for schema changes; never edit production schema only through the dashboard.
5. Run the smallest targeted checks that can falsify the change, then run `npm run check` before merge/release work or when the change crosses a full-path boundary.

Do not commit secrets, generated build output, raw production data, or app code that writes external static seed artifacts.

## Script ownership

Keep scripts required by the current CI/E2E flow and the Supabase schema/type workflow. The remaining `.mjs` files run directly as Node ES modules. Vitest discovers their tests; API inventory modules and the audit baseline support their owning guard.

Historical Studio packaging tools and manual performance/session/font utilities were retired on 11/10/2026. Their removal preserves the checked-in Studio seed, generated database types and font assets. The former Studio regeneration tooling remains recoverable in Git history.

| Entry point                                                    | Current purpose                                                    | Execution and writes                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `npm run source:check`, `route:check`, `ui:check`, `api:check` | Source ownership/types, navigation, UI contracts and API inventory | Read-only guards in the full local check and code-change CI.                                                          |
| `npm run audit:prod`                                           | Dependency advisories against `scripts/npm-audit-baseline.json`    | Reads the npm registry; the empty baseline allows no advisory exceptions. No dependency install or baseline update.   |
| `npm run test:run -- scripts`                                  | Four guard test files                                              | Node tests; fixture writes use temporary directories. No browser or Supabase required.                                |
| `npm run e2e:seed`                                             | Isolated product E2E accounts and content                          | CI product E2E setup; writes fixtures and requires a localhost Supabase target.                                       |
| `npm run types:supabase`, `types:supabase:check`               | Generated database contract and remote drift                       | Manual, authenticated remote schema read; generation writes `src/types/supabase.generated.ts`, `--check` compares it. |

CI selection stays in [the existing workflow](.github/workflows/ci.yml). Manual tools are not default CI steps; keep their execution separate from ordinary checks.
