# HanziHome Integrity Remediation — Phase 2 Execution Checkpoints

Branch: `refactor/hanzihome-integrity-remediation`
Master plan: `docs/refactor/hanzihome-integrity-remediation-plan.md`
Continuation of: `docs/refactor/hanzihome-integrity-remediation-checkpoints-phase1.md`

This append-only ledger records Phase 2 execution evidence. A source change is
not release complete without the stated migration, test, and browser evidence.

## Checkpoint P2-01A — Lesson annotation BFF boundary

Status: `DONE`
Date: 2026-08-20

### Scope completed

- Lesson annotation reads and writes now use typed feature API clients and
  authenticated HanziHome routes; the browser no longer creates a Supabase
  client or calls annotation table/RPC APIs directly.
- The routes derive the session user before constructing service-role authority.
  The service-only annotation repository scopes every read and mutation by that
  validated user ID.
- Migration `20260820133000_move_lesson_annotations_behind_server.sql` creates
  service-role-only RPCs for the existing atomic note/link/annotation lifecycle,
  preserves legacy RPC bodies for integration compatibility, revokes direct
  browser table grants, and revokes browser legacy-RPC execution.

### Live migration evidence

Target: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`.

Preflight found zero annotation rows and zero linked annotation notes. The
linked target has historical migration drift, so `supabase db push` was not
safe. The reviewed file was applied with `supabase db query --linked --file`,
then recorded with `supabase migration repair 20260820133000 --status applied`.

Postflight confirmed:

- annotation row and linked-note counts remain zero;
- `authenticated` and `anon` have no table grant on `lesson_text_annotations`;
- legacy annotation RPCs and new server RPCs are executable by `service_role`
  only;
- remote migration history includes `20260820133000`.

### Checks run

- targeted annotation route tests: 2 files / 7 tests passed;
- `npm run typecheck` passed;
- `npm run lint`, `source:check`, `route:check`, `ui:check`, API registry,
  HanziHome performance, and production audit passed after registering routes;
- `git diff --check` passed.

### Remaining verification

- full `npm run check` is currently blocked by formatting drift in the
  remote-only QA file `docs/refactor/hanzihome-remediation-final-qa.md`; this
  batch does not modify that file;
- authenticated browser annotation create/update/delete smoke remains part of
  final Phase 2/4 QA.

## Checkpoint P2-02 — Static Reader corpus contract

Status: `DONE`
Date: 2026-08-20

### Scope completed

- The reviewed static Reader/practice package is now the explicit immutable
  Reader content source; Supabase retains only Reader user state keyed by its
  stable IDs.
- Migration `20260820143000_retire_static_reader_content_schema.sql` retires
  the six unused normalized Reader content tables and two orphaned parent-check
  functions without `CASCADE`. It does not mutate progress, annotations, or
  pronunciation overrides.
- The authoritative generated type contract removes only those six retired
  tables; unrelated remote generated-type drift remains excluded.

### Live migration evidence

Target: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`.

Preflight found zero rows in all six content tables, six Reader progress rows,
zero annotation rows, zero pronunciation override rows, no runtime source
references, and no remaining parent-check-trigger dependents. The reviewed
file was applied with `supabase db query --linked --file`, then recorded with
`supabase migration repair 20260820143000 --status applied` because the linked
target has historical migration drift.

Postflight confirmed all six content tables and both orphaned functions are
absent, while Reader progress remains at six rows and both empty state tables
remain intact. Remote migration history includes `20260820143000`.

### Checks run

- `npm run typecheck` passed;
- targeted static Reader content/state route tests: 4 files / 17 tests passed.

### Forward fix

If the product later needs database-owned Reader content, introduce a new
additive schema migration and an explicit content lifecycle; do not restore
these retired tables as an implicit runtime fallback.

## Checkpoint P2-03 — Reader state repository ownership split

Status: `DONE`
Date: 2026-08-20

### Scope completed

- The former mixed `reader-state-repository` has been removed. Reader progress,
  personal learning state, Daily Reading state, practice attempts, annotations,
  pronunciation overrides, and Learning Loop writes each now use their bounded
  server repository.
- Routes import their corresponding owner directly. The Reader bootstrap is a
  small composition repository that reads progress, annotations, and overrides
  without becoming another persistence owner.
- Revision checks, static-ID validation, RPC names, response payloads, and
  authenticated route boundaries are unchanged.

### Checks run

- `npm run typecheck` passed;
- targeted Reader, practice, and Learning Loop repository/route tests: 7 files
  / 29 tests passed.

## Checkpoint P2-04A — Confirmed dead state retirement

Status: `DONE`
Date: 2026-08-20

### Scope completed

- Migration `20260820153000_drop_confirmed_dead_hanzihome_state.sql` drops only
  four proven-dead, zero-row tables: `hanzihome_learning_events`,
  `hanzihome_import_chunks`, `hanzihome_listening_attempts`, and
  `hanzihome_listening_item_progress`.
