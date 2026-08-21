# HanziHome Integrity Remediation — Phase 1 Execution Checkpoints

> **Historical migration note (2026-08-21):** The individual migration IDs and
> paths recorded below are historical evidence. They are superseded by
> `supabase/migrations/20260820163000_hanzihome_remote_schema_baseline.sql`;
> do not rerun or repair the individual migrations.

Branch: `refactor/hanzihome-integrity-remediation`  
Master plan: `docs/refactor/hanzihome-integrity-remediation-plan.md`  
Continuation of: `docs/refactor/hanzihome-integrity-remediation-checkpoints.md`  
Date: 2026-08-20

This is the append-only Phase 1 continuation ledger. The Phase 0 ledger remains unchanged as historical evidence; Phase 1 checkpoints append here so later verification does not rewrite earlier claims.

## Checkpoint P1-01 — Learning data semantics source closure

Status: `SOURCE_COMPLETE_PENDING_EXTERNAL_GATES`

### P1-01 — Deterministic 3-way learning-state merge

Source status: `DONE`

Implemented and documented in:

- `src/features/hanzihome/local/learning-state-conflict-merge.ts`
- `src/features/hanzihome/local/learning-state-conflict-merge.test.ts`
- `docs/refactor/hanzihome-phase1-learning-state-merge-contract.md`

Rules are explicit and deterministic:

- scalar settings merge per field;
- `lessonTextDisplayMode` merges per nested field;
- bookmark membership applies local add/remove delta to latest remote state;
- same progress item chooses newer `lastReviewedAt`; timestamp ties/missing timestamps resolve to the pending local edit.

The user previously supplied successful targeted/full-gate evidence for this batch before later Phase 1 source changes. A fresh full gate is still required for the final Phase 1 branch head.

### P1-02 — Immutable review/practice evidence

Source status: `BLOCKED_CONFIRMATION` for live DB completion.

Source cutover is implemented:

- review actions use one `recordReview` contract;
- current vocab/grammar mastery remains in `user_learning_state.progress`;
- new review evidence is queued in an owner-scoped IndexedDB outbox with one stable attempt UUID;
- the existing app-level learning sync agent drains review evidence on the same online/focus lifecycle;
- retry of the same UUID is idempotent;
- new review actions no longer append to `user_learning_state.reviewHistory`;
- Home reviewed-today/recent-activity projections read `surface = 'review'` attempt evidence rather than the legacy JSON history.

Prepared migration, NOT applied by this agent:

`supabase/migrations/20260820113000_consolidate_hanzihome_review_attempt_evidence.sql`

It validates the legacy review-history shape, adds `review` to the attempt surface constraint, makes authenticated attempt access append/read-only, and backfills legacy events while leaving `review_history` untouched.

Latest read-only live preflight on `chines-app` / `pdrzkirlhbkmfpbcsujp`:

```text
migration 20260820113000 in remote history: no
hanzihome_practice_attempts rows:          0
review attempt rows:                       0
legacy review_history items:              57
current authenticated attempt grants:      SELECT/INSERT/UPDATE/DELETE
current attempt RLS:                       one FOR ALL own-row policy
```

No live mutation was executed.

### P1-03 — Reader completion semantics

Source status: `SOURCE_COMPLETE`.

`completed` now means explicit learner completion. Reader playback reaching the end no longer sets completion. The Reader surface exposes an explicit completion control, so reading without TTS can complete and playing only the final segment cannot falsely complete the document.

Deployed/browser smoke remains required before release closeout.

### P1-04 — Review source-link round trip

Source status: `SOURCE_COMPLETE`.

Typed Reader source targets now preserve:

```text
source
documentId
paragraphId optional
startOffset optional
endOffset optional
```

Reader selection and Shadowing producers use the typed source-link builder, and Reader can restore the target paragraph/range through `initialFocus`.

Browser round-trip smoke remains required before release closeout.

### P1-05 — Casual lookup vs SRS ownership

Source status: `DONE`.

Casual inspector lookup is read-only with respect to user SRS state. `user_vocab_progress` is written only by explicit saved/SRS behavior through the Dictionary BFF path; lookup is no longer incidental SRS/history persistence.

