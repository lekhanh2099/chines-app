# HanziHome Integrity Remediation — Execution Checkpoints

> **Historical migration note (2026-08-21):** The individual migration IDs and
> paths recorded below are historical evidence. They are superseded by
> `supabase/migrations/20260820163000_hanzihome_remote_schema_baseline.sql`;
> do not rerun or repair the individual migrations.

Branch: `refactor/hanzihome-integrity-remediation`  
Master plan: `docs/refactor/hanzihome-integrity-remediation-plan.md`  
Base `main`: `864037d31376bbff3854e8198695be6259a969e4`  
Plan baseline commit: `a17e7da0c189979d3b54dccf56769ff2dfd8c5fe`

This file is the append-only execution ledger for the remediation plan. Every implementation batch must update this file with the exact scope, files changed, checks actually run, unresolved verification, and next checkpoint. A task is not marked `DONE` merely because source was edited.

## Phase 0 status

| Task                                           | Status                 | Current note                                                                                                                                                                                                                                          |
| ---------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 Authenticated client-state isolation     | `IN_PROGRESS`          | Source boundary is hardened: one browser Supabase client, owner-scoped sensitive caches/persistence, QueryClient rotation, and client-subtree remount on actual auth-owner transitions. Full A→B browser regression + `npm run check` still required. |
| P0-02 Shadowing microphone policy              | `IN_PROGRESS`          | Source header is `microphone=(self)`; deployed browser/header + real recorder verification still required.                                                                                                                                            |
| P0-03 Canonical Dictionary write protection    | `BLOCKED_CONFIRMATION` | Source/BFF cutover and migration handoff are prepared. The user will perform the live migration; this agent has not mutated RLS/grants or production data.                                                                                            |
| P0-04 Review Queue due semantics               | `IN_PROGRESS`          | Due repository enforces `due_at <= now` with a bounded result set; deterministic tests are authored but not executable in the current connector-only environment.                                                                                     |
| P0-05 Learning-state sync drain race           | `IN_PROGRESS`          | Owner-scoped stable drain + compare-and-replace generation guards are implemented; regression tests are authored but not executable here.                                                                                                             |
| P0-06 Fail-closed authoritative learning state | `IN_PROGRESS`          | Invalid remote state produces a typed failure and blocks automatic overwrite; regression tests are authored but not executable here.                                                                                                                  |

## Checkpoint 001 — Phase 0 source trace

Status: `IN_PROGRESS`  
Started: 2026-08-19

### Verified current behavior

- Locale root keeps one browser `QueryClient` alive across login/app SPA transitions.
- Header resolves the Supabase session independently and does not subscribe to auth changes.
- Logout signs out and navigates but does not evict/cancel user-owned Query state.
- Notes and Dictionary personal payloads use user-agnostic Query keys.
- HanziHome learning-state Query, IndexedDB records, pending mutation IDs, sync runtime, write chain, and sync UI state are global rather than owner-scoped.
- Learning-state sync can leave a newer mutation pending when it arrives during an in-flight request.
- Global `Permissions-Policy` denies microphone while Shadowing requests audio capture.
- Learning Loop list returns all rows ordered by `due_at`, including future scheduled rows.
- Learning-state API converts an incompatible authoritative row into a complete empty state.

### Authoritative owner selected

- Supabase browser auth session: one app-level client-session provider colocated with the Query provider.
- Remote cached user state: TanStack Query, partitioned by authenticated `userId` where the payload is user-owned.
- Learning-state browser persistence: owner-scoped IndexedDB record IDs and validated `ownerUserId`.
- Learning-state retry/in-flight state: owner-scoped runtime maps; one app-level sync agent remains the retry listener owner.

### Batch scope now active

1. P0-01 Query/auth boundary + Notes/Dictionary/Learning State user scoping.
2. P0-05 owner-scoped stable sync drain because it modifies the same local-first runtime.

