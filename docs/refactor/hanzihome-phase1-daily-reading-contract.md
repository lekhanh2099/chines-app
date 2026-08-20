# HanziHome Phase 1 — Daily Reading Ownership and V2 Cutover Contract

Status: P1-07 source closure  
Branch: `refactor/hanzihome-integrity-remediation`  
Date: 2026-08-20

## Purpose

Make Daily Reading V2 the single active generated-reading runtime while defining persistence ownership and anonymous/authenticated practice behavior explicitly.

## Authoritative runtime

Generated Daily Reading now resolves through one active client path:

```text
GeneratedDailyReadingArea
  -> DailyReadingV2Library / DailyReadingV2View
  -> daily-reading-v2-client
  -> daily-reading-v2-storage.client
```

The legacy `GeneratedDailyReading.tsx` and `daily-reading-client.ts` runtime path is retired. Legacy generation/source server routes are kept as compatibility entrypoints for now; they are not an alternative browser persistence owner.

## Persistence ownership

Generated Daily Reading archive, capture history, enrichment history, and Daily Reading V2 settings are **device-owned browser state**.

```text
article/archive/settings
  -> versioned Daily Reading V2 localStorage schema
  -> current browser/device
  -> not assigned to the currently authenticated user
```

This is intentional. Account switching in the same browser must not relabel device-owned Daily Reading articles/settings as another user's cloud data.

User-owned learning data remains separate:

```text
Reader completion/answers       -> Reader-owned user state
submitted authenticated attempts -> hanzihome_practice_attempts
course mastery/display settings -> user_learning_state
```

## V1 -> V2 compatibility policy

V2 is the only active generated-reading UI/runtime owner after this cutover.

The V2 storage adapter may read the V1 localStorage keys only as migration/recovery input when a V2 ledger/settings record does not yet exist. Migration uses the explicit V1 -> V2 adapter and writes a validated V2 record.

Rules:

- no new runtime writes to the V1 generated-reading ledger;
- no V1/V2 dual-write period after cutover;
- V1 raw browser data is not automatically deleted during migration, so a forward-fix can still recover from a bad V2 migration;
- once V2 exists, UI, scheduler, capture, enrichment, management, and settings read V2 only;
- legacy storage/schema helpers may remain only where tests or migration compatibility require them; they are not an active product owner.

Forward-fix is the rollback strategy. Do not silently switch the active UI back to V1 if V2 data is malformed; surface the V2 storage error and repair/migrate forward.

## Anonymous vs authenticated practice

Static Daily Reading content remains readable/interactive without authentication.

For an anonymous user:

- question answers and translation drafts/results are session-local React state;
- no remote practice-attempt POST is attempted;
- the UI states that the result is local-only / not synced;
- a 401 rejection is therefore not used as normal control flow.

For an authenticated user:

- current answer/draft UI state remains local to the current interaction;
- submitted attempt evidence may be appended to `hanzihome_practice_attempts`;
- save failures remain observable and do not erase the local answer.

Generated V2 question support currently reveals source-grounded answers rather than creating a separate current-answer persistence owner.

## Invariants

1. Daily Reading V2 is the only active generated-reading browser runtime.
2. Device-owned Daily Reading archive/settings are not silently converted into account-owned cloud data.
3. V1 data is compatibility input, not a competing authoritative store.
4. Anonymous interaction never creates an unhandled authenticated persistence request.
5. Current answer UI state and immutable submitted attempt evidence remain distinct owners.
6. Daily Reading does not create a second course-mastery or Reader-progress owner.

## Verification

Before P1-07 is release-complete:

1. Run the V2 migration/storage/client/settings/scheduler tests.
2. Run `npm run check`.
3. In a browser with existing V1 local data and no V2 ledger, verify a single migration to V2 and continued V2 reads after reload.
4. Verify a newly captured article appears only through the V2 library path.
5. Verify account A -> logout -> B does not relabel/delete the device-owned Daily Reading library/settings.
6. As an anonymous user, answer a static Daily Reading question and perform a translation check: local UI works and no practice-attempt request is required.
7. As an authenticated user, submit the same practice flow and verify attempt persistence succeeds or reports a visible save error.

No Supabase migration is required for P1-07 itself.