### P1-06 — Retire legacy Reader progress fields

Source status: `BLOCKED_CONFIRMATION` for live DB completion.

Active Reader route/API/repository payloads now own only:

```text
completed
answers
revision
```

They no longer send fake compatibility values for `show_pinyin`, `show_meaning`, or `summary_text`.

Prepared migration, NOT applied by this agent:

`supabase/migrations/20260820123000_retire_reader_progress_legacy_fields.sql`

The migration removes the three deprecated table columns and recreates the old RPC signature only as a temporary compatibility adapter whose deprecated arguments are inert.

Read-only live preflight collected before preparation:

```text
hanzihome_reader_progress rows: 6
completed=true:                0
answers non-empty:             0
summary non-empty:             0
show_pinyin non-default:       6
show_meaning non-default:      0
```

Those display columns are deprecated ownership, not the active display-preference owner. Live schema/function mutation still requires explicit user approval and postflight/generated-type verification.

Latest read-only migration-history check confirms `20260820123000` is not applied remotely.

### P1-07 — Daily Reading persistence/public-auth normalization

Source status: `SOURCE_COMPLETE`.

Contract: `docs/refactor/hanzihome-phase1-daily-reading-contract.md`.

Decisions implemented:

- generated Daily Reading archive/settings are device-owned V2 browser persistence;
- V2 is the only active generated-reading UI/runtime path;
- legacy V1 data is migration/recovery input only, with no V1/V2 dual writes;
- `GeneratedDailyReading.tsx` and `daily-reading-client.ts` were retired after their active consumer was cut over to V2;
- the V2 storage adapter keeps explicit V1 -> V2 migration/forward-fix support without silently deleting V1 raw data;
- anonymous static Daily Reading question/translation interactions remain local to the session and do not issue authenticated attempt persistence requests;
- authenticated attempts persist separately as immutable evidence and save failures remain visible;
- current answer/draft state is not conflated with immutable attempt evidence.

No Supabase migration is required for P1-07.

## Source/dependency/DB safety state

- No dependency changes.
- No merge/rebase/force-push or write to `main`.
- No P1 Supabase migration applied by this agent.
- Latest GitHub compare after P1-07 cleanup: branch `ahead` of `main` by 182 commits, `behind_by: 0`.
- The connector execution environment still cannot run Node/npm locally, so no fresh `npm run check` is claimed for the final P1 branch head.

## Phase 1 closeout gates

Phase 1 source implementation is complete. It must not be labeled release-complete until all of the following external gates are recorded:

1. fresh targeted tests plus `npm run check` on the final branch head;
2. explicit review/approval and live apply/postflight of `20260820113000_consolidate_hanzihome_review_attempt_evidence.sql`;
3. explicit review/approval and live apply/postflight of `20260820123000_retire_reader_progress_legacy_fields.sql`;
4. regenerated/checked Supabase types after the Reader schema migration;
5. browser smoke for review offline/retry/idempotency, explicit Reader completion, Reader source-link round trip, Dictionary casual lookup vs explicit SRS, and Daily Reading V2/anonymous behavior;
6. deployed Shadowing microphone/header smoke remains a release gate carried from Phase 0 and is intentionally deferred until the branch is merged/deployed by the user.

Do not begin Phase 2 by treating prepared-but-unapplied migrations as completed production state.

## Checkpoint P1-02A — Home review projection exactness

Status: `SOURCE_COMPLETE_PENDING_EXTERNAL_GATES`  
Date: 2026-08-20

Final review found one semantic truncation risk in the P1-02 Home projection: recent activity correctly needs only a bounded recent attempt stream, but `reviewedTodayCount` must not be derived from that same 50-row window. A learner with more than 50 review attempts in one day would otherwise see an undercount.

The projection is now split by purpose:

- recent activity still reads a bounded recent `surface = 'review'` list;
- reviewed-today uses an exact authenticated count query bounded by the browser-local start of day and request time;
- the count repository always filters by authenticated `user_id`, `surface`, `created_at >= since`, and `created_at <= until`;
- Home query keys keep recent-list and count projections owner-scoped;
- Home forces these projections to refetch when the dashboard mounts, so returning from a review session does not keep a still-fresh pre-review snapshot;
- route coverage asserts the exact-count contract and rejects an incomplete count window.