### Explicitly not touched in this checkpoint

- No DB schema/RLS/grant/function mutation.
- No merge/rebase into `main`.
- No Daily Reading storage ownership decision.
- No Learning Overview/Progress UI.

### Verification available in this environment

Repository source can be fetched and mutated through the GitHub connector. The execution environment cannot resolve `github.com` for a local clone, so npm/Vitest/typecheck/build cannot be executed locally here. Deterministic tests will still be added/updated in source, and branch CI/status will be inspected where available. Full `npm run check` must not be claimed unless it actually runs.

## Checkpoint 002 — Phase 0 source implementation closure

Status: `IN_PROGRESS`  
Date: 2026-08-20

### P0-01 — Authenticated client-state isolation implemented

- `QueryProvider` now owns the browser Supabase session boundary and replaces/clears the QueryClient when authenticated ownership changes.
- Header/Profile logout consume the same session owner instead of creating parallel session readers.
- Notes personal queries and Dictionary personal-detail/list queries are owner-scoped.
- Learning-state Query keys, IndexedDB records, pending mutation IDs, write chains, in-flight/cooldown runtime, and sync UI state are owner-scoped.
- Legacy singleton learning-state records are discarded instead of being assigned to the next logged-in user.
- Reader current/daily/personal progress now includes authenticated owner in local state identity and Query keys.
- Reader state GET/PUT requests carry `X-HanziHome-Owner-Id`; server routes reject a request if that owner no longer matches the cookie-authenticated session.
- Dictionary SRS BFF uses the same expected-owner guard so an in-flight A interaction cannot silently become a B write after a session transition.
- HanziHome editor-role capability query is scoped by authenticated owner.
- Learning Loop workspace query is owner-scoped. Remaining legacy Query-key forms are invalidation roots only; the global QueryClient is still replaced on auth transition as the universal fallback boundary.

### P0-02 — Shadowing microphone source fix implemented

`src/lib/supabase/middleware.ts` now emits:

```http
Permissions-Policy: camera=(), microphone=(self), geolocation=()
```

The microphone capability remains same-origin only; camera and geolocation stay denied. Deployed-header and real `getUserMedia` verification are still required before this task may be marked `DONE`.

### P0-03 — Shared Dictionary browser authority removed in source

- Added a server-only Supabase authority client.
- Added a server-only Dictionary persistence module for canonical/legacy cache writes and user SRS persistence.
- Added `/api/dictionary/srs` as the browser save boundary.
- Browser save callers now send only word identity + user-owned context/note fields. Browser meaning/pinyin/AI analysis is not accepted as canonical write input.
- Inspector casual lookup no longer creates user progress merely to track a lookup.
- AI/basic/deep/editor lookup persistence writes shared cache through server authority.
- Dictionary save carries expected authenticated owner to prevent account-switch write races.
- API inventory contains the new internal Dictionary BFF route.

Prepared but NOT applied:

`supabase/migrations/20260819235500_lock_shared_dictionary_writes_to_server.sql`

The migration is intentionally minimal:

1. remove authenticated `dictionary_core` INSERT/UPDATE policies;
2. revoke browser write-like grants on `dictionary_core` while retaining authenticated SELECT;
3. revoke authenticated/public/anon execute on `upsert_legacy_vocabulary_cache` and retain service-role execution only.

A prior draft that rewrote the legacy function was rejected before apply. The final draft does not rewrite its body because the application no longer depends on the RPC for server writes, reducing migration risk.

### Read-only live database evidence collected

Target inspected: Supabase project `pdrzkirlhbkmfpbcsujp` (`chines-app`). No mutation was executed.

Read-only inspection confirmed:

- `dictionary_core` currently still exposes authenticated INSERT/UPDATE through permissive non-null-auth policies;
- authenticated currently has table write privileges on `dictionary_core`;
- `upsert_legacy_vocabulary_cache` is SECURITY DEFINER and currently executable by authenticated;
- current production migration history does not include the prepared Phase 0 lock migration;
- live `vocabularies` schema was checked before finalizing the migration draft, preventing an invalid/nonexistent-column write from entering the migration.

