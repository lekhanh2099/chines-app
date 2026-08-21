# HanziHome Integrity Remediation — Phase 4 Execution Checkpoints

> **Historical migration note (2026-08-21):** The individual migration IDs and
> paths recorded below are historical evidence. They are superseded by
> `supabase/migrations/20260820163000_hanzihome_remote_schema_baseline.sql`;
> do not rerun or repair the individual migrations.

Branch: `refactor/hanzihome-integrity-remediation`

## Checkpoint P4-01 — Playwright and CI hardening

Status: `COMPLETE_PENDING_DEPLOYED_SMOKE`
Date: 2026-08-20

Implemented in the current branch:

- `@playwright/test`, `playwright.config.ts`, and `npm run test:e2e`;
- deterministic `npm run e2e:seed` fixture setup for two confirmed local
  accounts and one due Learning Loop item owned only by account A;
- E2E coverage for account isolation, scheduling, offline retry, stale
  revision conflict, explicit Reader completion, microphone Shadowing,
  guest/auth Daily Reading behavior, authenticated Dictionary SELECT, and
  browser Dictionary/RPC write denial;
- CI `e2e` job that starts and resets Supabase locally before running the tests;
- [Phase 4 release runbook](hanzihome-phase4-release-runbook.md) with the
  required GitHub protection, BYOK, migration postflight, and deployed smoke
  actions.

### Checks actually run

- `npx playwright test --list` passed and listed 5 tests;
- lint, source, route, UI, API checks, and typecheck passed;
- local Supabase/Playwright execution was attempted but is not available in
  this environment because Docker is not installed (`docker` exit 127);
  `npx supabase migration list --linked` and read-only postflight queries did
  run against the linked project.
- full `npm run check` passed: 173 files / 766 tests, format, audit, and
  production build included.

### Release blockers still requiring external execution

- run the E2E job in CI or a Docker-enabled checkout;
- enable `main` branch protection and perform authenticated deployed account
  isolation, Daily Reading, Dictionary, Reader, and real microphone smoke;
- promote the reviewed branch through the normal PR path before making any
  production behavior claim. The current production deployment still points
  at the older `main` head.

## Execution addendum — 2026-08-20

- Commit `ef30edad` is pushed to
  `refactor/hanzihome-integrity-remediation`; the worktree and remote branch
  are clean and equal.
- The linked Supabase migration history includes the Phase 0 lock and all
  reviewed Phase 1/2 migrations (`20260819235500`, `20260820113000`,
  `20260820123000`, `20260820133000`, `20260820143000`, `20260820153000`, and
  `20260820163000`). Read-only postflight shows 42 dictionary rows, 57
  immutable practice attempts, 6 Reader progress rows, and no annotation rows.
  `authenticated` retains only `SELECT` on `dictionary_core`; service-role
  grants and the reviewed owner-RLS policies remain in place.
- Vercel production and preview now contain sensitive `BYOK_ENCRYPTION_SECRET`
  and `SUPABASE_SECRET_KEY`; preview also has the required public Supabase
  URL/key. The branch was deployed to preview as
  `https://chines-ra9hkaipg-lekhanh2099s-projects.vercel.app` and its cloud
  build completed successfully.
- Preview smoke through the Vercel protection-bypass client returned `200`
  for `/vi/login` and `/vi/daily-reading`, rendered the HanziHome metadata,
  and returned the required
  `Permissions-Policy: camera=(), microphone=(self), geolocation=()` header.
- Local Supabase E2E remains unavailable because Docker is not installed. The
  GitHub E2E job and authenticated deployed flow still require a PR/manual
  workflow run; production is still serving the older `main` head, so no
  production behavior claim is made for this branch.
- GitHub API inspection found no open PR or workflow run for this branch. The
  current private-repository plan returns `403 Upgrade to GitHub Pro or make
this repository public` for `main` branch protection, so required PR/check
  enforcement cannot be enabled from this account without an owner decision
  about GitHub plan or repository visibility.

## Execution addendum — 2026-08-20 CI rerun audit

- Commit `86fba2f9` removes the duplicate email-login `window.location.replace`
  path that caused `ERR_ABORTED`/frame-detached navigation races; commit
  `ccad9306` extends only the E2E auth URL settle timeout to 15 seconds.
- CI run `32371522032` passed `verify` for `ccad9306`. Its E2E job completed
  migration application and fixture seeding, but failed 3 tests and marked 2
  flaky on the original attempt. Re-running the failed E2E job produced the
  same result.
- The runner logs show Docker `toomanyrequests: Rate exceeded` while pulling
  Supabase images, followed by `ECONNRESET` and 30-second REST/page timeouts.
  Existing `NotesService` `permission denied for table notes` messages are
  also present but are outside this Phase 4 scope. This run is recorded as
  infrastructure-blocked E2E evidence, not a product pass.
- At that checkpoint P4-01 remained `IMPLEMENTATION_COMPLETE_PENDING_EXTERNAL_E2E`;
  the later green-CI addendum below supersedes that pending E2E status.

## Execution addendum — 2026-08-20 green CI E2E

- Commit `b6f98297` is pushed to `refactor/hanzihome-integrity-remediation`.
- CI run `32384114057` passed both jobs: `verify` completed `npm run check`,
  and `e2e` applied the local migration set, seeded the two fixture accounts,
  and completed all five Playwright flows with `5 passed (3.1m)`.
- The Learning Loop conflict flow is now deterministic: the test fixture
  recreates the due item with revision zero, and the server repository performs
  a service-role revision precheck before the existing atomic RPC. Browser
  conflicts therefore return the existing route-level 409 contract instead of
  leaving the mutation request pending.
- P4-01's CI acceptance is complete. Deployed authenticated smoke, production
  promotion, and GitHub branch protection remain external release gates.

## Execution addendum — 2026-08-20 deployed preview audit

- The current branch head `c3ad3ae9` was deployed as the protected Vercel
  Preview `https://chines-epsqj0103-lekhanh2099s-projects.vercel.app` and
  reached `READY` after a successful Next production build.
- Vercel protection-bypass smoke rendered `/vi/daily-reading` with HTTP 200,
  HanziHome content, zero unauthorised `401` responses to the Daily Reading
  API, and the exact header
  `Permissions-Policy: camera=(), microphone=(self), geolocation=()`.
- Vercel environment inspection confirms sensitive
  `BYOK_ENCRYPTION_SECRET` and `SUPABASE_SECRET_KEY` are configured for both
  Production and Preview. Their values are not recorded in this ledger.
- The linked migration list now shows matching local/remote history for
  `20260819235500` and all reviewed `20260820113000` through
  `20260820163000` migrations. Read-only postflight still shows 42 dictionary
  rows, 57 practice-attempt rows, 6 Reader-progress rows, and no retired
  Reader/dead-state tables. The linked schema lint has warnings only and no
  errors.
- Production remains on the older deployment: its response currently exposes
  `microphone=()` and legacy KMS markers. No production promotion was made.
- Authenticated deployed isolation/Reader/Dictionary/BYOK round-trip and real
  microphone capture remain unverified because the linked project has no
  approved deployed fixture credentials. The local-only E2E credentials were
  not reused in the deployed environment.
- GitHub `main` branch-protection inspection still returns HTTP 403 because the
  current private-repository plan does not include that feature; owner action
  is required.
