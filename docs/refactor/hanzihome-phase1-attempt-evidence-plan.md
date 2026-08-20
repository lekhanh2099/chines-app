# HanziHome Phase 1 — Review Attempt Evidence Contract

Status: P1-02 source preparation  
Branch: `refactor/hanzihome-integrity-remediation`  
Date: 2026-08-20

## Purpose

Make `hanzihome_practice_attempts` the immutable evidence owner for learner review actions without regressing the local-first mastery flow or silently discarding existing `user_learning_state.review_history` data.

This document is the execution contract for P1-02. It intentionally separates source preparation from live database authorization/data migration.

## Contracts re-read

Before this batch, the following current branch contracts were re-read:

- `AGENTS.md`
- `src/features/hanzihome/AGENTS.md`
- `.agents/skills/frontend-feature-workflow/SKILL.md`
- `.agents/skills/hanzihome-content-editing/SKILL.md`
- `.codex/skills/hanzihome-test-review/SKILL.md`
- `.codex/skills/hanzihome-supabase-migration/SKILL.md`
- `docs/agent/risk-confirmation.md`
- `docs/refactor/hanzihome-integrity-remediation-plan.md`

The ownership invariant remains:

```text
current course mastery  -> user_learning_state.progress
immutable attempt log   -> hanzihome_practice_attempts
review scheduling       -> hanzihome_learning_loop_items
legacy review history   -> compatibility input only during migration
```

## Read-only live preflight

Target inspected: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`.

No mutation was executed during this investigation.

Observed data:

```text
user_learning_state rows with review history: 1
legacy review_history items:                57
  vocab:                                    56
  grammar:                                   1
  radical:                                   0
hanzihome_practice_attempts rows:            0
exact duplicate legacy events:               0
legacy timestamp shape valid:               57 / 57
```

The existing `hanzihome_practice_attempts` contract currently allows surfaces:

```text
reader
dictation
translation
listening
personal-learning
shadowing
```

Authenticated users currently have SELECT/INSERT/UPDATE/DELETE grants and one `FOR ALL` own-row RLS policy. No application caller was found that updates or deletes attempt rows.

## P1-02 decisions

### 1. New review evidence surface

Add one surface value:

```text
review
```

Do not overload `personal-learning`, `direction`, or an unrelated surface to encode review semantics.

A review attempt uses:

```text
surface:    "review"
content_id: `${itemType}:${itemId}`
direction:  null
score:      null
response_ms:null unless a future review UI measures it intentionally
answer: {
  kind: "review",
  itemType: "vocab" | "grammar" | "radical",
  result: "again" | "hard" | "known",
  label?: string
}
```

`score` stays null because `again` / `hard` / `known` are review outcomes, not a validated numeric grading scale.

### 2. Attempt idempotency

The existing attempt primary key is already a UUID. Do not add a second idempotency column.

The API gains an optional `attemptId` UUID. Offline/retry-capable review code will generate one stable UUID per review event and persist it in the local outbox. Replaying the same event therefore targets the same attempt primary key. A duplicate-key retry resolves to the already-created owner row rather than creating a second evidence record.

Existing practice surfaces may continue omitting `attemptId`; their behavior remains unchanged.

### 3. Immutability

`hanzihome_practice_attempts` is immutable evidence. The migration will:

- replace the current `FOR ALL` own-row policy with separate own-row SELECT and INSERT policies;
- revoke authenticated UPDATE and DELETE;
- retain authenticated SELECT and INSERT.

The application already exposes only list/insert repository operations, so this tightens the database to the declared owner contract instead of changing product behavior.

### 4. Legacy review history migration

Backfill all valid existing `user_learning_state.review_history` entries into `hanzihome_practice_attempts` as `surface = 'review'` while preserving each event timestamp in `created_at`.

The migration must validate legacy item shape before inserting and fail closed if unexpected data is present.

The backfill is additive and must not clear or rewrite `review_history` in the same migration.

After application cutover:

- new review actions stop appending to `reviewHistory`;
- the legacy column remains frozen/read-compatible for old rows until a later explicitly authorized removal;
- Home/recent-review projections must move to attempt evidence before new writes stop, so the UI does not become stale.

No dual-write compatibility period is accepted for new review actions because that would preserve two competing history owners.

### 5. Offline behavior

Review mastery remains local-first. Attempt evidence must not become best-effort-only when offline.

The implementation therefore uses an owner-scoped pending review-attempt outbox in the existing HanziHome IndexedDB mutation store. It must have:

- a stable attempt UUID;
- authenticated owner id;
- append-only event payload;
- retry status/error metadata;
- owner-scoped drain;
- idempotent remote replay.

The existing app-level learning sync agent remains the single online/focus listener owner and will trigger both learning-state and review-attempt drains. Do not add a second set of global online/focus listeners.

## Ordered implementation batches

### P1-02A — transport + migration preparation

- Add `review` to the typed attempt-surface contract.
- Add optional stable `attemptId` to the practice-attempt API/repository.
- Make retry of the same `attemptId` idempotent.
- Prepare the timestamped migration for surface expansion, immutable grants/RLS, and legacy backfill.
- Do not route learner review UI to the new surface yet.
- Do not apply the live migration yet.

### P1-02B — owner-scoped review attempt outbox

- Add a typed pending review-attempt mutation record.
- Keep heterogeneous pending mutations parseable without weakening existing learning-state validation.
- Drain review attempts per authenticated owner with stable retry/idempotency semantics.
- Reuse the existing app-level online/focus orchestration.
- Add deterministic offline/retry/account-switch tests.

### P1-02C — review action cutover

- Replace `appendReviewHistory + progress update` call pairs with one review action contract.
- One user action updates current mastery and enqueues one immutable review attempt event.
- Stop appending new `reviewHistory` entries.
- Preserve review scheduling as a separate Learning Loop operation where applicable.

### P1-02D — projections + compatibility closeout

- Move Home recent review activity / reviewed-today count away from `user_learning_state.reviewHistory` to review attempt evidence.
- Keep the legacy field read-compatible but frozen.
- Verify old backfilled events and new events share one projection.

## Live migration gate

The prepared migration is a production schema/RLS/grant/data mutation and must not be applied without explicit confirmation for the exact target.

Before apply, re-run read-only preflight for:

- migration drift;
- attempt count by surface;
- legacy history item count/shape;
- attempt surface constraint;
- attempt RLS policies and authenticated grants.

After apply, verify:

- the new migration appears in migration history;
- `review` is accepted by the surface constraint;
- authenticated SELECT/INSERT remain allowed;
- authenticated UPDATE/DELETE are denied;
- legacy backfill count matches the validated source count;
- existing `review_history` remains unchanged;
- no unrelated attempt row/data is modified.

## Verification tier

Full persisted-state/migration path.

Source preparation requires targeted tests first, then `npm run check`. Live completion additionally requires pre/post migration evidence and browser offline/account-switch review flow verification.