### P0-04 — Due queue implementation

- Added a dedicated Learning Loop due-list repository.
- Due reads require `due_at <= server now`.
- Results are ordered by `due_at` and bounded (default 50, max 100).
- API GET uses the due repository instead of the legacy all-items list.
- Deterministic tests assert the due predicate and bound.

### P0-05 — Stable learning-state drain

- Synchronization runtime is owner-scoped.
- Concurrent consumers share the same owner's in-flight worker.
- A newer mutation arriving while M1 is in flight is retained and drained without waiting for focus/reconnect/a third mutation.
- Queue clear remains conditional on the exact matching mutation revision.
- Regression tests cover concurrent dedupe, newer-mutation preservation/drain, failure retry, and conflict rebase.

### P0-06 — Authoritative state now fails closed

- Invalid stored remote learning state is no longer normalized to `emptyLearningState`.
- GET/PUT/conflict reload return `LEARNING_STATE_INVALID` instead of treating corrupt/forward-incompatible data as empty truth.
- Automatic conflict save is therefore blocked rather than erasing unrelated valid remote branches.
- Tests cover invalid authoritative state and stale-version conflict behavior.

### Tests/checks authored or updated

Targeted regression coverage was added/updated for:

- learning-state API owner/version/corruption semantics;
- learning-state local-first owner isolation + stable drain;
- Learning Loop due repository and route behavior;
- Reader bootstrap/progress expected-owner guards;
- Dictionary SRS trust boundary;
- basic/deep/general lookup server authority;
- AI vocabulary canonical persistence authority.

### Checks actually run in this environment

- GitHub base→branch compare: branch is ahead of the original `main` base and not behind it.
- GitHub combined commit status inspection: no status contexts were published for the inspected branch head.
- GitHub workflow-run inspection: no PR-triggered workflow run was available for the inspected branch head.
- Supabase read-only policy/grant/function/schema/migration inspection as documented above.

Not run and therefore NOT claimed:

- `npm run typecheck`
- `npm run test:run`
- `npm run check`
- production/deployed browser microphone test
- A→logout→B end-to-end browser account-switch regression
- any live DB migration

Reason: the available execution runtime cannot resolve/checkout GitHub locally, while the GitHub connector supports source reads/writes but not npm execution.

### Phase 0 gates remaining before true DONE

1. Run the repository verification gate (`npm run check`, or at minimum targeted tests + typecheck before the full gate) in a normal checkout/CI environment.
2. Verify the deployed `Permissions-Policy` response and Shadowing microphone flow in a real browser.
3. Obtain explicit authorization for the exact Supabase target before applying `20260819235500_lock_shared_dictionary_writes_to_server.sql`.
4. After an approved DB apply: regenerate/check Supabase types if affected, run security/performance advisors, verify authenticated shared reads still work and authenticated browser writes/RPC execution fail as intended.

Until those gates are satisfied, source work is implementation-complete but the corresponding tasks remain `IN_PROGRESS` / `BLOCKED_CONFIRMATION` rather than being mislabeled `DONE`.

### Next checkpoint

`Checkpoint 003 — Phase 0 verification + authorized DB lock closeout`

No Phase 1 implementation should start before this closeout is recorded.

## Checkpoint 002A — Source closure hardening

Status: `IN_PROGRESS`  
Date: 2026-08-20

Additional review found two areas worth closing before asking for the production authorization gate.

### Deterministic Query owner transition coverage

- Extracted Query cache rotation into `src/lib/query/auth-owner-transition.ts`.
- `QueryProvider` now delegates A→logout→B cache rotation to this pure owner transition helper instead of embedding the logic in the provider effect.
- Added `auth-owner-transition.test.ts` covering initial resolution, same-owner stability, A→logout cache clearing, and logout→B creation of a fresh empty QueryClient.
- This is still authored-not-executed coverage; it does not replace the required real browser account-switch regression.