- Current Listening content tables remain untouched. Listening practice uses
  immutable `hanzihome_practice_attempts`, not the retired legacy state.

### Live migration evidence

Target: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`.

Preflight found no runtime source callers, zero rows, no dependent foreign
keys, and no public SQL routine references for all four tables. The only
table-local trigger was an `updated_at` trigger on the retired progress table.
The reviewed file was applied with `supabase db query --linked --file`, then
recorded with `supabase migration repair 20260820153000 --status applied`.

Postflight confirmed all four tables are absent. The migration uses no
`CASCADE`; an unexpected dependency would have blocked the transaction.

### Forward fix

If Listening needs a separate persisted owner beyond immutable attempt
evidence, introduce an additive schema and explicit lifecycle rather than
restoring this legacy contract.

## Checkpoint P2-04B — Remaining compatibility candidate audit

Status: `DONE`
Date: 2026-08-20

### Decision evidence

- `hanzihome_listening_items` and `hanzihome_listening_audio` are empty on the
  linked target, but `listening.repository.ts` reads the former at runtime and
  `hanzihome-studio-import.ts` owns its canonical import shape. They remain
  content/recovery surfaces, not proven-dead state.
- The external-seed import routine remains an operations compatibility surface.
  There is no current browser caller, but its lifecycle reaches the canonical
  course and Listening content model; an unverified recovery/operations path
  is not safe to drop in this remediation.
- Reader compatibility was already narrowed in P2-02. The remaining Reader
  tables are user-owned state with live source owners; Reader progress has six
  rows, so it is explicitly preserved.

No additional object meets every deletion requirement (no runtime owner, no
operations/recovery owner, zero rows, no SQL dependency, and a safe rollback
path). This audit intentionally adds no destructive migration.

## Checkpoint P2-05 — Reader user-state BFF authority boundary

Status: `DONE`
Date: 2026-08-20

### Scope completed

- Reader progress, personal and Daily Reading state, Reader annotations,
  pronunciation overrides, practice attempts, and Learning Loop now execute
  through server-only service-role authority after their API route has derived
  the authenticated user ID.
- Service-only RPC wrappers preserve the established atomic revision semantics
  by setting the validated user claim only for the wrapper transaction before
  invoking the existing RPC body. Legacy RPC bodies and owner-RLS policies are
  unchanged.
- Browser `anon` and `authenticated` roles no longer have table grants or RPC
  execution for these user-state paths.

### Live migration evidence

Target: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`.

Migration `20260820163000_move_reader_state_writes_to_server.sql` was applied
with `supabase db query --linked --file`, then recorded with `supabase
migration repair 20260820163000 --status applied`. Preflight/postflight counts
are unchanged: Daily Reading state `1`, Reader progress `6`, and practice
attempts `57`; other affected state tables remained empty.

Postflight confirms no `anon` or `authenticated` table grants on all seven
tables. Both legacy and new wrapper RPCs are executable by `service_role` only.

### Checks run

- `npm run lint`, `source:check`, `route:check`, and `api:check` passed;
- `npm run typecheck` passed;
- full Vitest: 172 files / 761 tests passed.

## Checkpoint P2-06 — Dedicated BYOK encryption material

Status: `DONE`
Date: 2026-08-20

### Scope completed

- A new provider key now requires `BYOK_ENCRYPTION_SECRET`; a Supabase server
  credential cannot become encryption material for a new value.
- The existing Supabase-derived key remains only in the ordered decryption path
  for credentials encrypted before dedicated BYOK material was provisioned.
- The runbook records provisioning, recovery, rotation limitations, and the
  no-plaintext release evidence. It explicitly assigns cloud secret
  configuration to the deployment owner.

### Checks run

- focused encryption tests prove dedicated-key round-trip, new-write refusal
  without the dedicated secret, and legacy fallback decryption after cutover.

### Remaining verification

- configure `BYOK_ENCRYPTION_SECRET` in each deployed server environment and
  run the Settings → AI disposable-key smoke from the runbook. This repository
  change cannot provision or inspect cloud secrets.

## Checkpoint P2-07 — AI query and index evidence

Status: `DONE`
Date: 2026-08-20

### Live profiling evidence

On the linked target, the AI conversation tables contain at most six rows:
two conversations, six messages, one character, and zero rows in preferences,
relationship state, memories, evidence, and post-turn jobs. `EXPLAIN (ANALYZE,
BUFFERS)` for the current conversation lookup, message history, post-turn job
claim, and relationship lookup completed in 0.09–0.18 ms.

The message query used `ai_messages_conversation_seq_unique`, post-turn claim
used `ai_post_turn_jobs_ready_idx`, and relationship lookup used its primary
key. The conversation lookup used an existing user/character index then sorted
two rows. Index statistics also show active scans on the message and job
indexes. The data volume and plans do not justify another index.

### Decision

No index migration was created or applied. Re-profile these exact runtime
queries after material data growth or an observed slow-query signal; do not
add speculative indexes merely because a candidate was listed in the plan.