Source commits for this hardening:

```text
27c2c31f0dcba0329067764134b4c76d6e2927b3  fix(hanzihome): count review evidence exactly
0d1d2b0c61f6a025285ff57de5f74db40219073a  feat(hanzihome): expose exact attempt count query
35db89751b27b992df77d61c3deacfe1a1c1d144  feat(hanzihome): fetch exact practice attempt count
40fbef0aeae30d215527eafe8e23288ad7612721  refactor(hanzihome): key practice evidence projections by owner
a5a21b5f2f598ee9291c10656aa6392d67fc019f  fix(home): count all review attempts for today
93f53bb98b7ee14a6ad856d21945dcd7eddbbc12  test(hanzihome): cover exact practice evidence count
cd27c1a12c0777045f95b2e0d87f22ffb3bcf267  fix(home): refresh review evidence when dashboard mounts
```

No migration, production row write, dependency change, or `main` mutation occurred in this hardening. The final Phase 1 source gate must include the updated practice-attempt route test and a fresh `npm run check`.

## Checkpoint P1-03 — Source and migration closeout for audit

Status: `AUDIT_PENDING`
Date: 2026-08-20

### Applied live migrations

Target: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`.

The remote migration history had unrelated historical drift, so `supabase db push` was not safe: it could have applied migrations outside Phase 1. With explicit user approval, each Phase 1 file was therefore applied directly through the linked project and then recorded using `supabase migration repair --status applied`.

- `20260820113000_consolidate_hanzihome_review_attempt_evidence.sql` is applied and recorded remotely.
  - Preflight found 57 valid legacy review-history items and zero practice/review attempts.
  - Postflight found 57 `surface = 'review'` immutable evidence rows, zero non-review attempt changes, and unchanged legacy review-history count.
  - Authenticated grants are now only `SELECT` and `INSERT`; own-row RLS has separate `SELECT` and `INSERT` policies with no `FOR ALL`, `UPDATE`, or `DELETE` path.
- `20260820123000_retire_reader_progress_legacy_fields.sql` is applied and recorded remotely.
  - The three deprecated Reader columns are absent.
  - `completed`, `answers`, and `revision` remain present; six existing rows, zero completed rows, and zero non-empty answers were preserved.
  - The seven-argument compatibility RPC remains and is `SECURITY INVOKER`; its deprecated display/summary parameters are inert.

### Source gate and generated types

- The targeted Phase 1 suite passed: 13 files / 58 tests.
- The final `npm run check` passed: 170 test files / 754 tests, format, audit and production build included.
- `src/types/supabase.generated.ts` now removes only the three retired Reader fields from table and RPC return contracts.
- A full remote generated-type comparison remains intentionally red because the live project also exposes unrelated AI tables/functions absent from the checked-in generated file. The unscoped generator output would add 576 unrelated lines. That live-schema drift is an audit item; it was not folded into this remediation batch.

### Advisor result and remaining audit

Supabase advisors still report existing GraphQL exposure and SECURITY DEFINER/RLS-performance findings. The two P1 tables are flagged only for authenticated `SELECT` GraphQL visibility, which is the intentional user-owned read contract; no P1 write privilege or mutable-attempt policy warning appeared.

The following validation remains `AUDIT_PENDING`, not release-complete evidence:

1. browser review online/offline/retry/idempotency and A -> logout -> B ownership smoke;
2. explicit Reader completion, final-TTS non-completion, and Reader source/range round trip;
3. Dictionary casual lookup versus explicit Save-to-SRS;
4. Daily Reading V1 -> V2 device-owned migration, guest local practice, and authenticated attempt persistence;
5. after user merge/deploy, deployed Shadowing microphone/header smoke;
6. reconcile the broader remote generated-type/schema drift before claiming the repository-wide generated contract is fully current.

No dependency change, merge/rebase/force-push, push, or write to `main` occurred in this checkpoint.