### Canonical Dictionary provenance tightened

The source closure now distinguishes canonical shared content from learner-configured AI output:

- fixed `/api/lookup/basic` lexicography output may be canonicalized by server authority;
- deep/general/generate-vocab/editor AI output that can use learner model/prompt settings remains request-local and cannot overwrite shared dictionary rows;
- Save-to-SRS accepts word identity plus user-owned context/note fields and resolves canonical data on the server;
- basic selections longer than 32 characters are treated as transient Reader/selection content and cannot create shared dictionary/cache headwords;
- regression tests were corrected to assert transient behavior for learner-custom/deep output rather than incorrectly expecting those flows to persist shared canonical data.

This closes the remaining poisoning path where moving a write to service-role authority alone would still have allowed ordinary learner-configured prompt output to modify shared canonical content.

### Branch verification after hardening

Latest base→branch compare observed:

```text
base:      864037d31376bbff3854e8198695be6259a969e4
status:    ahead
behind_by: 0
```

No merge/rebase into `main` and no Supabase mutation occurred in this checkpoint.

### Next checkpoint unchanged

`Checkpoint 003 — Phase 0 verification + authorized DB lock closeout`

Production Dictionary authorization remains the only Phase 0 source-adjacent action that is deliberately blocked on explicit target confirmation.

## Checkpoint 003 — Phase 0 source handoff before user migration

Status: `IN_PROGRESS`  
Date: 2026-08-20

This checkpoint is the final source-review pass before handing the prepared Dictionary authorization migration to the user. It does **not** mark Phase 0 `DONE`: executable repository/browser verification and the live authorization cutover are still outstanding.

### Repository contracts re-read before this pass

The implementation was re-checked against the current branch copies of:

- root `AGENTS.md`;
- `src/features/hanzihome/AGENTS.md`;
- `.agents/skills/frontend-feature-workflow/SKILL.md`;
- `.codex/skills/hanzihome-test-review/SKILL.md`;
- `.codex/skills/hanzihome-supabase-migration/SKILL.md`;
- `.codex/skills/hanzihome-supabase-migration/references/migration-review.md`;
- `docs/architecture/frontend-structure.md`;
- `docs/agent/risk-confirmation.md`.

The pass therefore keeps the DB/RLS/grant mutation as a separate explicit handoff rather than using source-work authorization as production authorization.

### P0-01 — auth owner boundary hardening after second review

Two additional gaps were closed:

1. `src/lib/supabase/client.ts` now returns one browser Supabase client per browser runtime instead of constructing parallel clients at call sites. Login, logout, Header and feature code therefore observe one auth/session event source.
2. Query cache rotation alone does not reset ordinary local React state. `QueryProvider` now increments an owner epoch only on an actual authenticated-owner change and keys the Query provider subtree by that epoch. A→logout→B therefore gets both a fresh QueryClient and a remounted client subtree, without forcing an extra remount on the initial session resolution.

A deterministic singleton-client regression test was added at `src/lib/supabase/client.test.ts`. It is authored but not executed in the current environment.

The source still contains a small number of legacy unscoped Query-key forms in older surfaces. They are not accepted as a primary ownership contract; owner transition now clears/replaces the QueryClient and remounts the subtree as the universal isolation fallback. Those remaining key-callsite cleanups should be handled as narrow follow-up refactors with executable consumer tests rather than by introducing a second global auth owner or a broad blind replacement.

### P0-03 — SRS preservation fix

Second-pass review of the new server SRS path found a regression risk: a plain repeated Save-to-SRS could upsert `null` into optional personal note/context fields that had been populated by an earlier richer save.

`saveCanonicalDictionaryEntryToSrsAsServer` now reads the existing owner row and preserves:

