# HanziHome

HanziHome is a Chinese self-study application built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query/Form, and Supabase.

The product flow is Course → Book/Volume → Lesson → Module. Supabase normalized tables remain the runtime source for canonical HanziHome content; the reviewed Hanzi Studio Reader/practice corpus is an explicit checked-in static JSON runtime package. JSON is never a silent fallback for canonical Supabase content.

## Local setup

Requirements: Node.js 22.22.2 or newer and npm 12.2.0 (pinned in `packageManager` and CI).

The shared control CSS variants live in `src/app/globals.css`; the shadcn CLI is
used on demand with `npx shadcn@latest`, rather than installed with the app.
`packageExtensions` marks only the unused NestJS adapter's `@swc/cli` peer as
optional. Next.js workflows still use the published `workflow` runtime and
`workflow/next` integration. npm 12 records this repair in the lockfile, and
`allowScripts` pins the native dependency install scripts used by this project.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The app runs at [http://localhost:3001](http://localhost:3001). `npm run dev`
uses the Supabase project configured in `.env.local`, so localhost resolves the
same authenticated user and live user-owned data as production. A localhost
login is therefore a real session in that project. The checked-in Auth hook
caps concurrent sessions at five. Keep Supabase secret/service-role keys server-only.

## Verification

Use targeted gates while developing:

```bash
npm run lint
npm run source:check
npm run route:check
npm run ui:check
npm run api:check
npm run typecheck
npm run test:run
```

Use the full repository gate before merge/release work:

```bash
npm run check
```

`npm run check` runs lint, source/route/UI/API contract checks, type generation and type checking, deterministic tests, formatting verification, the production dependency audit, and a production build.

The [GitHub Actions workflow](.github/workflows/ci.yml) selects checks from the
changed owners and affected consumers on push/PR. Code changes run static checks,
related Node tests (or conservative full fallback), and the relevant mounted
browser/product E2E cases. Mounted fixtures run in a separate job without
Supabase; product E2E uses isolated local Supabase. The production app builds once.
Docs-only changes run formatting without application tests/build.

Manual Run workflow (`workflow_dispatch`) retains full Node, mounted and
product/SQL verification. `npm run check` remains the full local merge/release
gate; it is not the automatic affected-selection runner.

Run performance profiling/benchmarks on demand with their fixture, mode and
result limits, following [performance evidence](docs/architecture/frontend-structure.md#9-performance-evidence).

Commits run Oxfmt and Oxlint only for staged files through the Husky pre-commit hook. The full `npm run check` gate remains the release-quality gate.

See [script ownership](CONTRIBUTING.md#script-ownership) for current entrypoints, manual tools and their write targets.

## Supabase workflow

- Add schema changes as timestamped files under `supabase/migrations/`.
- Refresh checked-in database types with `npm run types:supabase` after setting `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`.
- Use `npm run types:supabase:check` to detect remote type drift.
- Never mutate external static seed artifacts from the app or trust client-provided ownership fields.

## Documentation

For supported security updates and private vulnerability reporting, see the
[security policy](SECURITY.md).

Start with [docs/README.md](docs/README.md), [current architecture](docs/architecture/current-system.md), and the repository [AGENTS.md](AGENTS.md). The Hanzi Studio contract lives in the current architecture, with static
published content and Supabase-owned new user state. Quality work has one
[master plan](docs/refactors/feature-quality-audit-enhancement-2026-10-04.md),
with [flow coverage](docs/testing/frontend-flow-coverage.md); historical reports,
superseded plans and receipts are
available through the Git history linked from the docs index.
