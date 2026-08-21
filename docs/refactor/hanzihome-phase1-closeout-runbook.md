# HanziHome Phase 1 — Closeout Runbook

> **Historical migration note (2026-08-21):** This is a record of the original
> Phase 1 procedure, not a current apply runbook. Its individual migration
> files are superseded by
> `supabase/migrations/20260820163000_hanzihome_remote_schema_baseline.sql`.

Branch: `refactor/hanzihome-integrity-remediation`  
Target DB: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`  
Date: 2026-08-20

This runbook is the one-shot handoff for closing Phase 1. Source is prepared; the two remaining database migrations are intentionally not applied by the coding agent.

## 0. Source gate first

Update the local checkout to the final branch head and run:

```bash
npm run test:run -- \
  src/features/hanzihome/local/learning-state-conflict-merge.test.ts \
  src/features/hanzihome/local/learning-state-local-first.test.ts \
  src/features/hanzihome/local/learning-state-local-first.race.test.ts \
  src/features/hanzihome/local/review-attempt-outbox.test.ts \
  src/app/api/hanzihome/practice/attempts/route.test.ts \
  src/features/hanzihome/reader/reader-state-repository.practice-attempt.test.ts \
  src/features/hanzihome/reader/reader-source-target.test.ts \
  src/app/api/hanzihome/reader/progress/route.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-v2.migration.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-v2-storage.client.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-v2-client.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-v2.settings.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading.scheduler.test.ts

npm run check
```

Do not apply the P1 migrations if the final full gate is red for a Phase 1-owned regression.

## 1. Migration A — immutable review evidence

File:

`supabase/migrations/20260820113000_consolidate_hanzihome_review_attempt_evidence.sql`

### Expected preflight

Latest read-only inspection before handoff:

```text
remote migration history: 20260820113000 absent
practice attempts:         0
review attempts:           0
legacy review_history:     57 items
attempt grants:            SELECT/INSERT/UPDATE/DELETE for authenticated
attempt RLS:               one authenticated FOR ALL own-row policy
```

Immediately before apply, re-check migration history, legacy item shape/count, attempt count/surface constraint, RLS policies, and grants. If the source count is no longer 57 because legitimate app activity changed it, review the delta rather than forcing the old number.

### Apply expectation

The migration must only:

- add `review` to the accepted attempt surfaces;
- replace mutable authenticated attempt policy with own-row SELECT + INSERT policies;
- revoke authenticated UPDATE/DELETE;
- backfill valid legacy review events into immutable `surface = 'review'` rows;
- leave `user_learning_state.review_history` untouched.

### Postflight

Verify:

```text
migration 20260820113000 present in remote history
review surface accepted
legacy review_history item count unchanged
review attempt backfill count matches the validated legacy source count
existing non-review attempts unchanged
authenticated grants contain SELECT + INSERT, not UPDATE/DELETE
RLS contains own-row SELECT + INSERT, not FOR ALL
```

Do not manually clear `review_history` after the migration. It is frozen compatibility history, not the new write owner.

## 2. Migration B — retire Reader legacy progress columns

File:

`supabase/migrations/20260820123000_retire_reader_progress_legacy_fields.sql`

Apply only after Migration A postflight is clean.

### Expected preflight

Previously inspected Reader progress state:

```text
rows:                       6
completed=true:             0
answers non-empty:          0
summary non-empty:          0
show_pinyin non-default:    6
show_meaning non-default:   0
```

Current source writes Reader-owned state directly as `completed + answers + revision`; it no longer uses the legacy display fields. Re-run the read-only row/column/function preflight immediately before apply.

### Apply expectation

The migration must:

- remove `show_pinyin`, `show_meaning`, and `summary_text` from `hanzihome_reader_progress`;
- keep `completed`, `answers`, and `revision` intact;
- keep the old RPC signature only as a temporary deployed-client adapter;
- make the adapter ignore deprecated display/summary arguments and write only Reader-owned state.

### Postflight

Verify:

```text
migration 20260820123000 present in remote history
deprecated columns absent
completed/answers/revision columns present
row count unchanged
completed/answers values unchanged
compatibility RPC exists and executes for an authorized owner path
active app Reader PUT reads/writes completed + answers with optimistic revision
```

Then regenerate/check Supabase generated types using the repository's normal type-generation workflow and commit only the generated-type delta that matches the migrated schema.

## 3. Re-run repository gate after generated types

If generated Supabase types changed, run again:

```bash
npm run check
```

Do not merge while this gate is red.

## 4. Browser smoke matrix

Run against the migrated environment.

### Review evidence

- review one vocab/grammar item while online: exactly one mastery transition and one `review` attempt;
- repeat/retry the same queued attempt: no duplicate evidence row;
- go offline, review an item, reconnect: mastery remains local-first and the queued attempt eventually syncs once;
- A -> logout -> B: A's pending review attempt is never sent as B.

### Reader completion

- open a Reader document without using TTS and mark it complete explicitly;
- playing the final segment alone must not mark it complete;
- reload and confirm explicit completion persists.

### Reader source round trip

- add a Reader selection/Shadowing review source;
- open it from Learning Loop;
- verify the correct document and paragraph are focused;
- for a selection with offsets, verify the originating range is restored/highlight-selected.

### Dictionary ownership

- casual lookup must not create a saved/SRS progress row;
- explicit Save-to-SRS must create/update only the intended user relationship;
- shared canonical Dictionary reads continue to work.

### Daily Reading V2

- with V1 local data and no V2 ledger, open the generated-reading area and verify one migration to V2;
- reload: V2 remains the active library; no V1 UI/runtime path reappears;
- A -> logout -> B on the same browser: generated Daily Reading archive/settings remain because they are intentionally device-owned, not account-owned;
- anonymous static Daily Reading question/translation interaction works locally and does not require a practice-attempt request;
- authenticated question/translation submission persists attempt evidence or surfaces a visible save error.

## 5. Deferred deployed Phase 0 smoke

After the user merges/deploys to `main`, verify the response header and real recorder flow:

```http
Permissions-Policy: camera=(), microphone=(self), geolocation=()
```

Then run Reader Shadowing in the deployed browser, allow microphone access, record/stop, and confirm media tracks are released on stop/unmount.

This deployed microphone check was explicitly deferred by the user and does not require changing the P1 source again unless it fails.

## 6. Merge ownership

The coding agent does not merge/rebase/force-push `main`. The user owns the final merge after the above gates are clean.