- `context_sentence`;
- `context_translation`;
- `personal_note`;
- `personal_note_mode`

when the new request omits those fields. Explicitly supplied values still replace the corresponding field, and an explicitly supplied blank personal note clears that note. Existing proficiency/scheduling columns are not rewritten by this path.

### Dictionary migration runbook corrected

The migration runbook now records the actual provenance contract rather than the earlier over-broad wording:

```text
fixed basic lookup
  -> eligible for canonicalization through server authority

existing canonical / trusted server-read legacy
  -> eligible source for SRS canonical identity

learner-custom deep/general/editor/generate-vocab output
  -> request-local only; must not mutate shared canonical rows
```

The runbook also records that a repeated SRS save must preserve omitted personal metadata.

### Read-only production preflight repeated

Target inspected: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`.

No DDL, RLS, grant, function or row mutation was executed.

Observed state immediately before migration handoff:

- `dictionary_core`: 42 rows;
- `vocabularies`: 42 rows;
- `user_vocab_progress`: 26 rows;
- `user_vocabularies`: 26 rows;
- `unmatched_legacy = 0` between `vocabularies.hanzi` and `dictionary_core.lookup_key`;
- `pinyin_mismatch = 0` for matching legacy/canonical rows in the current dataset;
- authenticated still has broad `dictionary_core` table privileges, including INSERT/UPDATE;
- INSERT and UPDATE RLS policies still permit any non-null authenticated `auth.uid()`;
- `upsert_legacy_vocabulary_cache` remains SECURITY DEFINER and executable by authenticated;
- latest production migration observed is `20260818122000_add_ai_memory_retrieval_pipeline`; the prepared `20260819235500` lock migration is not applied.

### Existing canonical data residue discovered

Two existing `dictionary_core` rows have headwords longer than the new 32-character canonical boundary: one is 71 characters and one is 175 characters. Inspection shows historical sentence/dialogue concatenation pollution, not normal dictionary entries.

This is deliberately **not** folded into the Phase 0 authorization migration:

- deleting/reassigning those rows is production-data mutation;
- downstream user/cache relationships must be checked before cleanup;
- source now prevents this class of new long-selection canonicalization.

A separate cleanup decision/migration can handle those rows later if their dependency graph proves safe.

### Branch state at this checkpoint

A fresh `main` → working-branch comparison observed:

```text
main base SHA: 864037d31376bbff3854e8198695be6259a969e4
branch:        refactor/hanzihome-integrity-remediation
status:        ahead
behind_by:     0
```

No merge, rebase, force-push or write to `main` was performed.

### Checks actually run in this checkpoint

- repository contracts/skills re-read as listed above;
- GitHub source/caller review for auth, Dictionary, Learning State, Reader and Learning Loop paths;
- `git ls-remote` attempted in the shell and failed because the execution environment cannot resolve `github.com`;
- GitHub base→branch compare;
- Supabase read-only policy/grant/function/migration-history/row-count/integrity queries.

Not run and therefore not claimed:

- `npm run typecheck`;
- `npm run test:run`;
- `npm run check`;
- A→logout→B browser E2E;
- deployed microphone/getUserMedia smoke test;
- the Dictionary authorization migration;
- post-migration advisors and write-denial smoke tests.

### Handoff state

Source work for the six Phase 0 findings is now at the migration/verification boundary. The prepared live migration remains:

`supabase/migrations/20260819235500_lock_shared_dictionary_writes_to_server.sql`

The detailed user migration procedure and postflight checks are in:

`docs/refactor/hanzihome-phase0-dictionary-lock-runbook.md`

After the user applies the migration, the next checkpoint is strictly verification/closeout: re-read policies/grants/migration state, run security/performance advisors, verify browser shared writes and legacy RPC execution are denied, verify normal Dictionary read/basic canonicalization/SRS flows still work, then record the executable repository/browser gate results before changing any Phase 0 task to `DONE`.

## Checkpoint 003A — Local release-gate review and lint blocker closure

Status: `IN_PROGRESS`  
Date: 2026-08-20

### Independent local review evidence supplied by Codex

The user's local Codex review reported a clean worktree before this follow-up and did not apply or edit the migration. It verified the prepared migration remains authorization-only and that browser runtime no longer owns shared Dictionary writes.

Checks reported as actually executed in the local checkout:

```text
npm run test:run -- src/app/api/dictionary/srs/route.test.ts src/app/api/lookup/basic/route.test.ts
-> 12/12 passed

