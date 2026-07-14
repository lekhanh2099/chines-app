# HanziHome

HanziHome is a Chinese self-study application built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query/Form, and Supabase.

The product flow is Course → Book/Volume → Lesson → Module. Supabase normalized tables are the runtime source for study content; JSON files are migration and audit inputs only.

## Local setup

Requirements: Node.js 22 or newer and npm 11.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The app runs at [http://localhost:3001](http://localhost:3001). Add a Supabase URL and publishable key to `.env.local`; keep secret/service-role keys server-only.

## Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run deps:check
npm run audit:prod
npm run build
```

`npm run check` runs the required formatting, lint, type, test, and build gates. CI runs the same gates on every pull request.

## Supabase workflow

- Add schema changes as timestamped files under `supabase/migrations/`.
- Refresh checked-in database types with `npm run types:supabase` after setting `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`.
- Use `npm run types:supabase:check` to detect remote type drift.
- Never mutate static JSON from the app or trust client-provided ownership fields.

## Documentation

Start with [docs/README.md](docs/README.md), [current architecture](docs/architecture/current-system.md), and the repository [AGENTS.md](AGENTS.md). Historical local-JSON PRDs are retained for product context but are explicitly superseded by the current Supabase runtime architecture.
