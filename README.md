# HanziHome

HanziHome is a Chinese self-study application built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query/Form, and Supabase.

The product flow is Course → Book/Volume → Lesson → Module. Supabase normalized tables remain the runtime source for canonical HanziHome content; the reviewed Hanzi Studio Reader/practice corpus is an explicit checked-in static JSON runtime package. JSON is never a silent fallback for canonical Supabase content.

## Local setup

Requirements: Node.js 22 or newer and npm 11.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The app runs at [http://localhost:3001](http://localhost:3001). Add a Supabase URL and publishable key to `.env.local`; keep secret/service-role keys server-only.

## Verification

Use targeted gates while developing:

```bash
npm run lint
npm run source:check
npm run route:check
npm run ui:check
npm run api:check
npm run check:hanzihome:perf
npm run typecheck
npm run test:run
```

Use the full repository gate before merge/release work:

```bash
npm run check
```

`npm run check` runs lint, source/route/UI/API contract checks, the HanziHome performance-boundary guard, type generation and type checking, deterministic tests, formatting verification, the production dependency audit, and a production build.

The GitHub Actions CI workflow runs automatically for pushes to `main` and pull requests; it also remains available through manual `workflow_dispatch`. Run `npm run check` before merge/release work when local feedback is needed.

Commits run Oxfmt and Oxlint only for staged files through the Husky pre-commit hook. The full `npm run check` gate remains the release-quality gate.

## Supabase workflow

- Add schema changes as timestamped files under `supabase/migrations/`.
- Refresh checked-in database types with `npm run types:supabase` after setting `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`.
- Use `npm run types:supabase:check` to detect remote type drift.
- Never mutate external static seed artifacts from the app or trust client-provided ownership fields.

## Documentation

Start with [docs/README.md](docs/README.md), [current architecture](docs/architecture/current-system.md), and the repository [AGENTS.md](AGENTS.md). Historical local-JSON PRDs are retained for product context; the Hanzi Studio migration contract is documented in the current architecture, with static published content and Supabase-owned new user state.