git diff --check
-> passed

npm run check
-> failed in lint at src/features/hanzihome/reader/runtime/useReaderProgressState.ts
   because setSaveError("") was called synchronously in the stateIdentity effect
```

These are recorded as user-supplied local execution evidence, not as checks executed by the connector environment.

### Lint blocker root cause and fix

The failing effect was being used to clear `saveError` whenever the authenticated Reader progress identity changed. That mixed identity derivation with a synchronous React state reset and violated the repository rule that effects must represent real external-system synchronization rather than state repair.

The fix keeps one owner for the value without an effect-driven reset:

- `saveError` is now stored together with the `stateIdentity` that produced it;
- the currently rendered error is derived only when the stored identity matches the active identity;
- `setSaveError` captures the active identity, so a late async completion from account/document A cannot surface its error under account/document B;
- the `stateIdentity` effect now resets only mutable refs used by the autosave bridge and performs no React state write.

Source commit:

`bd3263a5755be6f021c5e770dd3aae190a61f04b` — `fix(reader): scope save error by progress identity`

This is intentionally a local Reader state-ownership fix; it does not alter persisted Reader data, API payloads, Dictionary behavior, Supabase schema, RLS, grants or migration contents.

### Branch state after the fix

Fresh GitHub comparison:

```text
main base SHA: 864037d31376bbff3854e8198695be6259a969e4
status:        ahead
behind_by:     0
```

No merge/rebase into `main` and no Supabase mutation occurred.

### Gate still required before migration

The prior `npm run check` result is no longer sufficient because the source changed to address its lint blocker. The local checkout must rerun `npm run check` on the new branch head.

Only after that gate passes should the migration preflight be re-read immediately against the exact live target and the user perform the prepared authorization migration. Phase 0 remains `IN_PROGRESS` / `BLOCKED_CONFIRMATION` until those checks and post-migration verification are recorded.

## Checkpoint 003B — Source-standards blocker closure

Status: `IN_PROGRESS`  
Date: 2026-08-20

### Updated local evidence supplied by Codex

The user's local Codex rerun reported:

```text
Dictionary boundary tests -> 12/12 passed
git diff --check          -> passed
npm run lint              -> passed
npm run check             -> stopped at source:check before tests/build
```

The remaining source-check failures were four type assertions introduced in Phase 0 source/test code:

- `src/features/hanzihome/reader/learning-loop-repository.test.ts` — two `as never` context casts;
- `src/lib/query/auth-owner-transition.ts` — two `as const` literal casts.

The same local review reconfirmed that `20260819235500_lock_shared_dictionary_writes_to_server.sql` had not changed since its reviewed migration commit and that the Dictionary browser/server authority split still passed review.

### Contract decision: fix the source, do not allowlist it

The root repository contract explicitly prohibits owned application-source type assertions used to force a value through the compiler. `scripts/check-source-standards.mjs` currently has an empty assertion exception budget, so adding an allowlist solely to make the gate green would weaken the repository contract instead of fixing the source.

The four assertions were therefore removed without changing the migration or persistence semantics.

### Fixes

1. `src/lib/query/auth-owner-transition.ts`
   - replaced `false as const` / `true as const` with an explicit function return contract;
   - runtime behavior is unchanged: initial/same-owner transitions retain the client, owner changes clear/cancel the old cache and return a new client.

2. `src/features/hanzihome/reader/learning-loop-repository.test.ts`
   - removed both `as never` casts;
   - the test now passes a naturally typed minimal query dependency.

3. `src/features/hanzihome/reader/learning-loop-repository.ts`
   - narrowed the repository parameter to the exact query capability it consumes (`from -> select -> eq/lte/order/limit`) instead of coupling the function to the complete authenticated Supabase client type;
   - this is dependency narrowing for testability only; route authorization, user-id filtering, due predicate, ordering, limit and returned schema remain unchanged.

Source commits in this closure:

```text
bb00630aecd054db40a0f1c6f8f66a41661c8a93  fix(source): remove auth transition assertions
22e3a970824f233452e8fdc85159c0430c4430bc  refactor(learning-loop): narrow due query dependency
c0548f3a7561556e69e480f66df6aa719849e452  test(learning-loop): remove unsafe context assertions
25e9ef00d6e84fb6ab014b1389cfce4964fbdf3a  refactor(learning-loop): model due query stages
```

### Branch / mutation state

Fresh GitHub comparison after the source fixes:

```text
main base SHA: 864037d31376bbff3854e8198695be6259a969e4
status:        ahead
behind_by:     0
```

No merge/rebase into `main`, no migration edit, and no Supabase mutation occurred.

### Gate still required

Because source changed to remove the four source-standards failures, `npm run check` must be rerun locally on the new branch head. Do not apply the production authorization migration on the basis of the previous failed gate.

If the new full gate passes, the next action is immediately the migration runbook preflight against the exact live target, followed by the user's migration apply and postflight verification. Phase 1 remains blocked until Phase 0 closeout evidence is recorded.

## Checkpoint 003C — Typecheck blocker closure

Status: `IN_PROGRESS`  
Date: 2026-08-20

### Local gate evidence supplied by the user

After the source-standards fixes, the user's local `npm run check` progressed through route type generation and failed in TypeScript with three Phase 0 source errors:

```text
src/app/api/hanzihome/learning-loop/route.ts
TS2589: Type instantiation is excessively deep at listDueLearningLoopItems(auth.context)

