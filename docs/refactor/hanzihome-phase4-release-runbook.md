# HanziHome Phase 4 — release hardening runbook

This runbook is the executable local/CI contract for the Playwright and
Supabase fixture gate. It does not replace the migration postflight or the
deployed smoke required for release-complete status.

## Local E2E

Prerequisites:

- Node 22+ and npm 11;
- Docker running for the Supabase local stack;
- the repository checkout on `refactor/hanzihome-integrity-remediation`.

Start a clean local database and export the local keys into the Next process:

```bash
npx supabase start
npx supabase db reset
eval "$(npx supabase status -o env)"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
export SUPABASE_SECRET_KEY="$SERVICE_ROLE_KEY"
export E2E_BASE_URL="http://127.0.0.1:3001"
export E2E_USER_A_EMAIL="hanzihome-e2e-a@example.test"
export E2E_USER_B_EMAIL="hanzihome-e2e-b@example.test"
export E2E_FIXTURE_PASSWORD='HanziHome-E2E!2026'
npm run e2e:seed
npx playwright install chromium
npm run test:e2e
```

The seeder creates two confirmed email fixtures, initializes their learning
state rows, and gives only account A one due Learning Loop item. The tests
cover A→logout→B isolation, review scheduling, offline retry and stale
revision conflict, explicit Reader completion, microphone Shadowing, guest
Daily Reading, and browser Dictionary/RPC write denial while authenticated
SELECT remains available.

Use `npx supabase stop` after the run. The fixture email/password values are
local test credentials only and must not be reused in a deployed environment.

## CI contract

`.github/workflows/ci.yml` has two jobs:

- `verify`: the existing `npm run check` gate;
- `e2e`: Ubuntu Docker, `supabase start`, `supabase db reset`, local key
  export, `npm run e2e:seed`, and `npm run test:e2e`.

The E2E job uses fake Chromium media input so the microphone flow is
deterministic. A green E2E job is still local-stack evidence; it is not proof
of deployed headers, cloud secrets, or production data postflight.

## Release owner actions

Before calling Phase 4 release-complete, the deployment owner must:

1. provision and verify `BYOK_ENCRYPTION_SECRET` in every deployed server
   environment using `docs/refactor/hanzihome-byok-encryption-runbook.md`;
2. apply and repair every reviewed migration, then record row/grant/RLS/RPC
   postflight evidence;
3. enable GitHub protection on `main`: pull request required, required check
   `verify`, force-push disabled, and branch deletion disabled;
4. run deployed smoke for A→logout→B isolation, offline/reconnect behavior,
   review scheduling, explicit Reader completion, Daily Reading guest/auth
   behavior, Dictionary write denial, and real Shadowing microphone capture;
5. verify the deployed response includes
   `Permissions-Policy: camera=(), microphone=(self), geolocation=()`.

Until those external actions are recorded, the branch is implementation-ready
but not release-complete.