src/features/dictionary/server/dictionary-persistence.server.ts
TS2345: raw generated dictionary_core.data Json was not assignable to the validated dictionary domain shape expected by mapDictionaryEntryToVocabData

src/features/hanzihome/local/learning-state-local-store.ts
TS2322: replacement status literal widened to string instead of the pending/syncing/failed mutation-status union
```

This is recorded as user-supplied local execution evidence. The connector environment did not execute TypeScript or the full gate.

### Root causes and fixes

1. Learning Loop repository boundary
   - The previous assertion-removal pass replaced the full authenticated context with a handcrafted structural Supabase query interface. Comparing the generated `SupabaseClient<Database>` against that staged structural interface caused TypeScript to recursively instantiate the large PostgREST generic surface at the route call site.
   - `listDueLearningLoopItems` now accepts the authoritative `AuthenticatedRouteContext` again, so the production boundary uses the existing owner type directly.
   - Query timing/filter/limit planning is separated behind a small executor contract for deterministic tests. Tests exercise the exact `userId`, `dueBefore`, and clamped `limit` passed to the executor without casting a fake Supabase client.
   - The real repository still owns the Supabase query and still applies `user_id`, `due_at <= now`, ascending due order, and the bounded limit.

2. Dictionary canonical row type
   - `dictionary-persistence.server.ts` had typed `DictionaryEntry` as the raw generated `Tables<"dictionary_core">`, whose JSONB `data` field is only `Json`.
   - The only valid callers already obtain canonical entries through `getDictionaryEntryByHeadword` / `upsertDictionaryEntry`, which parse the row through `DbDictionaryCoreSchema` before returning it.
   - The server persistence boundary now therefore accepts `DbDictionaryCore`, matching the validated domain contract required by `mapDictionaryEntryToVocabData` instead of weakening that mapper or asserting raw JSON into the shape.

3. Atomic IndexedDB replacement inference
   - `replaceInStoreIf` allowed the replacement callback to participate in generic inference, which widened literal fields such as `status: "failed"` to `string` before checking against the Zod-owned mutation shape.
   - The schema is now the inference owner. Callback input/output use `NoInfer<T>`, so replacement functions must return the schema-derived type without an assertion or duplicated caller annotation.
   - Runtime IndexedDB behavior and compare-and-replace transaction semantics are unchanged.

### Source commits in this closure

```text
479f42bae3ba7741a1c069d69f4a81f7486df131  fix(hanzihome): simplify due queue type boundary
6c6ed4f8cbfe77d71232be8392b021f031cbd5b8  test(hanzihome): cover due queue request contract
887da7907b505a6a046ebf7de3a8c54668ee6af4  fix(dictionary): use validated canonical entry type
aa912a746c0e6353cb65c357f697053a1b297eb4  fix(hanzihome): infer atomic replacements from schema
```

### Migration / branch state

The prepared Dictionary migration remains byte-for-byte unchanged in this batch. No Supabase schema/RLS/grant/function/data mutation was executed.

Fresh GitHub comparison after these fixes:

```text
main base SHA: 864037d31376bbff3854e8198695be6259a969e4
status:        ahead
behind_by:     0
```

No merge, rebase, force-push, or write to `main` occurred.

### Gate still required

The three TypeScript failures were fixed in source but have not been executed in this connector environment. The local checkout must rerun `npm run check` on the new branch head.

If that full gate passes, stop source edits and perform the live read-only Dictionary preflight immediately before the user applies `20260819235500_lock_shared_dictionary_writes_to_server.sql`. Phase 1 remains blocked until migration postflight and Phase 0 verification are recorded.

## Checkpoint 003D — Failed-mutation literal type closure

Status: `IN_PROGRESS`  
Date: 2026-08-20

### Local gate evidence supplied by the user

The next local typecheck rerun cleared the prior Learning Loop and Dictionary errors. One TypeScript error remained:

```text
src/features/hanzihome/local/learning-state-local-store.ts:270
TS2322: status: "failed" widened to string instead of "failed" | "pending" | "syncing"
```

This disproved the previous `NoInfer<T>` fix for this call shape.

### Root cause and correction

`NoInfer<T>` prevented the replacement callback from influencing generic inference, but it also removed the contextual return typing needed by this assigned callback expression. The object literal therefore widened `status: "failed"` before the return value was checked against the schema-derived mutation shape.

The helper was restored to its simpler generic contract:

```text
matches: (value: T) => boolean
replace: (value: T) => T
```

For the only assigned replacement result that exhibited widening, the callback now declares its real domain return type directly:

```text
(current): PendingLearningStateMutation => ({ ... })
```

This is an ordinary TypeScript function return annotation, not an assertion, suppression, allowlist, schema widening, or runtime coercion. The Zod-derived `PendingLearningStateMutation` remains the authoritative domain type. IndexedDB transaction and compare-and-replace behavior are unchanged.

Source commits:

```text
9a51b75602ab8e6132d794537d2f1662cbf61c39  fix(hanzihome): restore atomic replacement generic contract
211cecf0e57114418a29607cb5e597a39fc791a1  fix(hanzihome): type failed mutation replacement explicitly
```

### Migration / safety state

No Dictionary migration edit, no Supabase mutation, no dependency change, and no merge/rebase into `main` occurred in this correction.

### Gate still required

The connector cannot execute TypeScript locally. Rerun `npm run check` on the new branch head. If the full gate passes, stop source edits and proceed to the live read-only Dictionary preflight before the user applies `20260819235500_lock_shared_dictionary_writes_to_server.sql`.
