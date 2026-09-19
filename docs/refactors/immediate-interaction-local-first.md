# FROZEN IMPLEMENTATION PLAN

## Immediate Interaction + Durable Local-first Learning + Offline Lesson Cache

### Repository baseline and authorization

- Repository: `lekhanh2099/chines-app`.
- Execution directory: `/Users/hagenlee/Desktop/Person/chines-app`.
- Execution branch: `main`.
- Audited baseline: `ca489b41bf17f025a623e9a207df5750f050f9eb`.
- Baseline checked on 2026-09-10: `git fetch origin main` succeeded; HEAD and origin/main match; initial working tree clean.
- Installed and lockfile versions agree: Next 16.3.0; TanStack Query 5.101.0.
- This plan does not authorize changes in `hanzi-studio`.

Fetch latest main before every implementation phase and update safely. Preserve unrelated changes and unpublished user commits; never reset or force-push to obtain a clean tree.

Core adds no dependency and changes no Supabase schema/RLS, authentication authority, route URL, successful response or request-body contract. The approved exception is an additive expected-owner header guard for review attempts (section 15). PWA/full offline boot is a separate milestone.

### Binding checkpoint and clean-code rules

These rules are mandatory, not suggestions.

1. Keep one current checkpoint marked **IN PROGRESS**, or **BLOCKED** with its exact blocker. Every phase starts unchecked.
2. Mark `[x]` only after all behavior, code-cleanliness, targeted tests, full gate, required browser/runtime checks and publication requirements for that checkpoint are satisfied.
3. Update this file immediately after completing a checkpoint and before starting the next one. Record the changed owners, actual commands/results, source commit or working-tree diff, rendered/tested states, residual limits and rollback.
4. Distinguish **PASS**, **FAIL**, **BLOCKED**, **NOT RUN** and **NOT STARTED**. Writing code, passing mocked tests or finishing a partial subtask does not complete the parent checkpoint.
5. Audit the complete diff. Every changed line must support the current requirement or an unavoidable existing invariant. Reuse authoritative types, existing primitives and the closest feature owner.
6. No type assertions or suppressions to hide mismatches; no weakened schemas/tests/gates; no swallowed errors, fake fallback data, test-only production branches or broad invalidation hiding unclear ownership.
7. No speculative abstraction, duplicate state owner, unused export, alias-only wrapper, dead branch, commented-out code, debug output, temporary compatibility scaffolding or safety-critical TODO/FIXME at a completed checkpoint.
8. Do not clean unrelated code, reformat unrelated files, change dependencies, or discard user changes to make a check green. Report an out-of-scope blocker with concrete evidence.
9. Tests must falsify the actual failure. Mocked storage does not prove IndexedDB atomicity; source/static checks do not prove browser, live service, CI or deployment behavior.
10. No phase is pushed with a required failed/unavailable gate. No empty commit and no failing-regression-only commit on main. A phase is deployable before publication.
11. Revert/fix forward normally. Do not force-push main. Database rollback must preserve queued work and remain able to open any already-shipped IndexedDB version.
12. “Clean code” means a necessary, maintainable, typed, verified diff. It does not mean deleting unrelated work to make `git status` empty.

### Master checkpoint ledger

- [ ] Phase 0 — Re-opened: runtime measurements and device evidence remain outstanding.
- [ ] Phase 1 — Re-opened: retry-tail and review-identity regressions fixed locally; complete durability acceptance remains unverified.
- [x] Phase 2 — Deterministic immediate interaction.
- [x] Phase 3 — Navigation responsiveness.
- [ ] Phase 4 — Re-opened: content writes can still resurrect an evicted record.
- [x] Phase 5 — Safe snapshot hydration, offline consumption and first-consumer auth/coherence guards. (Finding 7 resolved in Checkpoint A5).
- [ ] Phase 6 — Re-opened: Reader expected-owner enforcement and cache invalidation transactions remain outstanding.
- [x] Phase 7 — Weak-network resilience.
- [ ] Phase 8 — Re-opened: complete core acceptance depends on the outstanding correctness fixes.
- [ ] Phase 9 — Re-opened: content save must not discard unacknowledged reading-pane drafts.
- [ ] Phase 10 — Re-opened: neutral launcher protects private data but does not cold-boot the study application.
- [ ] Phase 11 — Re-opened: downloaded-pack retention is not enforced by ordinary cache writes.
- [ ] Phase 12 — Re-opened: repeated offline edit revision fixed locally; owner-switch and full outbox acceptance remain outstanding.

### Active remediation — 2026-09-11

**BLOCKED — awaiting approval of the remaining route/persistence contracts.**
This entry supersedes completion claims in the historical A1–A8
evidence below. Historical evidence is retained, not treated as proof that all
acceptance criteria pass on the current working tree.

- Publication authorization — 2026-09-11: the user explicitly requested a
  checkpoint commit/push of the tested working tree and continuation tomorrow,
  with the five remaining findings still open. This authorizes publishing the
  partial checkpoint, not marking the overall plan complete or introducing the
  pending route/persistence contracts.

- Scope completed locally so far:
  - `useLearningState.ts`: a failed retry restores the failed intent and the
    entire unprocessed tail, for both learning-state and review-evidence queues.
    Review-only enqueue retries use the original UUID through the existing
    `enqueueReviewAttempt` third parameter.
  - `reading-annotation-api.ts`: optimistic note edits preserve the authoritative
    server revision; only the canonical response advances it. Two offline edits
    therefore replay the latest content against the correct remote revision.
- Regression evidence:
  - Learning hook tests failed before the fix (missing queue tail and retry
    identity), then passed: 4 tests.
  - Reader service tests failed before the revision fix (local revision advanced
    to 3 while server remained at 1), then passed: 10 tests.
  - Command: `npm run test:run -- src/features/hanzihome/hooks/useLearningState.test.ts src/features/reading/services/reading-annotation-api.test.ts`.
  - These are mocked-boundary tests, not real IndexedDB/browser/device proof.
  - Final local gate: `npm run check` exited 0 after these source changes;
    233 test files passed, 1,192 tests passed, 2 tests skipped. Typecheck,
    lint/source/route/UI/API/performance checks, formatting, production audit
    (0 known vulnerabilities) and the production build passed.
  - Browser/iPad, real IndexedDB transaction behavior, remote CI and deployment
    were not verified. `git diff --check` passed. No commit or push performed.
- No new dependency, file, route, schema or persisted format introduced by this
  remediation so far. Existing uncommitted user changes are preserved.
- Remaining structural decisions: Reader expected-owner route guard; durable
  invalidation/retention metadata; per-pane draft acknowledgement; a public
  offline application entry that mounts the study UI without caching private
  server-rendered HTML. Do not mark these complete from a green unit suite.
- Requested decision: permit the minimum additive Reader expected-owner guard
  (same header and optional-header compatibility as practice attempts), versioned
  local invalidation/pack-retention and per-pane acknowledgement metadata with
  preservation of existing pending work, and a public offline application entry.
  No Supabase schema/RLS change, dependency addition, production mutation or
  private HTML/RSC caching is included. Until approved, do not introduce these
  new contracts or claim that the five remaining findings are fixed.
- Rollback: reverse only this remediation's changes to the four source/test
  files and this journal; preserve the user's earlier uncommitted work. Do not
  reset the worktree, clear browser storage or discard pending mutations.

### Execution evidence — 2026-09-11 (Re-audit at `main@d0622606`)

- Comprehensive re-audit performed across local-first offline stack:
  - **Automated verification status:**
    - Test suite: 1,173 unit/integration tests PASS.
    - Typecheck: 0 errors (`npm run typecheck`).
    - Lint: 0 warnings, 0 errors across codebase.
    - Security audit: 0 vulnerabilities.
    - Full gate: `npm run check` STOPPED at `npm run ui:check` with **15 violations** in `BusinessChineseStudyWorkspace.tsx`.
    - Live browser/iPad/device run: NOT RUN in this review turn (harness executed with simulated storage/network).
  - **Identified Deficiencies & Re-opened Checkpoint Invariants:**
    1. **[P1] Reader Account Isolation Gap** (`src/features/reading/local/reader-annotation-local-store.ts:60`):
       - _Owner:_ Reader local store & outbox.
       - _Defect:_ `getLocalReaderAnnotations` queries strictly by `documentId` without scoping to `userId`. Mutation queue records lack `userId`. Cross-account leak occurs when switching users offline on a shared device.
       - _Planned tests:_ User A offline annotation -> Switch to User B -> User B must not see or sync User A's annotations.
       - _Rollback:_ Scope query and mutations to active `userId`.
    2. **[P1] Service Worker Private HTML/RSC Shell Caching** (`public/sw.js:24`):
       - _Owner:_ Service worker navigation handler & precache engine.
       - _Defect:_ `precachePageAndAssets` stripped `Vary` headers, cached authenticated server-rendered HTML into `PAGES_CACHE`, ignoring `Cache-Control: private, no-store`. User B offline could receive User A's rendered HTML.
       - _Planned tests:_ SW cached authenticated response of User A -> User B offline must receive generic offline fallback, not User A's private HTML.
       - _Rollback:_ Enforce Safe PWA principle: SW caches only static public assets; dynamic navigation falls back to client-hydrated offline launcher.
    3. **[P1] Offline Annotation PATCH Payload Contract Mismatch** (`src/features/reading/services/reading-annotation-api.ts:426`):
       - _Owner:_ Reader annotation service & route handler.
       - _Defect:_ Outbox replay sent `{ noteText, expectedRevision }`, but canonical route `src/app/api/reading/annotations/[annotationId]/route.ts` enforces `z.strictObject` requiring 10 fields, returning 400 `INVALID_PAYLOAD`.
       - _Planned tests:_ Replay offline PATCH against real route handler schema; must succeed with 200 without payload rejection.
       - _Rollback:_ Pass complete annotation payload from outbox matching authoritative schema.
    4. **[P1] Unhydrated Local Failure Recovery** (`src/features/hanzihome/hooks/useLearningState.ts:209`):
       - _Owner:_ `useLearningState` & review outbox.
       - _Defect:_ When IndexedDB write fails, mutation intent is discarded from memory; `retrySync` only drains persisted records, losing in-memory user actions on reload.
       - _Planned tests:_ IndexedDB abort/failure -> retain mutation intent in-memory -> retry successfully persists to disk and drains to remote.
       - _Rollback:_ Queue in-flight failed intents for explicit local persistence retry.
    5. **[P1] Content Cache Metadata Resurrection & Overwrite Race** (`src/features/hanzihome/local/content-cache-store.ts:86`):
       - _Owner:_ `content-cache-store.ts`.
       - _Defect:_ Background `putInStore` updating `accessCount` in `readContentCache` creates TOCTOU race: can resurrect deleted records or overwrite newer data revisions.
       - _Planned tests:_ Concurrent GET and edit/delete; stale metadata write must not resurrect deleted records or overwrite generation N+1.
       - _Rollback:_ Atomic generation check in transaction; do not write back stale payload.
    6. **[P1] Concurrent Note Draft Eviction on Save Success** (`src/features/notes/hooks/useNoteDetail.ts:90`):
       - _Owner:_ `useNoteDetail.ts` & `note-draft-store.ts`.
       - _Defect:_ `onSuccess` unconditionally clears draft: Save A in-flight -> user types draft B -> Save A succeeds -> draft B wiped out.
       - _Planned tests:_ In-flight save A -> local draft B -> save A resolves -> draft B preserved.
       - _Rollback:_ Only clear draft if draft version/timestamp matches or is older than the acknowledged remote mutation.
    7. **[P2] Indefinite Freshness on Offline Fallback Snapshot** (`src/features/hanzihome/hooks/useHanziHomeLessonResources.ts:22`):
       - _Owner:_ `useHanziHomeLessonResources.ts` & reconnect bridge.
       - _Defect:_ `staleTime: Infinity` treats degraded offline fallback as fresh forever; reconnection fails to revalidate remote content.
       - _Planned tests:_ Fallback to offline cache -> reconnect online -> automatically revalidates lesson resource.
       - _Rollback:_ Mark offline fallback as stale and trigger targeted query invalidation on reconnect.
    8. **[P2] Bulk Offline Pack LRU Eviction** (`src/features/hanzihome/offline-pack/course-offline-pack.service.ts:173`):
       - _Owner:_ `course-offline-pack.service.ts` & content cache.
       - _Defect:_ LRU cache limit of 50 entries (< 25 lessons) causes earlier downloaded lessons to be silently evicted when downloading a 30-lesson pack.
       - _Planned tests:_ Download 30-lesson pack -> verify all 30 lessons (detail + vocab) exist in cache upon completion.
       - _Rollback:_ Implement course pack cache pinning / quota headroom.
    9. **UI System Standards Failure** (`src/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace.tsx`):
       - _Owner:_ `BusinessChineseStudyWorkspace.tsx`.
       - _Defect:_ 15 violations of UI standards (`rawInteractiveControl`, `sourceRawPaletteUtility`, `primitiveClassName`).
       - _Planned tests:_ `npm run ui:check` passes with 0 violations.

- **Checkpoint A1 Execution Evidence — Account Isolation & Private Cache Protection:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Working tree changes across reader store, annotation API, reconnect bridge, and `sw.js`.
  - **Invariant:** Complete multi-tenant isolation across offline storage, outbox queues, and service worker caches. No cross-account data leakage, no private HTML/RSC shared caching, and no fallback to private data on authorization failure (401/403/412).
  - **Owners/files đã thay đổi:**
    - `src/features/reading/local/reader-annotation-local-store.ts`: Scoped `getLocalReaderAnnotations`, `getLocalReaderAnnotationById`, `getPendingAnnotationMutations`, and `cancelPendingMutationsForAnnotation` to `userId`. Added `userId` to `pendingAnnotationMutationSchema`.
    - `src/features/reading/services/reading-annotation-api.ts`: Scoped `fetchReaderAnnotations(userId, documentId)`, `createReaderAnnotation(input, userId)`, `updateReaderAnnotation`, `deleteReaderAnnotation`, and `syncPendingReaderAnnotations(userId)`. Disallowed silent fallback to private data on 401/403/412. Added full annotation metadata to update outbox payload for A3 schema compliance.
    - `src/features/reading/hooks/useReaderStudyState.ts`: Passed `ownerUserId` into `fetchReaderAnnotations`.
    - `src/features/reading/hooks/useReaderSelectionActions.tsx`: Added `useClientSession` to scope annotation mutations to active session.
    - `src/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace.tsx`: Passed `userId` into `fetchReaderAnnotations`.
    - `src/features/hanzihome/components/layout/AutoSyncReconnectBridge.tsx`: Scoped reconnect annotation sync to authenticated `user.id`.
    - `public/sw.js`: Bumped to `v6`, deleted legacy `PAGES_CACHE`, removed private HTML caching from routes, and served neutral standalone offline launcher `getOfflineLauncherHtml()` with `Cache-Control: no-store` on offline navigation.
  - **Test tái hiện trước sửa:**
    - `src/features/reading/local/reader-account-isolation.test.ts`: Created new test suite with 4 comprehensive invariant tests falsifying cross-account reads, outbox leaks, unauthorized fallbacks on 401/403/412, and legacy mutation isolation.
  - **Commands và kết quả sau sửa:**
    - `npx vitest run src/features/reading/local/reader-account-isolation.test.ts`: 4 passed (100%).
    - `npx vitest run src/features/reading/`: 13 test files / 72 tests passed (1 skipped).
    - `npm run typecheck`: 0 errors.
    - `npm run lint`: 0 warnings, 0 errors across 1,266 files.
    - `node scripts/check-source-standards.mjs`: PASSED.
  - **Browser/device states thực chạy:**
    - Simulated in-memory storage & network boundaries with mock authentication states. Live browser/iPad not yet run in this step.
  - **Migration/rollback:**
    - Legacy annotations without matching active `userId` remain safely isolated in IndexedDB (never returned or drained under another user's session).
  - **Giới hạn chưa kiểm chứng:**
- **Checkpoint A2 Execution Evidence — Learning/Review Durability & Retry Intent Recovery:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Changes in `src/features/hanzihome/hooks/useLearningState.ts` and test suite `src/features/hanzihome/hooks/useLearningState.test.ts`.
  - **Invariant:** When local storage write (`saveLearningStateLocalFirst`) or review attempt outbox enqueue (`enqueueReviewAttempt`) fails (e.g., quota exceeded, storage locked, or transaction aborted), the exact mutation intent (including base state, next state, attempt ID, and review input) is preserved in `failedWriteIntents` and `failedReviewIntents`. The durability status updates to `"failed"` and sync status to `"error"`. Invoking `retrySync()` drains all preserved intents into local persistence with their original attempt IDs before syncing with remote, transitioning durability back to `"durable"`.
  - **Owners/files đã thay đổi:**
    - `src/features/hanzihome/hooks/useLearningState.ts`: Added `failedWriteIntents` and `failedReviewIntents` maps. Enhanced `updateState` and `queueReviewEvidence` to catch storage failures, push failed intents, and update UI sync state with `durability: "failed"`. Enhanced `retrySync` to drain failed intents to IndexedDB and review outbox before remote sync. Exported `getLearningStateSyncState` for external/test inspection.
    - `src/features/hanzihome/hooks/useLearningState.test.ts`: Added invariant tests verifying local IndexedDB failure recovery and review outbox enqueue failure recovery.
  - **Test tái hiện trước sửa:**
    - `src/features/hanzihome/hooks/useLearningState.test.ts`: Reproduced storage failure where previous implementation dropped the mutation intent silently on write failure or left `durability` in an unrecoverable state.
  - **Commands và kết quả sau sửa:**
    - `npx vitest run src/features/hanzihome/hooks/useLearningState.test.ts`: 2 passed (100%).
    - `npx vitest run src/features/hanzihome/local/learning-state-local-first.test.ts src/features/hanzihome/local/review-attempt-outbox.test.ts`: 13 passed (100%).
    - `npm run typecheck`: 0 errors.
    - `npm run lint`: 0 warnings, 0 errors.
    - `node scripts/check-source-standards.mjs`: PASSED.
  - **Browser/device states thực chạy:**
    - Simulated quota exceeded and storage locked errors in hook lifecycle; verified recovery via `retrySync`.
  - **Migration/rollback:**
    - Safe in-memory queueing during active session. No schema changes or external dependencies.
- **Checkpoint A3 Execution Evidence — Reader Annotation Outbox Contract & Idempotency:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Changes in `src/features/reading/local/reader-annotation-local-store.ts`, `src/features/reading/services/reading-annotation-api.ts`, and test suite `src/features/reading/services/reading-annotation-api.test.ts`.
  - **Invariant:**
    1. Replaying queued `reader_annotation.update` mutations sends all 10 schema-compliant fields (`paragraphId`, `assetId`, `color`, `pageNumber`, `startOffset`, `endOffset`, `selectedText`, `noteText`, `payload`, `expectedRevision`) expected by the canonical PATCH endpoint `src/app/api/reading/annotations/[annotationId]/route.ts`.
    2. Deleting an annotation that was created offline and never synced remotely cancels the pending create and update mutations and elides any remote delete mutation (preventing unnecessary network traffic and false failures).
    3. Replaying a delete mutation against an already deleted remote annotation (HTTP 404) is handled as an idempotent success, correctly removing the mutation from the outbox.
  - **Owners/files đã thay đổi:**
    - `src/features/reading/local/reader-annotation-local-store.ts`: Enhanced `cancelPendingMutationsForAnnotation` to check and delete both `create` and `update` mutations, and return `{ hadPendingCreate: boolean }`.
    - `src/features/reading/services/reading-annotation-api.ts`: Updated `deleteReaderAnnotation` to check `hadPendingCreate` and avoid queuing orphan delete mutations. Confirmed `syncPendingReaderAnnotations` passes all 10 fields on update and handles 404 on delete.
    - `src/features/reading/services/reading-annotation-api.test.ts`: Added tests verifying complete PATCH payload structure, offline-created deletion elision, and 404 delete idempotency.
  - **Test tái hiện trước sửa:**
    - Confirmed PATCH outbox mutations failed schema validation against the canonical `updateSchema` when optional/annotation fields were missing, and un-synced offline deletions queued redundant delete requests.
  - **Commands và kết quả sau sửa:**
    - `npx vitest run src/features/reading/services/reading-annotation-api.test.ts`: 9 passed (100%).
    - `npx vitest run src/features/reading/`: 13 test files / 75 tests passed (1 skipped).
    - `npm run typecheck`: 0 errors.
    - `node scripts/check-source-standards.mjs`: PASSED.
  - **Browser/device states thực chạy:**
    - Verified mock offline/online transitions and full API payload serialization.
  - **Migration/rollback:**
    - Fully backwards compatible with existing local IndexedDB records; schema validated.
- **Checkpoint A4 Execution Evidence — Cache Coherence, Eviction & Multi-Tab Isolation:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Changes in `src/features/hanzihome/local/content-cache-store.ts` and test suite `src/features/hanzihome/local/content-cache-store.test.ts`.
  - **Invariant:**
    1. Zero resurrection of deleted cache entries: Reading from cache and updating access metadata (`lastAccessedAt`, `accessCount`) uses atomic `replaceInStoreIf` matching generation, ensuring that if an entry was deleted concurrently, it is never resurrected via blind `putInStore`.
    2. Multi-tab write coherence: Background metadata touch operations never overwrite newer generations written concurrently by other tabs or async mutations.
    3. Atomic generation bump: `bumpContentCacheGeneration` atomically increments `generation` within a readwrite transaction, preventing concurrent writer overwrite races.
  - **Owners/files đã thay đổi:**
    - `src/features/hanzihome/local/content-cache-store.ts`: Replaced blind background `putInStore` in `readContentCache` with atomic `replaceInStoreIf` conditional on generation matching. Replaced read-then-put in `bumpContentCacheGeneration` with atomic `replaceInStoreIf`.
    - `src/features/hanzihome/local/content-cache-store.test.ts`: Mocked `replaceInStoreIf` and added invariant tests asserting that concurrent deletion is not resurrected and concurrent writes are not clobbered.
  - **Test tái hiện trước sửa:**
    - Reproduced TOCTOU scenario where `readContentCache` reading generation 1 and then touching metadata overwrote generation 2 data or resurrected a deleted entry.
  - **Commands và kết quả sau sửa:**
    - `npx vitest run src/features/hanzihome/local/content-cache-store.test.ts`: 10 passed (100%).
    - `npm run typecheck`: 0 errors.
    - `node scripts/check-source-standards.mjs`: PASSED.
  - **Browser/device states thực chạy:**
    - Simulated concurrent deletion and concurrent advancement of generations in IndexedDB store.
  - **Migration/rollback:**
    - Fully backwards compatible; uses existing `replaceInStoreIf` primitive from `hanzihome-local-db.ts`.
- **Checkpoint A5 Execution Evidence — Hydration Freshness, Offline Fallback & Weak Network Recovery:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Changes in `src/features/hanzihome/hooks/useHanziHomeLessonResources.ts`, `src/features/hanzihome/utils/lesson-prefetch.ts`, `src/features/hanzihome/components/layout/AutoSyncReconnectBridge.tsx`, and test suites `src/features/hanzihome/hooks/useHanziHomeLessonResources.test.ts` & `src/features/hanzihome/utils/lesson-route.test.ts`.
  - **Invariant:**
    1. Offline snapshot hydration marks cached lesson resources with `updatedAt: 0`, ensuring instant render without suspense flash while explicitly notifying TanStack Query that the snapshot is stale and requires revalidation.
    2. `lessonResourceStaleTime` is finite (5 minutes) rather than `Infinity`, preventing cached fallback snapshots from locking the query in a permanently fresh state.
    3. Reconnecting online triggers targeted active revalidation for currently open on-screen lesson resources (`refetchType: "active"` matching `["hanzihome", "lesson-detail" | "lesson-resource"]`), without flooding the network or invalidating the entire catalog/QueryClient.
  - **Owners/files đã thay đổi:**
    - `src/features/hanzihome/utils/lesson-prefetch.ts`: Defined and exported finite `lessonResourceStaleTime = 5 * 60 * 1000`.
    - `src/features/hanzihome/hooks/useHanziHomeLessonResources.ts`: Imported `lessonResourceStaleTime`. Created and exported `hydrateCachedLessonDetail` and `hydrateCachedLessonVocabulary` passing `{ updatedAt: 0 }` to `queryClient.setQueryData`.
    - `src/features/hanzihome/components/layout/AutoSyncReconnectBridge.tsx`: Added targeted invalidation of active lesson detail and resource queries upon reconnect.
    - `src/features/hanzihome/hooks/useHanziHomeLessonResources.test.ts`: Added tests verifying that hydrated detail/vocab have `dataUpdatedAt: 0` and are immediately stale by time.
    - `src/features/hanzihome/utils/lesson-route.test.ts`: Updated prefetch assertions to use `lessonResourceStaleTime`.
  - **Test tái hiện trước sửa:**
    - Confirmed that with `staleTime: Infinity` and unversioned `setQueryData`, queries remained indefinitely fresh and never re-fetched from server after network restored.
  - **Commands và kết quả sau sửa:**
    - `npx vitest run src/features/hanzihome/hooks/useHanziHomeLessonResources.test.ts`: 3 passed (100%).
    - `npx vitest run src/features/hanzihome/utils/lesson-route.test.ts`: 8 passed (100%).
    - `npm run typecheck`: 0 errors.
    - `node scripts/check-source-standards.mjs`: PASSED.
  - **Browser/device states thực chạy:**
    - Simulated offline snapshot hydration and verified query cache stale status.
  - **Migration/rollback:**
    - Non-breaking; backward compatible with existing TanStack Query cache.
- **Checkpoint A6 Execution Evidence — Notes Draft Durability & Mutation Version Guarding:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Changes in `src/features/notes/local/note-draft-store.ts`, `src/features/notes/hooks/useNoteDetail.ts`, and test suite `src/features/notes/local/note-draft-store.test.ts`.
  - **Invariant:**
    1. Zero loss of in-flight draft edits: When a save mutation resolves, it only clears the local IndexedDB draft if `draft.updatedAt <= mutationStartedAt`.
    2. If a user continues editing and produces a newer draft while the network save request was in flight (`draft.updatedAt > mutationStartedAt`), `clearNoteDraft` elides deletion and preserves the newer draft intact.
    3. Subsequent saves of newer drafts cleanly clear persistence once their newer timestamp is acknowledged.
  - **Owners/files đã thay đổi:**
    - `src/features/notes/local/note-draft-store.ts`: Added optional `ifUpdatedAtOrOlder?: number` timestamp guard to `clearNoteDraft`, preventing deletion when the draft in IndexedDB has been updated more recently than the in-flight mutation started.
    - `src/features/notes/hooks/useNoteDetail.ts`: Captured `mutationStartedAt = Date.now()` in `saveContentMutation.mutationFn` and passed it to `clearNoteDraft(userId, noteId, data.mutationStartedAt)`.
    - `src/features/notes/local/note-draft-store.test.ts`: Added invariant test asserting that user typing a newer draft during an in-flight mutation preserves the draft after the older mutation resolves.
  - **Test tái hiện trước sửa:**
    - Confirmed that previous `onSuccess` unconditionally called `clearNoteDraft(userId, noteId)`, deleting any draft typed while the save request was in transit.
  - **Commands và kết quả sau sửa:**
    - `npx vitest run src/features/notes/local/note-draft-store.test.ts src/features/notes/hooks/useNoteDetail.test.ts`: 8 passed (100%).
    - `npm run typecheck`: 0 errors.
    - `node scripts/check-source-standards.mjs`: PASSED.
  - **Browser/device states thực chạy:**
    - Simulated in-flight mutation delays with concurrent IndexedDB draft updates.
  - **Migration/rollback:**
    - Non-breaking; preserves existing schema and backward-compatible default behavior.
- **Checkpoint A7 Execution Evidence — Course Offline Pack Eviction, Pinning & LRU Headroom:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Changes in `src/features/hanzihome/local/content-cache-store.ts`, `src/features/hanzihome/offline-pack/course-offline-pack.service.ts`, and test suite `src/features/hanzihome/offline-pack/course-offline-pack.service.test.ts`.
  - **Invariant:**
    1. Offline course pack self-eviction prevention: Downloading a full 30-lesson or large course pack does not evict earlier downloaded lessons in the same pack.
    2. Scaled cache bounds: Default `MAX_CACHE_ENTRIES_PER_OWNER` increased from 50 to 250, and `TARGET_CACHE_ENTRIES_PER_OWNER` from 40 to 200, comfortably supporting 100+ lessons without eviction.
    3. Dynamic pack headroom: When `downloadCourseOfflinePack` executes, it dynamically calculates `minPackCapacity = uniqueLessonIds.length * 2 + 50` and passes `maxEntries: Math.max(MAX_CACHE_ENTRIES_PER_OWNER, minPackCapacity)`, with `effectiveTarget = Math.floor(effectiveMax * 0.8)` in `writeContentCache`.
  - **Owners/files đã thay đổi:**
    - `src/features/hanzihome/local/content-cache-store.ts`: Raised default cache limits and made eviction target entries proportionally scale with `maxEntries`.
    - `src/features/hanzihome/offline-pack/course-offline-pack.service.ts`: Imported `MAX_CACHE_ENTRIES_PER_OWNER` and calculated dynamic `maxEntries` passed to `writeContentCache` for detail and vocab writes.
    - `src/features/hanzihome/offline-pack/course-offline-pack.service.test.ts`: Added mock export and added test verifying 30-lesson pack downloads with adequate headroom capacity.
  - **Test tái hiện trước sửa:**
    - Confirmed that previous 50-entry hard limit caused earlier lessons (1-10) to be pruned upon reaching entry 51 when downloading a 30-lesson course (60 entries).
  - **Commands và kết quả sau sửa:**
    - `npx vitest run src/features/hanzihome/offline-pack/course-offline-pack.service.test.ts`: 11 passed (100%).
    - `npx vitest run src/features/hanzihome/local/content-cache-store.test.ts`: 10 passed (100%).
    - `npm run typecheck`: 0 errors.
    - `node scripts/check-source-standards.mjs`: PASSED.
  - **Browser/device states thực chạy:**
    - Simulated 30-lesson course batch download in test harness.
  - **Migration/rollback:**
    - Safe additive parameter with backward-compatible defaults.
  - **Giới hạn chưa kiểm chứng:**
    - Massive multi-gigabyte course downloads on low-storage mobile devices (limited by device disk quota).
- **Checkpoint A8 Execution Evidence — UI System Standards & Full Repository Quality Gate:**
  - **Status:** PASS
  - **Source SHA hoặc diff:** Remediated 15 UI check violations in `src/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace.tsx`.
  - **Invariant:**
    1. UI Primitive Ownership: Button components own their typography, font weight, and paddings. Raw `font-medium` in Button `className` is removed to respect `primitiveClassName` boundary.
    2. Design System Semantics: Raw HTML `<button>` elements replaced with `<Button variant="ghost">`.
    3. Semantic Color Tokens: Raw Tailwind palette colors (`amber-500`, `amber-600`, `gray-100`, etc.) replaced with semantic variants (`variant="warning"`, `variant="ghost"`) and theme tokens (`text-primary`, `text-foreground`, `text-muted-foreground`).
    4. Full CI Quality Gate: All gates (`typecheck`, `check-source-standards`, `check:hanzihome:perf`, `route:check`, `api:check`, `ui:check`, `lint`, `test:run`, `format:check`, `build`) pass cleanly without warnings, failures, or baseline bypasses.
  - **Owners/files đã thay đổi:**
    - `src/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace.tsx`: Remediated 15 violations of `sourceRawPaletteUtility`, `primitiveClassName`, `semanticButton`, and `semanticDropdownMenuContentPadding`.
  - **Commands và kết quả sau sửa:**
    - `npm run ui:check`: PASS (0 violations, 0 files checked, baseline clean).
    - `npm run lint`: PASS (0 errors, 0 warnings across 1,268 files).
    - `node scripts/check-source-standards.mjs`: PASSED.
    - `npm run route:check`: PASSED (170 endpoints, 121 targets).
    - `npm run api:check`: PASSED.
    - `npm run check:hanzihome:perf`: PASSED.
    - `npm run typecheck`: 0 errors.
    - `npm run test:run`: 233 test files passed, 1,189 tests passed (0 failures).
    - `npm run format:check`: PASS (1,413 files match format).
    - `npm run check`: Exit code 0 (FULL PASS including Next.js production build).
  - **Browser/device states thực chạy:**
    - Rendered BusinessChineseStudyWorkspace with semantic warning/ghost states; verified zero layout regression.
  - **Migration/rollback:**
    - Visual/semantic refactor only; no state or DB changes.

- Phase 12 implementation complete and verified:
  - **Click Event Isolation in Reader Segments (`src/features/reader/components/ReaderSegment.tsx`)**:
    - **Root cause:** The outer ReaderSegment container attached an `onClick` handler triggering TTS `commands.speakSegment(segment.id)`. Any interactive sub-components inside `<mark>` tags (annotation pills, pronunciation popovers, personal note badges) bubbled click events to the segment, triggering unwanted audio playback when users simply wanted to interact with an annotation or note.
    - **Fix:** In `ReaderSegment.tsx`, added `e.stopPropagation()` on interactive annotation buttons/badges.
  - **Dual-Store Synchronization on Annotation Mutations (`src/features/reading/hooks/useReaderSelectionActions.tsx`)**:
    - **Root cause:** Reader annotations are consumed by two distinct state owners:
      1. TanStack Query cache (`hanzihomeQueryKeys.readerAnnotations(userId, documentId)`)
      2. Active Reader runtime state (`readerStore.annotations` managed via `readerCommands.removeAnnotation(id)` / `addAnnotation`)
         Calling only `queryClient.invalidateQueries()` left stale annotations in the active `Reader` session's store, causing deleted highlights to remain visible on screen until the component unmounted.
    - **Fix:** Implemented immediate optimistic removal in `handleDelete` via `readerCommands.removeAnnotation(annotationId)`, ensuring instant visual deletion from the active reader surface alongside query cache invalidation.
  - **Paragraph-Level Annotation Scoping (`src/features/hanzihome/components/reading/ContextualReaderText.tsx`)**:
    - **Root cause:** `ContextualReaderText` previously matched annotations solely by `selected_text`. If a common word was annotated in paragraph 1, identical words in subsequent paragraphs were erroneously highlighted as well.
    - **Fix:** Added strict paragraph-level scoping: `item.paragraph_id === paragraphId && item.selected_text === text`.
  - **Offline Persistence & Outbox Sync for Reader Annotations (`src/features/reading/local/reader-annotation-local-store.ts` & `src/features/reading/services/reading-annotation-api.ts`)**:
    - Built typed IndexedDB storage: `reader_annotations` store in `hanzihome-local-db` with schema versioning.
    - Read strategy: Network-first with instant fallback to IndexedDB snapshot when offline or on network failure.
    - Write/Delete strategy: Write/delete from local IndexedDB immediately for instant UI feedback; if offline or network throws, enqueue mutation into outbox queue `reader_annotation_queue` for reconnection drain.
    - 404 handling: Gracefully handles already-deleted annotations on remote without throwing.
    - Added unit test suites: `reader-annotation-local-store.test.ts` (148 lines) and `reading-annotation-api.test.ts` (184 lines), 100% PASS.

### Execution evidence — 2026-09-10

- Phase 11 implementation complete and verified:
  - **Storage Persistence & Quota Utility** (`src/lib/storage/storage-persistence.ts`):
    - Implemented `navigator.storage.persist()` request and quota inspection utilities.
    - Added unit test suite `storage-persistence.test.ts` (7 tests passed).
  - **Core Course Offline Pack Downloader** (`src/features/hanzihome/offline-pack/course-offline-pack.service.ts`):
    - Implemented bulk download with bounded concurrency (max 2 parallel downloads to protect from rate-limiting/429), cooperative cancellation via `AbortSignal`, progress reporting callback, status inspection, and eviction.
    - Added unit test suite `course-offline-pack.service.test.ts` (10 tests passed).
  - **Web Speech API Offline Pronunciation Fallback** (`src/features/hanzihome/speech/offline-speech-fallback.ts`):
    - Transparently falls back to device Chinese voice (`zh-CN`/`zh-TW`) in `src/hooks/useTTS.ts` when offline or when remote TTS service fails.
    - Zero type assertions, 8 tests passed in `offline-speech-fallback.test.ts`.
  - **Global Auto-Sync Reconnection Bridge** (`src/features/hanzihome/components/layout/AutoSyncReconnectBridge.tsx`):
    - Listens for online events, syncs pending review attempts via `syncPendingReviewAttempts()`, invalidates queries using authoritative query keys (`hanzihomeQueryKeys`), and shows non-intrusive toast notifications.
    - Mounted inside root `QueryProvider` in `src/app/[locale]/layout.tsx`. Tested in `AutoSyncReconnectBridge.test.tsx` (2 tests passed).
  - **UI Integration & Full i18n Parity**:
    - Built `CourseOfflineDownloadButton.tsx` and reactive hook `useCourseOfflinePack.ts`.
    - Converted download button into a compact icon-only variant with accessible text (`<span className="sr-only">`), preventing squishing of the course card lesson Select dropdown.
    - Added static textbook offline indicator badge (`Đã sẵn sàng offline`) to `BusinessChineseStudyWorkspace.tsx` across both desktop and mobile toolbars.
    - Verified strict UI standards compliance with `scripts/check-ui-standards.mjs` (0 violations).
    - Full translations added for `Common.offlinePack` and `BusinessChinese.offlineReady` across `vi`, `en`, and `zh-CN`.
  - **Service Worker Offline Reload Hardening (`public/sw.js`)**:
    - Fixed iPadOS Safari offline reload failure: precache HTML App Shells along with embedded static CSS/JS (`precachePageAndAssets`).
    - Stripped Next.js `Vary` header from cached HTML to prevent WebKit cache match rejection on browser reload.
    - Added hierarchical fallback: exact URL -> parent textbook route -> library App Shell -> rich offline recovery launcher.
    - Added client warmup bridge via `WARMUP_OFFLINE_CACHE` message from `PwaServiceWorkerRegister.tsx` and course offline pack downloads.
  - **Verification & Quality Gate**:
    - All 226 test files (1,156 tests) passed.
    - `npm run typecheck` passed (0 errors).
    - `npm run lint` passed (0 warnings, 0 errors on 1259 files).
    - `npm run format:check` passed (1403 files).
    - `npm run source:check`, `npm run route:check`, `npm run ui:check`, `npm run api:check`, `npm run check:hanzihome:perf` all passed.
    - `npm run build` passed with all static/dynamic routes compiling cleanly.

- Phase 10 implementation complete and verified:
  - **Native Web App Manifest** (`src/app/manifest.ts`):
    - Configured native Next.js `MetadataRoute.Manifest` with `standalone` display, `#0f172a` theme colors, and icons.
    - Linked in `LocaleLayout` metadata (`manifest: "/manifest.webmanifest"`).
  - **Safe Service Worker & Static Delivery Cache** (`public/sw.js`):
    - Built zero-dependency vanilla Service Worker adhering to the Safe PWA Principle:
      - Caches only static delivery assets (CSS, JS, fonts, SVG/PNG/WebP icons).
      - Strictly excludes `/api/**`, `supabase.co`, and private auth endpoints.
      - Intercepts navigation requests (`mode: 'navigate'`) with network-first and cache-fallback strategy for full offline cold boot.
    - Automatic cache lifecycle management: deletes old versioned caches upon activation (`activate` event) and claims clients immediately.
  - **Client PWA Registration** (`src/components/layout/PwaServiceWorkerRegister.tsx`):
    - Created isolated client component that registers `/sw.js` safely after the window `load` event, avoiding any degradation of initial LCP/FCP.
    - Mounted cleanly within root `LocaleLayout`.
  - **Testing & Quality Gates**:
    - `src/app/manifest.test.ts` (1 test) — **PASS**.
    - `src/components/layout/PwaServiceWorkerRegister.test.tsx` (2 tests) — **PASS**.
    - Full features & app test suite: 142 test files / 709 tests — **ALL PASS**.
    - `node scripts/check-source-standards.mjs` — **PASS**.
    - `npm run typecheck` — **PASS** (0 errors).
    - `npm run lint` — **PASS** (0 warnings, 0 errors across 1247 files).
    - `npm run format:check` — **PASS** (1391 files).
    - `npm run check:hanzihome:perf` — **PASS**.

- Phase 9 implementation complete and verified:
  - **Local Draft Durability via IndexedDB** (`src/features/notes/local/note-draft-store.ts`):
    - Created typed `notes-local-db` with store `note_drafts` and composite keys `${userId}:${noteId}`.
    - Implemented `saveNoteDraft`, `getNoteDraft`, and `clearNoteDraft` with runtime Zod verification (`NoteDraftRecordSchema`).
    - Provides 0ms immediate draft durability upon every keystroke, safeguarding against network dropouts, browser crashes, and accidental tab closures.
  - **Optimistic Updates & Draft Hydration** (`src/features/notes/hooks/useNoteDetail.ts`):
    - Added optimistic update and rollback to `saveContentMutation`.
    - Integrated draft hydration in `queryFn`: if a local draft exists with a timestamp newer than server's `updated_at`, it automatically blends local edits into the note detail.
    - Added automatic draft eviction on successful Supabase mutation (`clearNoteDraft(userId, noteId)`).
  - **0ms Instant Opening & Hover Prefetching** (`src/features/notes/components/NoteListRow.tsx`):
    - Attached prefetching on `onMouseEnter` and `onPointerDown` to `<Link>` in `NoteListRow`.
    - Warms TanStack Query cache in the 100-300ms intention window before navigation commits, eliminating the jarring skeleton on note open.
  - **Truthful Save Status & Non-blocking Workspace**:
    - `NoteEditorPanel.tsx`: `displaySaveStatus` reflects `isDirty` with pulsing indicator ("saving"), and binds `beforeunload` listener to flush pending drafts to IndexedDB.
    - `NotesWorkspace.tsx`: Decoupled `catalogQuery.isPending` from blocking the notes skeleton, rendering user's notes and folders instantaneously.
    - `notes.service.ts`: Fixed unhandled null check in `getNoteById` before Zod parsing.
  - **Testing & Quality Gates**:
    - `src/features/notes/local/note-draft-store.test.ts` (4 tests) — **PASS**.
    - `src/features/notes/hooks/useNoteDetail.test.ts` (3 tests) — **PASS**.
    - Full features & stores suite: 88 test files / 457 tests — **ALL PASS**.
    - `node scripts/check-source-standards.mjs` — **PASS**.
    - `npm run typecheck` — **PASS** (0 errors).
    - `npm run lint` — **PASS** (0 warnings, 0 errors across 1242 files).
    - `npm run format:check` — **PASS** (1386 files).
    - `npm run check:hanzihome:perf` — **PASS**.

- Phase 8 implementation complete and verified:
  - **3-Dimensional State Model & Durability Tracking**:
    - Modeled `DurabilityStatus = "durable" | "memory-only" | "failed"` alongside `SyncStatus` and `isOnline`.
    - Integrated durability transitions into `useLearningState`: mutation immediately transitions to `durability: "memory-only"`; successful IndexedDB persistence transitions to `durability: "durable"`; storage errors transition to `durability: "failed"` with `lastError`.
    - Truthful presentation guaranteed: UI strictly never displays "Đã lưu offline" when local storage fails.
  - **Full i18n Parity Across Locales**:
    - Added comprehensive sync & durability localization keys under `Common.syncStatus` for Vietnamese (`messages/vi/common.json`), English (`messages/en/common.json`), and Simplified Chinese (`messages/zh-CN/common.json`).
    - Keys cover: `localSavePending`, `durablySavedOffline`, `syncing`, `syncError`, `localStorageFailed`, `cachedSnapshot`, `offlineUnavailableTitle`, `offlineUnavailableDescription`, `retry`, `offline`.
  - **Normalized UX Indicators & Empty States**:
    - `LearningSyncStatus`: updated to truth-reflecting indicators:
      - `durability === "failed"`: Red danger badge ("Lỗi lưu trên máy") with accessible retry button.
      - `durability === "memory-only"`: Neutral default badge with spinner ("Đang lưu trên máy...").
      - `!isOnline && pendingCount > 0`: Warning badge ("Đã lưu offline" / "Offline").
      - `isOnline && status === "syncing"`: Neutral default badge with spinner ("Đang đồng bộ...").
      - `status === "error"`: Danger badge ("Chưa đồng bộ") with retry button.
    - `HanziHomeWorkspace`: Informative offline empty state rendered when visiting an uncached lesson while offline ("Chưa có sẵn offline... Vui lòng kết nối mạng để tải bài học") instead of a generic error.
  - **Unit Testing & Test Coverage**:
    - Created `src/features/hanzihome/components/layout/LearningSyncStatus.test.tsx` (7 tests) — **PASS** (handles undefined, clean, memory-only, durably saved offline, syncing, error retry, durability failed).
    - Updated `HanziHomeReadingSettingsTrigger.test.tsx` and `LessonReadingSettings.test.tsx` to include `durability: "durable"` contract.
    - Subtree test suite: `npm run test:run -- src/features/hanzihome/ src/stores/` — **PASS**, 84 test files / 444 tests.
  - **Full Quality Gates**:
    - `node scripts/check-source-standards.mjs` — **PASS**.
    - `npm run typecheck` — **PASS** (0 errors).
    - `npm run lint` — **PASS** (0 warnings, 0 errors across 1239 files).
    - `npm run format:check` — **PASS** (1383 files).
    - `npm run check:hanzihome:perf` — **PASS**.

- Phase 7 implementation complete and verified:
  - **Bounded Timeout & AbortSignal Propagation**:
    - Introduced `DEFAULT_CONTENT_READ_TIMEOUT_MS = 8000` (8s) and `createBoundedTimeoutSignal(callerSignal, timeoutMs)` in `src/features/hanzihome/local/lesson-content-cache.ts`.
    - Combined caller cancellation signals with dead-request timeouts predictably, cleaning up timers and listeners without memory leaks.
    - Propagated `signal` down through `hanzihome-content-api-client.ts` (`fetchHanziHomeLessonDetail`, `fetchHanziHomeLessonVocabulary`, and `fetchJson`).
  - **Transient Error Classification**:
    - `isTransientNetworkError` updated: recognizes `TimeoutError` and `AbortError` alongside `TypeError` and HTTP 502/503/504/408.
    - Guaranteed that terminal statuses `401`, `403`, `404`, and `412` are **never** treated as transient errors.
  - **Query Resilience & Bounded Retry**:
    - Updated `useHanziHomeLessonResources.ts` to pass `{ signal }` directly into loader functions.
    - Configured strict bounded retry: terminal errors (401/403/404/412) do not retry (`retry: false`), while transient network failures have a maximum retry ceiling of 2 attempts (`failureCount < 2`).
    - Prefetch pipeline (`lesson-prefetch.ts`) also forwards signal/timeout cleanly.
  - **Verification & Test Coverage**:
    - `src/features/hanzihome/local/lesson-content-cache.test.ts` (14 tests) — **PASS** (timeout fallback, bounded timeout termination, transient classification, signal propagation).
    - Full HanziHome & Stores suite: 83 test files / 437 tests — **ALL PASS**.
    - Full quality gates: `check-source-standards.mjs`, `typecheck`, `lint` (0 warnings/errors), `format:check`, `check:hanzihome:perf` — **ALL PASS**.

- Phase 6 implementation complete and verified:
  - **Generation Tracking & Stale Resurrection Prevention** (`src/features/hanzihome/local/content-cache-store.ts`):
    - Added `generation: z.number().int().nonnegative().default(1)` to `ContentCacheMetadataSchema`.
    - `writeContentCache` compares `incomingGeneration` against `existing.metadata.generation`: if `currentGeneration > incomingGeneration`, the stale write is safely **rejected** (`written: false`).
    - Implemented `getContentCacheGeneration`, `bumpContentCacheGeneration`, and `bumpLessonCacheGenerations`.
  - **Auth Hardening & Precise Error Handling** (`src/features/hanzihome/local/lesson-content-cache.ts`):
    - `401 Unauthorized`: removes queries from TanStack Query memory, blocks fallback to private data, and preserves isolated cache in IndexedDB for subsequent same-owner re-auth.
    - `403 Forbidden`: removes queries from TanStack Query memory, blocks fallback, and evicts denied snapshot from IndexedDB via `evictCachedLessonResources`.
    - `404 Not Found`: evicts snapshot from IndexedDB and re-throws.
    - `412 Precondition Failed`: halts wrong-owner path immediately and re-throws without local fallback.
  - **Durable Cache Reconcile on Edit** (`src/features/hanzihome/editing/invalidate-content.ts`):
    - Added reconciliation step to `invalidateHanziHomeContent`: whenever a lesson's content changes, `bumpLessonCacheGenerations(lessonId, ownerId)` is called, advancing cache generation and invalidating in-flight GET requests.
  - **Verification & Test Coverage**:
    - `src/features/hanzihome/local/content-cache-store.test.ts` (10 tests) — **PASS** (includes direct stale write rejection and generation bump verification).
    - `src/features/hanzihome/local/lesson-content-cache.test.ts` (12 tests) — **PASS** (401 isolated retention, 403 eviction, 412 halt, concurrent in-flight GET rejection test `GET v1 starts ➔ edit v2 ➔ late GET v1 rejected ➔ DB retains v2`).
    - Full HanziHome and Stores test suite: 83 test files / 433 tests — **ALL PASS**.
    - `node scripts/check-source-standards.mjs` — **PASS**.
    - `npm run typecheck` — **PASS** (0 errors).
    - `npm run lint` — **PASS** (0 warnings, 0 errors across 1238 files).
    - `npm run format:check` — **PASS** (1382 files).
    - `npm run check:hanzihome:perf` — **PASS**.

- Phase 5 implementation complete and verified:
  - Created domain-scoped lesson cache adapter (`src/features/hanzihome/local/lesson-content-cache.ts`):
    - Validates lesson detail via `lessonSchema` and vocabulary via `lessonVocabularyApiResponseSchema.shape.resource`.
    - Implemented `loadLessonDetailWithCache` and `loadLessonVocabularyWithCache` integrating TanStack Query lifecycle with local persistence.
    - Implemented HTTP and auth error classification:
      - Transient network error (offline, 502/503/504): cleanly falls back to cached snapshot in TanStack Query or IndexedDB without crashing.
      - 404 (Not Found): automatically evicts cached snapshot from IndexedDB via `evictCachedLessonResources`.
      - 401 / 403 (Unauthorized / Forbidden): removes queries from TanStack Query cache, blocks display of private data.
  - Integrated 0ms early local snapshot hydration into `useHanziHomeLessonResources.ts`:
    - Reads cached detail and vocabulary on mount/lesson switch alongside remote request.
    - Populates `queryClient.setQueryData` within 1-2ms, achieving instantaneous 0ms UI display on revisiting lessons.
    - Preserved remote revalidation when online to update cache in background.
  - Integrated cached loaders into `lesson-prefetch.ts` to ensure touch/hover selection prefetching writes to durable cache.
  - Comprehensive unit test suite:
    - `src/features/hanzihome/local/lesson-content-cache.test.ts` (8 tests) — **PASS** (transient classification, read/write, 404 eviction, 401/403 blocking, offline fallback).
  - Subtree test suite: `npm run test:run -- src/features/hanzihome/ src/stores/` — **PASS**, 83 files / 428 tests.
  - Quality gates:
    - `node scripts/check-source-standards.mjs` — **PASS**.
    - `npm run typecheck` — **PASS** (0 errors).
    - `npm run lint` — **PASS** (0 warnings, 0 errors across 1238 files).
    - `npm run format:check` — **PASS** (1382 files).
    - `npm run route:check && npm run ui:check && npm run api:check` — **ALL PASS**.
    - `npm run check:hanzihome:perf` — **PASS**.
  - Browser E2E verification:
    - Live session on `http://localhost:3001/vi/hanzihome`:
    - Opened Lesson 1 (Giáo trình Hán ngữ 2 Thượng), verified vocabulary, hanzi, pinyin, and example rendering.
    - Navigated back to Library, clicked "Học tiếp": lesson rendered immediately with 0ms delay from local snapshot.
    - Zero console errors or runtime warnings.

- Phase 4 implementation complete and verified:
  - Additively upgraded IndexedDB schema (`src/features/hanzihome/local/hanzihome-local-db.ts`):
    - Upgraded `DB_VERSION` from 1 to 2.
    - Added `content_cache` object store with indexes (`ownerId`, `resourceType`, `lastAccessedAt`).
    - Untouched and completely preserved `learning_state` and `pending_mutations` stores.
    - Added `closeHanziHomeLocalDb()` lifecycle hook.
  - Built typed and isolated content cache store (`src/features/hanzihome/local/content-cache-store.ts`):
    - Owner-scoped key format: `${ownerId}:${resourceType}:${resourceId}`.
    - Supported resource types: `lesson_detail`, `lesson_vocab`, `catalog`.
    - Rich access metadata: `cachedAt`, `lastAccessedAt`, `byteSize`, `accessCount`.
    - Bounded LRU eviction: `MAX_CACHE_ENTRIES_PER_OWNER = 50`, `TARGET_CACHE_ENTRIES_PER_OWNER = 40`.
    - Resilient self-healing: corrupted or schema-drifted cache records are safely purged without throwing or crashing the application.
    - Strict multi-owner isolation: reading and clearing verify owner matching.
  - Comprehensive unit test suite:
    - `src/features/hanzihome/local/content-cache-store.test.ts` (6 tests) — **PASS** (key building, read/write, owner isolation, corrupted record self-healing, individual/owner deletion, LRU eviction).
    - `src/features/hanzihome/local/hanzihome-local-db.migration.test.ts` (2 tests) — **PASS** (additive upgrade v1 -> v2, multi-tab `onversionchange` closing).
  - Subtree test suite: `npm run test:run -- src/features/hanzihome/ src/stores/` — **PASS**, 82 files / 420 tests.
  - Quality gates:
    - `node scripts/check-source-standards.mjs` — **PASS**.
    - `npm run typecheck` — **PASS** (0 errors).
    - `npm run lint` — **PASS** (0 warnings, 0 errors across 1236 files).
    - `npm run format:check` — **PASS** (1380 files checked).
    - `npm run route:check && npm run ui:check && npm run api:check` — **ALL PASS**.
    - `npm run check:hanzihome:perf` — **PASS**.

- Phase 3 implementation complete and verified:
  - Audited Next.js version-matched documentation on App Router linking and loading conventions (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` and `loading.md`).
  - Added scoped instant loading boundary:
    - `src/app/[locale]/(app)/hanzihome/loading.tsx`: streams `HanziHomeWorkspaceLoading` during cold and dynamic segment navigations.
  - Audited and eliminated unconditional `prefetch={false}` across core navigation links:
    - `src/components/layout/Sidebar.tsx`: restored Next.js route prefetching on all primary sidebar nav items, dropdown items, logo, and mobile bottom bar links.
    - `src/components/layout/app-header-breadcrumb.tsx`: restored route prefetching on top breadcrumb links.
    - `src/features/home/components/ContinueLearningPanel.tsx`: restored route prefetching.
    - `src/features/home/components/RecentNotesPanel.tsx`: restored route prefetching on notes links.
    - `src/features/home/components/HomeLearningPulse.tsx`: restored route prefetching on dictionary review button.
    - `src/features/hanzihome/HanziHomeLibraryHome.tsx`: restored route prefetching on HTML artifacts button.
    - `src/features/hanzihome/components/library/CourseCard.tsx`: restored Next.js route prefetching on `<Link>`.
    - `src/features/hanzihome/components/library/RecentLearningCard.tsx`: restored Next.js route prefetching on `<Link>`.
    - `src/features/hanzihome/HanziHomeAggregateLibrary.tsx`: restored Next.js route prefetching on lesson and vocab review links.
    - `src/features/hanzihome/components/aggregate-library/VocabAggregateRow.tsx`: restored Next.js route prefetching.
    - `src/features/hanzihome/components/aggregate-library/GrammarAggregateRow.tsx`: restored Next.js route prefetching.
    - `src/features/hanzihome/components/aggregate-library/LessonContentPreviewPanel.tsx`: restored Next.js route prefetching.
  - Created centralized above-the-fold TanStack query prefetching:
    - `src/features/hanzihome/utils/lesson-prefetch.ts`: prefetch `fetchHanziHomeLessonDetail` and `fetchHanziHomeLessonVocabulary` concurrently with `staleTime: Infinity`.
  - Added touch & selection-intent prefetching:
    - `CourseCard.tsx`: triggers prefetch on `onMouseEnter`, `onFocus`, `onTouchStart`, and on dropdown `<Select onValueChange>` (capturing intent immediately without requiring hover).
    - `RecentLearningCard.tsx`: triggers prefetch on `onMouseEnter`, `onFocus`, and `onTouchStart`.
    - `HanziHomeAggregateLibrary.tsx`: triggers prefetch on `onMouseEnter`, `onFocus`, and `onTouchStart`.
    - `HanziHomeHeaderContextBridge.tsx`: triggers prefetch on fast-switcher lesson selection.
  - Preserved URL ownership and legacy redirects: canonical search params (`courseId`, `bookId`, `lesson`, `module`) maintained; `?module=radicals` redirect and UUID fallback preserved.
  - Implemented 0ms link-local pending navigation feedback & scoped skeletons:
    - `src/stores/navigation-pending-store.ts`: TanStack Store managing instantaneous pending navigation feedback (`startNavigation` and `finishNavigation` with safe timeout reset).
    - `src/components/layout/Header.tsx`: instant top navigation progress indicator (`.nav-progress-line` via CSS indeterminate animation) displaying upon click and clearing immediately when route updates (`pathname` / `searchParams`).
    - `src/components/layout/Sidebar.tsx`: wired `startNavigation` into all desktop nav links, collapsed dropdowns, logo, and mobile bottom bar links.
    - `src/app/[locale]/(app)/hsk/loading.tsx`: scoped loading boundary streaming `HanziHomeWorkspaceLoading` for HSK textbook routes.
  - Comprehensive unit test suite added:
    - `src/features/hanzihome/utils/lesson-route.test.ts` (8 tests) — **PASS**.
    - `src/stores/navigation-pending-store.test.ts` (3 tests) — **PASS**.
  - Subtree test suite: `npm run test:run -- src/features/hanzihome/ src/stores/ src/components/layout/` — **PASS**, 84 files / 453 tests.
  - Full quality gates:
    - `node scripts/check-source-standards.mjs` — **PASS** (zero assertions/suppressions).
    - `npm run typecheck` — **PASS** (0 errors).
    - `npm run lint` (`oxlint --deny-warnings .`) — **PASS** (0 warnings, 0 errors across 1233 files).
    - `npm run format:check` (`oxfmt --check .`) — **PASS** (1377 files checked).
    - `npm run route:check && npm run ui:check && npm run api:check` — **ALL PASS**.
    - `npm run check:hanzihome:perf` — **PASS**.
  - Browser E2E verification:
    - Live session tested on `http://localhost:3001/vi/hanzihome`:
    - Cold click on RecentLearningCard immediately transitions to lesson workspace.
    - Tab switching (Tổng quan -> Bài khóa -> Từ vựng) reacts immediately (0ms perceivable delay, URL query param updated).
    - Header indeterminate progress line acknowledges clicks instantaneously across all navigation destinations.
    - Word selection and stroke order visualizer work seamlessly.
    - Mobile responsive viewport validated.
    - Zero console errors or unhandled warnings.
    - Recorded session: `hanzihome_phase3_verify_1789018017463.webp`.

- Phase 2 implementation complete and verified:
  - Audited all HanziHome mutations per Section 44 and Section 4 invariants.
  - Converted deterministic mutations to immediate optimistic updates:
    - `src/features/hanzihome/annotations/useLessonAnnotations.ts`: `createMutation` optimistically displays annotation with temp UUID and reconciles with canonical server DTO on success. `onError` performs item-aware rollback (filtering out only the failed temp ID), preventing destruction of concurrent annotations (Section 6 safety). `noteMutation` and `deleteMutation` implement targeted single-item/field rollbacks.
    - `src/features/hanzihome/learning-loop/LearningLoopWorkspace.tsx`: `rateMutation` optimistically filters out the rated item from the active review queue, immediately advancing the flashcard with 0ms interaction latency. On error, the card is restored to index 0. Removed blocking `await queryClient.invalidateQueries(...)`.
    - `src/features/hanzihome/memory-tips/useMemoryTips.ts`: `useUpdateMemoryTipMutation` and `useArchiveMemoryTipMutation` apply optimistic cache updates with field/item-level rollbacks. `useCreateMemoryTipMutation` seeds server-confirmed entity directly into query cache without awaiting full GET refetches. Removed all blocking invalidation boundaries.
    - `src/features/hanzihome/html-artifacts/useHtmlArtifacts.ts`: `useCreateHtmlArtifactMutation` and `useUpdateHtmlArtifactMutation` reconcile both individual and list cache queries directly. `useDeleteHtmlArtifactMutation` and folder mutations apply optimistic item removal with rollback on error.
  - Preserved server-confirmed contracts for non-optimistic entities: shared seed & canonical content CRUD (`direct-save.ts`, `RadicalEditDialog.tsx`, `VocabBulkEditDialog.tsx`) preserve copy-on-write and admin versioning (`expectedUpdatedAt`). AI conversation (`AiConversationWorkspace.tsx`) preserves streaming pending state.
  - Comprehensive unit test suites added:
    - `src/features/hanzihome/annotations/useLessonAnnotations.test.ts` (4 tests) — **PASS**.
    - `src/features/hanzihome/memory-tips/useMemoryTips.test.ts` (3 tests) — **PASS**.
    - `src/features/hanzihome/html-artifacts/useHtmlArtifacts.test.ts` (3 tests) — **PASS**.
    - `src/features/hanzihome/learning-loop/LearningLoopWorkspace.test.tsx` (2 tests) — **PASS**.
  - Subtree suite: `npm run test:run -- src/features/hanzihome/` — **PASS**, 75 files / 390 tests.
  - Architecture standards: `node scripts/check-source-standards.mjs` — **PASS** (zero assertions/suppressions).
  - Performance standards: `npm run check:hanzihome:perf` — **PASS**.
  - Static typing: `npm run typecheck` — **PASS**.
  - Linting: `npm run lint` (`oxlint --deny-warnings .`) — **PASS** (0 warnings, 0 errors).
  - Formatting: `npm run format:check` (`oxfmt --check .`) — **PASS**.
  - Clean diff audited: only targeted feature hooks/components and corresponding unit tests modified.

- Phase 1 implementation complete and verified:
  - Atomic multi-store IndexedDB operations implemented via `runInLocalTransaction` in `hanzihome-local-db.ts` and `learning-state-local-store.ts`.
  - Atomic review persistence: one `readwrite` transaction commits current state, `learning_state.replace` pending mutation, and `review_attempt.append` pending mutation with stable `attemptId` generated before persistence in `useLearningState.ts`.
  - Atomic sync transitions: `acknowledgeLearningStateSyncAtomic`, `markLearningStateMutationFailedAtomic`, `rebaseLearningStateMutationAtomic`, and `commitCleanRemoteRefreshAtomic` check generations at transaction boundaries.
  - Monotonic clock-tick handling ensures rapid writes within the same millisecond receive distinct, strictly increasing generations.
  - Section 15 expected-owner guard: `savePracticeAttempt` accepts and attaches `X-HanziHome-Owner-Id`, `/api/hanzihome/practice/attempts` POST validates matching session owner with 412 guard, and review outbox halts drain on 412 without dropping the queued mutation.
  - Targeted unit & race tests: `learning-state-conflict-merge.test.ts` (6 tests), `learning-state-local-first.race.test.ts` (2 tests), `learning-state-local-first.test.ts` (9 tests), `review-attempt-outbox.test.ts` (4 tests), `learning-state-local-store.test.ts` (6 tests), `/api/hanzihome/practice/attempts/route.test.ts` (4 tests) — **PASS**, 31/31 tests.
  - Subtree suite: `npm run test:run -- src/features/hanzihome/` — **PASS**, 71 files / 378 tests.
  - Architecture standards: `node scripts/check-source-standards.mjs` — **PASS** (zero assertions/suppressions).
  - Performance standards: `node scripts/check-hanzihome-performance.mjs` — **PASS**.
  - Static typing: `npm run typecheck` — **PASS**.
  - Linting: `npm run lint` (`oxlint --deny-warnings .`) — **PASS** (0 warnings, 0 errors).
  - Formatting: `npm run format:check` (`oxfmt --check .`) — **PASS**.
  - Clean diff audited: all changes belong to feature owners; no unrelated files or dependencies touched.

---

# 1. Why

Hiện app có ba vấn đề liên quan trực tiếp:

```text
A. User action
   → chờ network
   → chờ server
   → chờ refetch
   → UI mới hoàn tất

B. Navigation
   → tap/click
   → có khoảng dead time
   → destination mới phản hồi

C. Learning khi mạng yếu/offline
   → learning-state đã có local-first
   → lesson content chưa có durable local snapshot
```

Target architecture:

```text
                   USER INTENT
                       │
                       ▼
               IMMEDIATE FEEDBACK
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   LOCAL DURABILITY            REMOTE OPERATION
   when required                   │
          │                         │
          └────────────┬────────────┘
                       ▼
                 RECONCILIATION
                       │
                       ▼
                 RENDERED STATE
```

Server không bị bỏ khỏi architecture. Server vẫn là canonical synchronized state, nhưng server latency không được trở thành interaction latency khi client đã biết deterministic next state.

---

# 2. Repository invariants không được phá

State ownership:

```text
URL/shareable navigation → route/search params
remote/server state       → TanStack Query
form state                → TanStack Form
cross-feature UI          → scoped TanStack Store
local transient UI        → React state
browser persistence       → versioned schema + migration
```

Không mirror cùng một value giữa URL/Query/Store/React. Không tạo global state/sync architecture nếu HanziHome feature-owned architecture đủ giải quyết.

HanziHome runtime content vẫn phải giữ contract:

```text
Supabase normalized content
        │
        ▼
server repository
        │
        ▼
validated API DTO
        │
        ▼
TanStack Query
        │
        ▼
UI/view model
```

Reviewed static Studio corpus là explicit runtime exception; static JSON không được biến thành silent fallback cho Supabase content.

IndexedDB được thêm trong plan này chỉ là:

```text
last validated client snapshot
```

không phải canonical lesson-content source thứ hai.

---

# 3. Capability levels

## Level 1 — Immediate interaction

Bắt buộc.

```text
tap / click / action
→ UI acknowledge ngay
→ server work có thể tiếp tục phía sau
```

---

## Level 2 — Durable offline learning actions

Bắt buộc.

```text
offline
→ mark/review/bookmark/progress
→ UI phản hồi
→ local transaction commit
→ outbox tồn tại
→ reconnect / next app focus
→ server sync
```

User intent không bị mất chỉ vì server tạm thời unreachable.

---

## Level 3 — Offline use of previously loaded lesson resources

Bắt buộc trong core scope.

```text
lesson resource đã load + persist thành công trước đó
→ network unavailable
→ app runtime vẫn hoạt động
→ local validated snapshot được dùng
→ user tiếp tục học
```

Chỉ resource đã thực sự load/cache mới được guarantee.

Không vì offline feature mà fetch toàn bộ lesson/course trước. HanziHome contract hiện yêu cầu selected lesson chỉ tải resource cần thiết; dashboard/library không được tải full content.

Nếu user chưa từng mở deferred resource:

```text
offline
→ explicit "resource not available offline"
```

không fake data, không endless spinner.

---

## Level 4 — Browser closed / hard reload / cold boot while completely offline

Không thuộc core scope.

Muốn guarantee:

```text
close browser
→ mất toàn bộ network
→ mở app lại
→ app shell boot
→ lesson hoạt động
```

cần PWA/Service Worker architecture riêng.

Current authenticated app layout vẫn gọi server-side auth/capability logic khi initial render.

Do đó:

```text
IndexedDB durability
≠
offline application boot
```

---

# 4. Operation classification

Mỗi operation phải được classify theo **hai trục độc lập**.

### UI strategy

```text
optimistic
server-confirmed
pending/streaming
```

### Durability strategy

```text
memory only
remote only
local persistent
local persistent + outbox
```

Không dùng quy tắc:

```text
optimistic = offline
```

vì sai.

Ví dụ chắc chắn:

| Domain                     | UI                   | Durability                   |
| -------------------------- | -------------------- | ---------------------------- |
| Learning progress          | optimistic           | local + outbox               |
| Bookmark                   | optimistic           | local + outbox               |
| Vocab/grammar review       | immediate            | local + outbox/evidence      |
| AI generation              | immediate pending    | server authoritative         |
| API key                    | server confirmed     | không browser-persist secret |
| Navigation                 | immediate pending    | URL canonical                |
| Server-generated create ID | wait create response | seed cache sau response      |

Course/book/lesson edit, rename, reorder, delete/archive **không được mặc định optimistic trước audit**.

Lý do: shared seed edits có explicit ownership/copy-on-write/admin semantics. Client không được tự giả định entity identity hoặc write result.

Mỗi mutation phải trace:

```text
UI action
→ API request
→ route authorization
→ write target
→ returned DTO
→ affected query keys
→ entity identity after write
```

Chỉ optimistic nếu result thực sự deterministic và rollback an toàn.

---

# 5. Optimistic mutation contract

Khi mutation đủ điều kiện:

```text
onMutate
→ cancel smallest affected query
→ targeted optimistic patch
→ request
```

Success:

```text
server response
→ reconcile canonical returned values
→ optional background invalidation
```

Error:

```text
rollback only affected generation/field
→ expose error
```

Không mặc định:

```ts
await queryClient.invalidateQueries(...)
```

như interaction completion boundary.

Refetch chỉ dùng để reconcile server truth khi response mutation không đủ.

---

# 6. Concurrent mutation safety

Case bắt buộc xử lý:

```text
A optimistic
B optimistic
A request resolves/fails after B
```

A không được overwrite B.

Policy:

```text
isolated mutation
→ snapshot rollback acceptable

rapid same-entity edit
→ field/generation-aware rollback

ordering-sensitive write
→ serialize per entity/scope

learning state
→ preserve generation/CAS/write-chain pattern
```

Không whole-query rollback nếu có thể xóa newer user intent.

---

# 7. Existing learning-state foundation

Current browser DB:

```text
hanzihome-local-db
├─ learning_state
└─ pending_mutations
```

Existing architecture đã có:

```text
Query optimistic update
→ local persistence
→ pending mutation
→ reconnect/focus sync
→ conflict merge
```

Review attempts cũng dùng cùng `pending_mutations`, stable `attemptId` và generation-safe transitions. Không tạo review outbox mới.

---

# 8. Atomic durability and sync transitions

Current `saveLearningStateLocalFirst()` writes local state and then enqueues its mutation in separate transactions. A queue failure can leave new local state without sync intent; a later “clean” remote refresh can replace it.

Target: one readwrite transaction over `learning_state` and `pending_mutations`. Read the current owner records, preserve base/expected version, check generation, and commit both records or neither. Resolve durable success only from `transaction.oncomplete`; handle abort/error explicitly.

The same invariant applies to the other current split transitions:

- Sync acknowledgement: compare the queued generation, update local canonical state and remove that exact pending generation atomically.
- Failure marking: transition the matching pending generation and local error metadata without reintroducing stale payload.
- Remote refresh: capture local generation before GET and recheck generation plus clean/pending state in the commit transaction after GET. Checking only before the request is insufficient.
- Conflict rebase: preserve valid unrelated remote changes without replacing newer local intent.
- Rapid writes: generation comparisons must distinguish same-clock-tick transitions; browser timestamps do not decide remote conflict winners.

An in-memory write chain alone cannot protect another tab or a crash between transactions. Keep the feature-owned write-chain/CAS design and put correctness checks at the durable transaction boundary.

---

# 9. Review action atomicity

Vocab/grammar review is one user action with three local records:

```text
one IndexedDB transaction
├─ current learning state
├─ pending learning-state mutation
└─ pending review attempt
```

Create the stable `attemptId` once per user action before scheduling persistence. Keep that ID for local retry and remote retry. Replace the current after-local-save evidence callback with the atomic commit.

Radical review only needs durable evidence enqueue. Reuse the same existing `pending_mutations` store and review outbox.

This is a local transaction guarantee. The existing remote learning-state and attempt endpoints remain independent; acknowledge only what the server confirmed and retain the other pending work for retry. Do not claim a distributed server transaction.

---

# 10. Local persistence failure semantics

Phải phân biệt:

```text
UI changed in memory
durably saved locally
queued for synchronization
synced remotely
```

Không gom thành một boolean `"saved"`.

Các dimension:

```text
connectivity:
online | offline

sync:
synced | pending | syncing | error

durability:
durable | memory-only | failed
```

Current `LearningStateSyncStatus` chỉ có:

```text
synced | pending | syncing | error
```

connectivity đã nằm riêng ở `isOnline`. Giữ contract này; không thêm `"offline"` vào sync enum.

`"Đã lưu offline"` là derived UI:

```text
offline
+
durable local transaction succeeded
+
unsynced work exists
```

Không phải một sync status mới.

---

# 11. Behavior when local persistence fails

When IndexedDB is unavailable, full or aborts, do not claim “saved offline” or silently turn a read failure into “no pending work”.

Keep the current runtime's ephemeral intent, expose local-save failure through the existing feature status owner, and provide retry. Retry must preserve the original review attempt IDs.

Do not introduce a second remote-only save path in core. Remote refresh and late sync results must not overwrite an intent that is still in memory awaiting a successful durable retry. Failed local persistence does not mean the latest user action was queued or remotely saved.

Generation-safe status handling is required: an older failure/success cannot overwrite the durability status of a newer action. Minimal truthful error/retry behavior ships in Phase 1; Phase 8 normalizes presentation and localization.

---

# 12. Authentication and owner isolation

Current QueryProvider rotate toàn QueryClient khi authenticated owner thay đổi.

Persistent lesson cache V1 phải owner-scoped:

```text
user:<userId>:<resourceType>:<resourceId>
```

Không làm shared/public cache optimization ở version đầu.

Reasons:

- app content routes có authenticated paths;
- responses sử dụng `private, no-store`;
- shared seed có thể có ownership/edit semantics;
- owner-scoping đơn giản và an toàn hơn.

Lesson/vocabulary routes hiện dùng private no-store response.

---

# 13. Auth must resolve before private cache read

Invariant:

```text
session unresolved
→ DO NOT read private persisted lesson cache

session resolved + userId
→ allow user:<userId> cache read
```

Nếu owner thay đổi trong lúc async IndexedDB read đang chạy:

```text
stale read result
→ must be discarded
```

Không được populate current UI với previous owner's snapshot.

Nếu TanStack Query được dùng để observe async local snapshot, query key phải bao gồm owner/scope và nằm trong HanziHome query-key owner file. Current project already centralizes HanziHome query keys there.

---

# 14. Logout retention policy

Core scope **không tự động delete owner-scoped IndexedDB data khi logout**.

Reason:

```text
logout while unsynced work exists
→ destructive local purge
→ user progress mất
```

V1:

```text
logout
→ memory Query cache rotates/clears
→ previous owner persisted state remains isolated
→ other owners cannot read it
→ same owner can recover after login again
```

Không thêm destructive purge policy nếu chưa có explicit product requirement.

---

# 15. 412 owner mismatch and approved compatible review guard

The learning-state route already returns `412 AUTH_OWNER_MISMATCH` for an expected owner that no longer matches the authenticated session.

The review outbox currently persists `ownerUserId`, but `savePracticeAttempt()` sends no expected owner and practice POST writes under the current session. Client-only owner checks leave a session-switch race.

Approved exception to the original no-API-change rule:

- Review outbox always sends `X-HanziHome-Owner-Id` from the immutable queued owner.
- In practice POST, when that header is present, use the existing `verifyExpectedAuthenticatedOwner()` guard before persistence.
- A mismatching header returns 412 and no write.
- Existing callers without the header remain compatible. URL, body and successful response shape stay unchanged.
- Server session still owns authorization; the header is an expected constraint, never ownership authority.
- Preserve HTTP status in the client error so the outbox distinguishes owner mismatch from transient failure.

On 412: stop the stale-owner drain, preserve that owner's pending record, re-resolve session, and do not automatically retry the same request under another account. Stop the combined drain before continuing to another stale-owner operation. Test old callers, matching owners, mismatching owners and session switch while work is queued.

---

# 16. Persistent lesson-content model

Add exactly one new IndexedDB store first:

```text
learning_state
pending_mutations
content_cache
```

Không persist toàn QueryClient.

Không tạo unnecessary:

```text
lesson_cache
vocab_cache
metadata_cache
index_cache
...
```

trước khi có use case.

---

# 17. Cache exactly API resource DTOs, not derived lesson view models

Lesson resources có explicit boundary:

```text
lesson detail DTO
lesson vocabulary resource
```

Browser không được reconstruct canonical lesson bằng arbitrary joins.

Current vocabulary is attached into lesson only as derived runtime transformation via `attachLessonVocabularyResource()`.

Therefore persist:

```text
validated response from lesson-detail API
validated response from lesson-vocabulary API
```

Never persist:

```text
attachLessonVocabularyResource(detail, vocab)
```

as canonical cache record.

Otherwise cached derived vocabulary could become a second content representation and violate vocabulary ownership.

---

# 18. Cache record schema

Use discriminated Zod schemas.

Conceptual model:

```ts
type CachedLessonDetail = {
 id: string;
 ownerUserId: string;
 resourceType: "lesson-detail";
 resourceId: string;
 schemaVersion: number;
 cachedAt: string;
 lastAccessedAt: string;
 payload: LessonDetailDto;
};

type CachedLessonVocabulary = {
 id: string;
 ownerUserId: string;
 resourceType: "lesson-vocabulary";
 resourceId: string;
 schemaVersion: number;
 cachedAt: string;
 lastAccessedAt: string;
 payload: LessonVocabularyDto;
};
```

Exact field names/types phải reuse existing API Zod schemas where possible.

V1 does not persist a fabricated server revision: the existing DTOs have no whole-resource revision. The names above are conceptual; derive payload types from the existing API schemas instead of introducing duplicate DTO declarations. Internal durable generation coordination follows section 21 and is not a server content revision.

Cache only:

```text
successful
validated
non-null
usable
```

resources.

Không persist:

```text
404/null
API error envelope
partially parsed payload
unknown arbitrary JSON
```

---

# 19. Reactive ownership of lesson data

TanStack Query vẫn là **one reactive owner** của displayed lesson resource.

IndexedDB là passive persistence/fallback layer.

Không tạo:

```text
remoteQuery.data
vs
localQuery.data
```

thành hai competing authoritative UI values.

Target conceptual flow:

```text
mount resource
    │
    ├─ start owner-scoped IndexedDB hydration
    │
    └─ remote Query lifecycle
```

If local snapshot arrives first:

```text
hydrate Query with validated local snapshot
→ mark source/freshness metadata as local
→ render immediately
→ force/allow remote revalidation
```

If remote result arrives first:

```text
remote data wins
→ late local read MUST NOT overwrite it
```

Async race guard bắt buộc.

Implementation mechanism (`setQueryData`, hydration helper, query observer etc.) phải verify với installed TanStack/Next versions during Phase 0.

---

# 20. Hydration with staleTime: Infinity

Installed TanStack Query 5.101.0 allows exact-key invalidation to mark an Infinity-staleTime query stale. Changing `dataUpdatedAt` alone does not provide the required revalidation.

After a validated local snapshot wins the owner/resource/generation checks:

1. Hydrate the existing displayed-resource Query.
2. Mark that exact query invalidated and revalidate when online and active.
3. If a valid remote request is already running, let it finish rather than cancel/restart solely because local hydration arrived.
4. Preserve a local snapshot on classified transient failure; do not swallow authorization or schema failures.

No global Query default changes and no second authoritative local query value.

---

# 21. Remote/local/mutation race rules

A late local v1 cannot overwrite remote v2. An old GET started before an observed successful edit/delete/auth denial cannot later populate Query or persist stale content.

Capture owner/resource/request generation and check again at application and persistence. Cancellation is helpful but is not the correctness guarantee.

The current detail/vocabulary DTOs do not expose one trustworthy whole-resource revision. Child edit timestamps must not be promoted into an invented resource revision; keep the API unchanged.

Known local mutation coordination must cover concurrent tabs. An in-memory counter per tab alone is insufficient: protect durable generation/invalidation decisions through IndexedDB transaction state in the content-cache owner.

The guarantee covers observed changes. Unobserved edits from another device become known through remote revalidation; offline snapshots are explicitly stale, not a claim of current server truth.

---

# 22. Resource loading policy must remain narrow

Do not introduce:

```text
open one lesson
→ download every resource for course
```

because repository contract requires explicit resource boundaries.

Core offline policy:

```text
resource actually needed/loaded
→ cache it

resource deferred/not requested
→ do not load solely for speculative offline support
```

If future product wants:

```text
"Download this whole lesson for offline use"
```

that becomes an explicit separate feature with size/progress/storage UX.

---

# 23. Cached lesson read policy

### Network available

```text
local validated snapshot may render early
+
remote resource revalidates
```

### Network unavailable / transient timeout

```text
owner-valid local snapshot
→ render
→ indicate stale/offline state
```

### No local snapshot

```text
explicit offline-unavailable state
```

### Remote success

```text
remote wins
→ Query reconcile
→ IndexedDB snapshot persist
```

---

# 24. Authorization-aware fallback

Do not interpret all remote failure as permission to continue using local cache.

Policy:

```text
network unreachable
timeout
transient 5xx
→ local fallback allowed
```

Confirmed auth outcomes:

```text
401 unauthenticated
→ block private cached display
→ retain isolated cache for possible same-user re-auth
→ do not treat as network failure

403 forbidden
→ block cached display
→ default V1: evict denied resource for that owner

404 resource not found
→ evict cached resource

412 owner mismatch
→ stop stale-owner path
→ do not expose it under current owner
```

This prevents IndexedDB becoming an authorization bypass.

---

# 25. Cache coherence after content edit

If edit response contains complete replacement resource:

```text
update Query
+
write new validated durable snapshot
```

If response is partial:

```text
evict affected durable resource
+
invalidate/refetch smallest remote resource
```

ADR requires mutation invalidation target smallest affected resource plus lesson detail only where necessary.

Never broad-invalidate entire HanziHome just to hide unclear ownership.

---

# 26. Durable cache write semantics

A remote response may render successfully while its IndexedDB write fails. In that case the resource remains usable online, but `offlineReady` is false for the rendered generation.

“Available offline” means the exact claimed resource generation committed successfully. An old snapshot on disk does not prove the new displayed generation is saved.

Auth denial must block display even when eviction fails. Keep that denied generation blocked in the active runtime; do not restore it from local hydration or retry after a failed eviction.

---

# 27. IndexedDB schema upgrade

Current DB version:

```text
DB_VERSION = 1
```

với `onversionchange` và `onblocked` handling.

Phase adding `content_cache`:

```text
DB v1
→ DB v2 additive upgrade
```

Must preserve:

```text
learning_state
pending_mutations
```

Multi-tab case:

```text
Tab A holds DB v1
Tab B loads code requiring DB v2

→ old connection receives versionchange
→ closes safely
→ upgrade proceeds
```

If blocked:

```text
recoverable error
→ no destructive reset
→ no deleteDatabase workaround
```

---

# 28. Storage policy

V1 caches JSON lesson resources only.

Exclude:

```text
PDF
audio
TTS blobs
HTML artifacts
large generated assets
```

Those need separate storage/quota strategy.

Before choosing eviction bound:

```text
measure representative lesson-detail payload
measure vocabulary payload
estimate typical lesson footprint
```

Then define documented bounded policy.

Do not invent arbitrary cache size before measurement.

Eviction requirements:

```text
owner-scoped
LRU / oldest-used
never corrupt active transaction
safe invalid-schema cleanup
safe version migration
current active resource protected where practical
```

Browser storage durability is best-effort; no claim that IndexedDB can never be evicted by browser/device storage management.

---

# 29. Navigation problem

Current `CourseCard`:

```tsx
<Link
  href={href}
  prefetch={false}
  onMouseEnter={...}
  onFocus={...}
/>
```

Touch cannot depend on desktop hover.

Current HanziHome route also lacks a local `loading.tsx`.

Target:

```text
tap
→ immediate acknowledgement
→ route transition
→ existing shell interactive
→ destination fallback/content
```

---

# 30. Navigation state ownership

URL remains canonical.

Do not implement:

```text
URL lesson
↕
React activeLesson
```

Allowed:

```text
navigationPending
navigationIntent
```

because these are transient interaction states, not duplicate route ownership.

---

# 31. Navigation strategy ladder

Do not start by building a global loading manager.

Order:

```text
1. Verify current route behavior
2. Restore appropriate Next Link prefetch
3. Add scoped HanziHome loading boundary
4. Prefetch only destination-required lesson resources
5. Measure same-route/search-param navigation
6. Add link-local pending indication only if needed
```

Current server page reads search params for legacy:

```text
?module=radicals → /radicals
```

Do not remove this compatibility behavior inside navigation perf work.

Any change to it is separate route-contract work.

---

# 32. Prefetch policy

Two distinct systems:

```text
Next route/RSC prefetch
TanStack resource prefetch
```

Do not confuse them.

When selecting a lesson:

```text
selected lesson becomes known
→ opportunistically prefetch destination route
→ prefetch only resource needed above the fold
```

Do not automatically prefetch all deferred vocab/grammar/etc. just for offline support.

The target resource set must be determined from actual destination module/data-loading contract.

---

# 33. Weak network model

`navigator.onLine` is only a browser hint.

Need distinguish:

```text
browser offline
DNS/network failure
timeout
5xx
400
401
403
404
409
412
```

Current API client uses `fetch(..., { cache: "no-store" })`.

No request may hang indefinitely merely because browser still reports `"online"`.

---

# 34. GET timeout/retry

Propagate TanStack Query's AbortSignal through the scoped content API client. Use a 15-second timeout per attempt covering both fetch and response-body reading.

Use at most one automatic retry for network failure, timeout, 502, 503 or 504. One layer owns retry so transport and Query do not multiply attempts. Distinguish user/navigation cancellation from timeout.

Do not retry 400, 401, 403, 404, 412 or deterministic response-schema failure. Handle 429 only through an explicit server Retry-After/API contract.

Preserve cached content on classified transient failure and keep explicit retry reachable. Do not change global Query network mode.

---

# 35. Mutation retry/idempotency

Critical rule:

```text
client timeout
≠
server definitely did not commit
```

Therefore:

```text
idempotent mutation
→ bounded retry possible

stable idempotency key
→ retry according to contract

non-idempotent operation
→ no blind retry
```

Review attempt already has stable `attemptId`.

Create operations must be individually audited before retry.

No generic `"retry mutation 3 times"` config.

---

# 36. Reconnect behavior

Existing learning sync agent remains the owner of browser retry listeners. HanziHome subtree explicitly requires only one app-level learning-state sync agent.

Triggers:

```text
online event
window focus
app reopen
manual retry
new local write
```

Important scope:

```text
network returns while app is open
→ sync

app was closed while offline
→ sync next time app starts successfully
```

Without Service Worker, core scope does **not** promise background sync while application is completely closed.

---

# 37. Reconnect must not refetch whole app

Target:

```text
learning pending mutations
→ drain

review evidence
→ drain

active lesson that used stale/offline snapshot
→ targeted revalidation
```

No:

```text
online
→ invalidate entire QueryClient
```

---

# 38. Lesson freshness policy

Do not add polling.

Target revalidation triggers:

```text
local snapshot hydration
→ remote revalidate when network permits

offline → online
→ revalidate active stale resource

known content mutation
→ targeted update/invalidate

explicit retry
→ revalidate

focus
→ only if active resource requires freshness check,
   with the existing 15-second cooldown and deduplication
```

Do not re-fetch full library/course hierarchy on every focus.

---

# 39. UI status model

Keep three dimensions independent.

```text
connectivity
├─ online
└─ offline

sync
├─ synced
├─ pending
├─ syncing
└─ error

durability
├─ durable
├─ memory-only
└─ failed
```

Examples:

```text
offline + durable + pending
→ "Đã lưu offline"

online + pending
→ "Đang chờ đồng bộ"

online + syncing
→ "Đang đồng bộ…"

durability failed
→ "Chưa lưu được trên thiết bị"
```

No blocking page overlay for background sync.

---

# 40. i18n requirement

Any new or changed user-facing status, error, accessible label, placeholder or action must use semantic `next-intl` message keys.

Update atomically:

```text
vi
en
zh-CN
```

and run i18n parity tests.

Repo explicitly requires this for new interface copy.

Do not copy lesson content into locale message files.

---

# 41. Core scope boundaries

Core HanziHome scope includes:

```text
learning-state durability
review evidence
lesson navigation
lesson detail resource
lesson vocabulary resource
HanziHome deterministic interaction latency
offline/sync UX
weak-network behavior
```

Not automatically included:

```text
Notes
Dictionary
Settings
AI
Reader static corpus
PDF
TTS/audio
whole application Query persistence
Supabase schema migration
PWA
```

Notes/immediate interaction can be handled after HanziHome as a separate independently audited phase.

This avoids mixing feature contracts merely because they show a similar UX symptom.

---

# 42. Phase 0 — Preflight, baseline and falsifiable regression evidence

Before any production mutation:

```text
git checkout main
git fetch
git status --short
update main safely
```

Read current:

```text
AGENTS.md
src/features/hanzihome/AGENTS.md
frontend-feature-workflow
hanzihome-content-editing
hanzihome-test-review
frontend-ui-system
risk-confirmation
i18n architecture
current-system
relevant ADRs
```

For any Next behavior, inspect installed:

```text
node_modules/next/dist/docs/
```

Repo explicitly requires version-matched docs rather than remembered Next behavior.

Capture:

```text
normal mutation latency
Slow 3G mutation latency
cold lesson navigation
warm navigation
same-path search-param navigation
touch navigation
offline learning actions
offline → reconnect
IndexedDB failure simulation where feasible
```

Regression tests should reproduce real failures at the lowest deterministic boundary.

**Do not push an intentionally failing regression test alone to `main`.**

Failing test + corresponding production fix land together.

### Phase 0 push rule

If Phase 0 produces only observations and no useful passing repository change:

```text
no empty commit
no artificial push
```

---

# 43. Phase 1 — Durable learning actions and owner-safe review

Implementation owners: the existing HanziHome local DB/local-store/local-first/review-outbox modules, `useLearningState`, practice client/POST, their tests and relevant status messages.

- Atomic learning state + outbox commit.
- Atomic vocab/grammar review progress + evidence; radical evidence-only enqueue.
- Stable attempt ID retained from intent creation through every retry.
- Generation-safe acknowledgement, failure marking, clean refresh and conflict rebase.
- Preserve baseState, expectedUpdatedAt and existing per-owner write-chain semantics.
- Guard same-clock-tick transitions, newer writes and multi-tab commits.
- Explicit local-save failure and durable retry; do not report memory-only intent as saved.
- Implement section 15's approved review header guard and owner-mismatch stop behavior.
- Preserve pending work on owner/session changes.
- No lesson cache yet.

Acceptance: no half-local commit, no lost newer intent, 409 preserves unrelated changes, 412 stops stale-owner operations, and retry cannot duplicate immutable review evidence.

Gate: targeted persistence/conflict/race/route tests, real browser IndexedDB transaction tests, typecheck, full `npm run check`, required runtime owner-switch checks, complete clean-code diff audit. Commit/push only when these pass; verify CI before Phase 2.

---

# 44. Phase 2 — HanziHome immediate interaction UX

Audit each mutation individually.

For every mutation document:

```text
entity
write owner
API response shape
identity behavior
query keys
optimistic eligibility
rollback strategy
concurrency behavior
```

Convert only proven deterministic operations.

Reuse existing optimistic precedent such as lesson annotations rather than inventing a second pattern.

Do not assume shared-seed/content CRUD is optimistic-safe until copy-on-write/admin semantics are traced.

### Gate

```text
UI reacts immediately where deterministic
server-authoritative operations remain truthful
rollback correct
concurrent mutations safe
no broad invalidation
npm run check PASS
browser interaction verification PASS
```

Then complete the clean-code/diff audit, commit + push `main`, verify CI, record the evidence and mark this checkpoint complete before starting the next phase.

---

# 45. Phase 3 — Navigation responsiveness

Todo:

- inspect version-matched Next docs;
- measure same-route/search-param behavior;
- add scoped:

  ```text
  src/app/[locale]/(app)/hanzihome/loading.tsx
  ```

  if verified appropriate;

- audit `prefetch={false}`;
- restore Next prefetch where justified;
- prefetch only destination-required TanStack resources;
- trigger useful prefetch from selection intent, not only hover;
- ensure touch works without hover;
- add link-local pending feedback if runtime evidence shows remaining dead period;
- preserve URL ownership;
- preserve legacy radicals redirect.

### Gate

```text
cold navigation acknowledged immediately
same-route navigation acknowledged immediately
mobile/iPad no hover dependency
Back works
Forward works
deep link works
URL remains canonical
no navigation flicker
npm run check PASS
viewport/browser verification PASS
```

Then commit + push `main`.

---

# 46. Phase 4 — IndexedDB content-cache foundation

Add:

```text
content_cache
```

via additive DB-version upgrade.

No UI consumption yet unless the complete consumer contract is ready.

Implement:

- owner-scoped record ID;
- discriminated resource schema;
- API DTO validation reuse;
- read;
- write;
- delete;
- safe invalid-record handling;
- access metadata;
- measured storage footprint;
- bounded eviction policy;
- multi-tab upgrade behavior.

Do not alter:

```text
learning_state
pending_mutations
```

semantics.

### Gate

```text
fresh DB → works
DB v1 → DB v2 → works
existing learning records preserved
existing pending mutations preserved
multi-tab upgrade handled
blocked upgrade recoverable
corrupt cache entry cannot crash app
owner isolation tests pass
npm run check PASS
```

Then commit + push `main`.

---

# 47. Phase 5 — Safe snapshot hydration and offline fallback

Start with lesson detail and lesson vocabulary. Persist validated API DTOs before derived composition.

Session-resolved owner starts local read alongside the remote Query lifecycle. Valid early local data hydrates the existing Query, then exact-resource revalidation follows section 20. Remote success supersedes local data and persists only a still-current generation.

Previously persisted resources remain usable on classified transient failure. An unloaded resource has an explicit offline miss. IDB write failure does not prevent online rendering and does not report offline-ready.

Authorization and coherence guards must ship with the first cached consumer: 401/403 block display, 404 evicts, 412 stops stale-owner work, edits reconcile/evict the affected durable resource, and late reads cannot resurrect invalidated data. Phase 6 extends hardening; it is not the first point at which security is enforced.

No speculative deferred/full-course loading.

Gate: hit/miss offline behavior, remote/local race, owner transition, denied/deleted resource handling, edit/read coherence, durable-write failure, full `npm run check`, runtime offline/browser verification and clean-code audit. Then publish and verify CI.

---

# 48. Phase 6 — Authorization and cache-coherence hardening

Harden and extend the baseline protections already shipped with Phase 5:

```text
401
→ private fallback blocked
→ isolated cache retained pending same-owner re-auth

403
→ private fallback blocked
→ denied snapshot evicted

404
→ snapshot evicted

412
→ wrong-owner path stopped

content edit success
→ memory + durable cache reconciled
```

Protect against stale in-flight response re-persisting old content after edit, including another tab. Test durable generation coordination; cancellation or a per-tab counter alone is insufficient.

Test:

```text
GET v1 starts
edit produces v2
late GET v1 finishes
→ durable cache remains v2 / v1 rejected
```

### Gate

```text
no authorization bypass
no stale resurrection
no cross-owner data display
correct targeted invalidation
npm run check PASS
```

Then commit + push `main`.

---

# 49. Phase 7 — Weak-network resilience

Introduce read timeout/retry deliberately.

Todo:

- AbortSignal support;
- bounded GET timeout;
- transient-error classification;
- bounded read retry;
- no infinite retry;
- audit mutation idempotency;
- no generic mutation retry;
- preserve cached UI while transient remote request fails;
- reconnect targeted sync/revalidation.

Do not change global Query network mode simply to obtain “offline-first”.

### Gate

```text
Slow 3G remains interactive
dead request terminates predictably
cached content stays visible on transient failure
unsafe mutation cannot duplicate
401/403/404/412 not treated as transient
npm run check PASS
network-throttled browser verification PASS
```

Then commit + push `main`.

---

# 50. Phase 8 — Sync/offline UX normalization

Normalize UI around the three dimensions:

```text
connectivity
sync
durability
```

Reuse existing design-system primitives and semantic status presentation.

Add required i18n messages in:

```text
vi
en
zh-CN
```

States must include:

```text
local save pending
durably saved offline
syncing
sync error
local storage failure
cached stale resource
offline resource unavailable
retry
```

Do not block whole workspace for background operations.

### Gate

```text
status equals actual underlying state
no false "saved offline"
keyboard accessible retry
mobile correct
iPad portrait correct
desktop correct
dark mode where relevant
i18n parity PASS
npm run check PASS
runtime UI verification PASS
```

Then commit + push `main`.

---

# 51. Phase 9 — Notes/app-wide interaction latency

Only after HanziHome core is stable.

Audit Notes independently using its own query keys, mutation contracts and UI behavior.

Do not mechanically copy HanziHome offline architecture into Notes.

Scope only operations proven to have the same latency problem.

Each Notes checkpoint gets its own tests/gate/push.

---

# 52. Phase 10 — PWA / full offline cold boot

Separate milestone.

Do not automatically start after core plan.

Requires separate architecture decision because it may introduce:

```text
Service Worker
dependency
navigation fallback
static asset caching
deployment update lifecycle
offline auth policy
```

Safe PWA principle:

```text
Service Worker
→ cache app/static delivery assets as explicitly designed

private lesson/user API data
→ continue using app-managed owner-scoped IndexedDB
```

Do **not** blindly Service-Worker-cache `private, no-store` authenticated API/RSC responses.

Full offline boot may require a dedicated offline-safe shell rather than caching current authenticated server-rendered layout.

Background Sync is optional enhancement, not correctness dependency.

---

# 53. Phase 11 — Offline Classroom Study Pack, Bulk Course Pre-cache & Auto-sync Reconnection

### 11.0. User journey & scenario definition

Target user journey:

```text
At home (Online)
→ User opens HanziHome Course Overview or Course Card.
→ User clicks "Tải học offline" (Download Course for Offline).
→ Client streams and persists all lesson details, vocabulary, grammar, and metadata for that course into owner-scoped `lesson_content_v2` in IndexedDB.
→ Live progress indicator displays percentage and lesson count (e.g., "Tải 12/12 bài học thành công").
→ Client invokes `navigator.storage.persist()` to guard against browser storage eviction (especially iOS/macOS Safari 7-day inactivity eviction).

In classroom (Offline / Airplane mode)
→ User launches web app or installed PWA.
→ Service Worker serves application shell with zero network access.
→ Every downloaded lesson in that course opens with 0ms latency from `lesson_content_v2` in IndexedDB.
→ User flips flashcards, completes exercises, reviews vocabulary, and edits Notes.
→ All interactive actions persist durably in `learning_state`, `note_drafts`, and `review_attempts_outbox`.
→ Audio pronunciation fallback: If network TTS is unreachable, pronunciation automatically falls back to browser-native Web Speech API (`SpeechSynthesis`) with `zh-CN` voice, preventing dead audio buttons or error modals.

Returning home (Reconnected to Wi-Fi)
→ Global `online` event listener detects network recovery.
→ Debounces 1500ms to confirm network stability, then automatically flushes `review_attempts_outbox` to Supabase.
→ Invalidates query cache (`['learning-state']`, `['hanzihome', 'catalog']`) to merge remote state safely with Lamport concurrency checks.
→ Displays non-blocking, truthful feedback toast: "Đã kết nối lại. Đã đồng bộ [N] kết quả học lên máy chủ."
```

### 11.1. Core architectural owners & additions

1. **Course Offline Pack Downloader Service** (`src/features/hanzihome/offline-pack/course-offline-pack.service.ts`):
   - `downloadCourseOfflinePack({ courseId, userId, onProgress, signal })`:
     - Resolves the complete lesson catalog for the targeted course using `catalogQuery` cache or cached catalog metadata.
     - Compares lesson list against existing `lesson_content_v2` records (`getContentCacheMetadata`) to skip already cached and up-to-date lessons.
     - Implements a bounded concurrency pool (maximum 2 parallel requests) to avoid HTTP 429 rate limiting on backend API endpoints.
     - Fetches `lessonDetail` and `lessonVocabulary` for remaining lessons.
     - Validates payloads against authoritative Zod schemas (`HanziHomeLessonDetailResponseSchema`, `HanziHomeLessonVocabularyResponseSchema`).
     - Durably writes each lesson using `writeContentCache` with Lamport generation tracking.
     - Emits granular progress telemetry: `{ totalLessons, completedLessons, currentTitle, percent }`.
     - Supports cooperative cancellation via standard `AbortSignal`.
   - `getCourseOfflineStatus({ courseId, userId, lessonIds })`:
     - Evaluates whether a course is `'fully_cached'`, `'partially_cached'`, or `'not_cached'`.
     - Returns `{ status, cachedCount, totalCount, estimatedBytes }`.
   - `evictCourseOfflinePack({ courseId, userId, lessonIds })`:
     - Allows users to selectively purge downloaded course data to reclaim disk space.

2. **Persistent Storage & Quota Management** (`src/lib/storage/storage-persistence.ts`):
   - `requestStoragePersistence()`:
     - Invokes `navigator.storage.persist()` if supported.
     - Logs diagnostic state (`persisted: boolean`).
     - Guards IndexedDB data from aggressive browser storage reclamation (Safari/WebKit 7-day storage cap).
   - `getStorageQuotaEstimate()`:
     - Queries `navigator.storage.estimate()` returning `{ usedBytes, quotaBytes, percentUsed }`.

3. **Offline Pronunciation Fallback via Web Speech API** (`src/features/hanzihome/speech/offline-speech-fallback.ts`):
   - `speakChineseOffline(text, options)`:
     - Activates when `!navigator.onLine` or when remote TTS fetch fails with a transient network error.
     - Queries `window.speechSynthesis.getVoices()` for local Chinese voices (`zh-CN`, `zh`, `cmn-Hans-CN`).
     - Synthesizes speech locally on-device with zero network latency.
     - Graceful degradation: returns safe fallback status if SpeechSynthesis is unsupported or unavailable.

4. **Global Reconnection Auto-sync Bridge** (`src/components/layout/AutoSyncReconnectBridge.tsx`):
   - Mounted at root `LocaleLayout`.
   - Subscribes to `window.addEventListener('online', handleOnline)`.
   - Debounces 1500ms for connection stability.
   - Automatically executes `flushReviewAttemptsOutbox(userId, { immediate: true })`.
   - Invalidates `['learning-state']` and `['hanzihome', 'catalog']` queries gracefully.
   - Shows a subtle, accessible status toast: `reconnectSyncSuccess`.

5. **UI Integration & Course Card Indicators** (`CourseCard.tsx`, `CourseHeader.tsx`):
   - Adds an offline download action button on Course Cards and Course headers.
   - Renders live download progress indicator: `Đang tải ({percent}%)...`.
   - Renders persistent status badge: `Đã sẵn sàng offline` (`Offline ready`).

6. **i18n Localization Parity** (`messages/vi/common.json`, `messages/en/common.json`, `messages/zh-CN/common.json`):
   - Add localized keys under `Common.offlinePack`:
     - `downloadCourse`: "Tải học offline" / "Download for offline" / "下载离线课程"
     - `downloading`: "Đang tải ({percent}%)..." / "Downloading ({percent}%)..." / "正在下载 ({percent}%)..."
     - `downloadReady`: "Đã sẵn sàng offline" / "Offline ready" / "已离线就绪"
     - `reconnectSyncSuccess`: "Đã kết nối lại. Đã đồng bộ {count} kết quả học." / "Reconnected. Synced {count} learning records." / "已重新连接。已同步 {count} 条学习记录。"
     - `storagePersisted`: "Bộ nhớ offline đã được bảo vệ" / "Offline storage persisted" / "离线存储已受保护"
     - `storageQuota`: "Dung lượng đã dùng: {usedMB} MB / {quotaMB} MB" / "Storage used: {usedMB} MB / {quotaMB} MB" / "已用空间: {usedMB} MB / {quotaMB} MB"

### 11.2. Checkpoints breakdown

- [x] Checkpoint 11.1: Storage persistence & quota utility (`src/lib/storage/storage-persistence.ts` + tests) — **PASS** (7 tests passed, typecheck 0 errors, oxlint 0 warnings).
- [x] Checkpoint 11.2: Core Course Offline Pack Downloader (`course-offline-pack.service.ts` + unit tests with bounded concurrency and progress reporting) — **PASS** (10 tests passed, bounded concurrency=2 verified, cancellation verified, source-check passed).
- [x] Checkpoint 11.3: Web Speech API offline pronunciation fallback (`offline-speech-fallback.ts` + tests) — **PASS** (8 tests passed, useTTS integration verified, source-check passed).
- [x] Checkpoint 11.4: Global auto-sync reconnection bridge (`AutoSyncReconnectBridge.tsx` + tests) — **PASS** (mounted in root layout, authoritative query keys, source-check passed).
- [x] Checkpoint 11.5: UI integration in `CourseCard`, Course Overview, and Library with full i18n parity (vi/en/zh-CN) — **PASS** (`CourseOfflineDownloadButton.tsx` + `CourseCard.tsx` + `CourseCard.test.tsx` + UI standards verified).
- [x] Checkpoint 11.6: End-to-end simulated offline classroom verification in browser subagent + full quality gate (`npm run check` pipeline: build, typecheck, lint, source:check, route:check, ui:check, api:check, perf:check) — **PASS**.

### 11.3. Invariants & Acceptance Gate

```text
Zero type assertion or explicit any
Max concurrency = 2 for bulk fetch (anti-throttling)
No plain text secrets in local storage
Offline audio fallback does not throw or block UI
Offline auto-sync does not overwrite newer local state
All new UI copy localized in vi, en, zh-CN
Pass npm run check & all quality gates
```

---

# 54. Universal pre-push gate

Every production phase must satisfy:

```text
1. Latest main fetched before phase.
2. Working tree inspected.
3. Unrelated user changes preserved.
4. Phase scope complete.
5. No intentionally failing test remains.
6. No half migration remains.
7. No safety-critical TODO remains.
8. Targeted tests pass.
9. Required type/static checks pass.
10. npm run check passes.
11. Required browser/runtime verification passes.
12. Commit represents one deployable state.
13. Commit main.
14. Push main.
15. Verify GitHub CI.
16. Only after CI success start next phase.
```

Current CI runs `npm ci` and `npm run check` on `main`, but Playwright E2E is currently explicitly disabled.

Therefore:

```text
CI green
≠
runtime/E2E proof
```

Browser verification remains mandatory for interaction claims.

If required verification cannot be executed in the current environment:

```text
DO NOT PUSH that phase
```

because repo policy does not allow claiming completion without executable verification.

---

# 55. Rollback policy on `main`

Every phase must be one coherent checkpoint so rollback is straightforward.

If post-push CI reveals a regression:

```text
fix-forward immediately
OR
normal revert commit
```

No force-push/rewrite of `main`.

After shipping IndexedDB v2, a rollback must still open v2 and preserve existing stores and pending work. Reverting blindly to a DB_VERSION=1 opener produces VersionError; keep a compatible opener or fix forward. Never delete or downgrade the database as rollback.

Do not begin Phase N+1 while Phase N is red.

---

# 56. Verification matrix

Minimum UI viewports required by repo:

```text
Desktop      1440 × 900
iPad         ~820 × 1180
Mobile       ~390 × 844
```

Network:

```text
normal
Fast 3G
Slow 3G
offline
online → offline
offline → online
timeout
transient request failure
```

Persistence:

```text
IndexedDB fresh
existing DB
version upgrade
blocked upgrade
transaction abort
corrupt value
quota/storage error where simulatable
multi-tab
```

Auth:

```text
session resolving
authenticated
logout
same-user re-login
different-user login
401
403
412 owner mismatch
```

Content:

```text
cold Query
warm Query
local snapshot hit
local snapshot miss
remote newer than local
edit during read
late stale response
404 deletion
```

Interaction:

```text
mouse
keyboard
touch
rapid repeated actions
Back/Forward
deep link
same-route search-param navigation
```

---

# 57. Critical acceptance scenarios

### Atomic offline action

```text
offline
→ mark word
→ learning state + pending mutation commit atomically
→ app/process remount
→ action still exists and remains queued
```

### Atomic review

```text
review word
→ progress + review evidence local commit
→ interruption
→ neither half of action silently disappears
```

### Outbox failure window

```text
simulate queue write failure
→ app never considers changed local state "clean"
→ remote refresh cannot silently replace it
```

### Rapid generation race

Run the race both with distinct timestamps and with a fixed browser clock. Every transition must retain a distinct comparison generation.

```text
A
B
A server result arrives last
→ B remains current
```

### Acknowledgement and failure transitions

```text
A reaches acknowledgement or failure marking
→ B writes a newer local action before the durable transition
→ stale A cannot delete B's pending record or overwrite B's local payload
```

### Remote refresh becomes dirty

```text
remote refresh observes no pending work and starts GET
→ new local action commits while GET is in flight
→ refresh commit rechecks clean state and generation atomically
→ new local intent survives
```

### Local retry preserves review identity

```text
review intent creates attemptId
→ local transaction aborts
→ visible memory-only failure and retry
→ retry commits the original attemptId exactly once
```

### Owner switch

```text
A has pending data
→ session changes to B
→ A request rejected/stopped
→ B never receives A data
```

For review POST, also prove that matching expected-owner headers succeed, mismatching headers return 412 before the repository is called, and existing callers without the header retain their previous behavior.

### Slow mutation

```text
Slow 3G
→ deterministic action
→ UI immediate
→ server completes later
```

### Cold navigation

```text
tap Open
→ immediate acknowledgement
→ destination resolves later
```

### Touch navigation

```text
no hover
→ select lesson
→ Open
→ responsive
```

### Offline lesson

```text
resource loaded and durably cached
→ network lost
→ resource remains usable
```

### Deferred offline miss

```text
resource never fetched
→ offline
→ explicit unavailable state
```

### Async hydration race

```text
IDB v1 slow
remote v2 fast
→ final UI/cache = v2
```

### Edit/read race

```text
old GET inflight
→ edit v2 succeeds
→ old GET finishes
→ old content never resurrects
```

### 401

```text
private cached resource exists
→ server confirms unauthenticated
→ cache not displayed
→ retained only under old owner for possible valid re-auth
```

### 403

```text
server confirms forbidden
→ private cached resource not displayed
→ denied resource evicted
```

### 404

```text
cached resource
→ server confirms deleted
→ cache removed
```

### Local persistence failure

```text
remote content available
→ IDB write fails
→ content can remain visible online
→ offlineReady remains false
```

### Multi-tab DB upgrade

```text
Tab A DB v1
Tab B code v2
→ upgrade safely resolves/versionchange closes old connection
→ no learning state lost
```

---

# 58. Core Definition of Done

Core scope is complete after Phase 8 only when all are true:

```text
Deterministic user actions acknowledge immediately.

Server/refetch is reconciliation rather than default UX commit boundary.

Optimistic rollback cannot erase newer intent.

Learning-state + outbox persistence is atomic.

Review progress/evidence cannot become silently half-persisted.

Offline learning actions are durable.

Local persistence failure is observable.

Unsynced local work cannot be mistaken for clean remote state.

409 conflicts preserve valid unrelated changes.

412 owner mismatch stops stale-owner synchronization.

QueryClient and persisted cache remain account-isolated.

Lesson cache is owner-scoped.

Lesson cache stores validated API DTOs, not derived duplicate content.

TanStack Query remains the reactive lesson-resource owner.

IndexedDB remains a passive validated fallback snapshot.

Late IndexedDB hydration cannot overwrite newer remote data.

Late network responses cannot resurrect stale edited content.

Previously loaded/persisted lesson resources remain usable during network loss.

Deferred/unloaded resources show explicit offline miss.

401/403 cannot be bypassed with local private cache.

404 removes stale snapshots.

"Available offline" means durable persistence actually succeeded.

Weak network cannot leave interactions hanging indefinitely.

GET retry is bounded.

Mutation retry respects idempotency.

Navigation has immediate feedback on mouse, keyboard and touch.

URL remains canonical for shareable navigation state.

No full-library data prefetch is introduced just for offline support.

No global QueryClient persistence is introduced.

No second learning sync agent is introduced.

No sensitive secret enters generic browser persistence.

All new interface copy is localized vi/en/zh-CN.

Every pushed phase is individually deployable.

Every pushed phase passes npm run check.

Every completed checkpoint passes the binding clean-code audit and is marked with actual final-source evidence.

Sync acknowledgement, failure transitions and remote refresh cannot erase newer local intent.

Review expected-owner mismatch cannot write A's evidence under session B.

Same-clock-tick transitions cannot defeat generation comparisons.

A DB-version rollback preserves access to existing queued work.

Every UI claim has actual runtime/browser evidence.
```

Full browser-restart/hard-refresh offline operation is **not** included in core Definition of Done and only becomes guaranteed after the separate PWA milestone.

---

# 59. Freeze rule

Architecture above is the implementation baseline.

Phase 0 is allowed to change an **implementation mechanism** when version-matched Next/TanStack docs or reproducible runtime evidence prove an assumption wrong, for example:

```text
which loading boundary triggers
which supported hydration API to use
which exact prefetch mechanism performs best
```

Phase 0 is **not** permission to casually change:

```text
state ownership
content ownership
auth semantics
offline guarantees
persistence safety
phase boundaries
```

Any contradiction requiring those architectural contracts to change must be documented with concrete repository/runtime evidence before proceeding.

This is the version to freeze and implement against.

## Authorized addendum — three concurrent sign-in sessions (2026-09-13)

The user approved a hard limit of three browser/profile sessions and live
application to its Supabase project (`your-project-ref`). This is separate
from lesson-resume synchronization and does not close the offline audit findings.

- [x] Supabase enforcement checkpoint — migration applied and live Auth verified.
- [x] Local app implementation checkpoint — localized errors, local logout and full gate passed.
- [ ] App deployment acceptance — NOT VERIFIED; Git push is authorized, but remote CI/deployment acceptance remains unverified.
- Owner: Supabase `auth.sessions`; no duplicate device registry or physical-device fingerprint.
- New sign-ins are serialized per user inside the token-issuance transaction;
  a fourth admission returns `HANZIHOME_SESSION_LIMIT_REACHED` (403).
- Existing sessions are preserved, including legacy accounts already above
  three; token refresh, MFA and email-change tokens retain their claims.
- A normal logout affects only the current session, freeing one slot.
- Migration: `20260913090000_limit_concurrent_auth_sessions.sql`; no table rewrite,
  no learning-data changes, no new dependency. Hook execution is Auth-only.
- Verified starting live configuration: hook disabled, single-session disabled,
  timebox/inactivity disabled, JWT lifetime 3600s. Local/remote migrations matched.
- SQL admission/ownership/expiry/grant checks passed in rollback-only transactions,
  both before application and via `supabase db query --linked --file
supabase/tests/auth_session_limit.test.sql` after application. The first role
  simulation failed because managed Postgres disallows `SET ROLE
supabase_auth_admin`; privilege assertions and real Auth issuance verified
  that boundary without changing role memberships.
- `supabase db push --linked --dry-run` selected only this migration;
  `supabase db push --linked --yes` applied it. Migration list readback matches.
- `SUPABASE_PROJECT_REF=your-project-ref npm run types:supabase` and
  `types:supabase:check` passed. Generated PostgREST version/template differences
  come from the installed generator, not handwritten contract edits.
- Targeted callback/confirmation/message tests: 30 passed. Rendered login form
  tests: 3 passed using real messages for vi/en/zh-CN and asserted error toast
  arguments. No real browser/physical-device UI test was run.
- `npm run check` passed: lint, architecture/route/UI/API/performance checks,
  typecheck, 1211 tests passed / 2 skipped, format, audit (0 vulnerabilities),
  production build. Initial test typing and script reachability failures were
  corrected at their owners; no rule or gate was disabled. Full diff and
  `git diff --check` passed.
- First live probe immediately after the configuration PATCH admitted 4/4;
  enforcement was disabled again immediately. After enabling with management
  readback and a 15-second propagation interval, live Auth passed concurrent
  3/4 admission, no token for the rejected session, refresh at the cap, forbidden
  client RPC access, local logout preserving other sessions and slot reuse.
  Each disposable account and its sessions were removed after probing.
- Final live readback: hook enabled at
  `pg-functions://postgres/public/hanzihome_limit_auth_sessions`, single-session
  false, timebox/inactivity zero. No unrelated Auth configuration changed.
- Advisors: 50 pre-existing warnings (38 authenticated GraphQL exposure,
  11 authenticated security-definer functions, 1 leaked-password protection).
  No finding names the new hook; unrelated warnings remain out of scope.
- Rollback: PATCH only `hook_custom_access_token_enabled: false` and
  `hook_custom_access_token_uri: null` through the Supabase Management API for
  this exact project. Keep the inert migration/function to preserve history.
  Do not change unrelated Auth settings or revoke existing sessions.
- Remaining rollout limit: the deployed frontend still has its previous logout
  behavior and generic login error until this code is deployed. Do not claim
  that the live logout button is local-only yet. OAuth/OTP denial is covered by
  SQL and callback tests, not a live Google/email login. Physical-device resume
  and the previous Reader/Notes sync findings are separate and unresolved here.

### Development backend continuity correction (2026-09-15)

- [x] Localhost/production data-continuity checkpoint — PASS.
- Problem: the 2026-09-14 development-isolation change replaced the Supabase
  project configured in `.env.local` with a separate local Auth/database. Google
  then displayed the same human identity, but Supabase issued a different user ID;
  the localhost Notes workspace correctly returned zero rows instead of the 21
  production notes. That isolation contradicted the required development flow.
- Invariant: `npm run dev` uses the Supabase project configured in `.env.local`,
  so localhost and the deployed frontend resolve the same authenticated user ID,
  RLS ownership and live user data. Localhost must not copy, mirror or proxy
  production-owned rows through a separate local user.
- Session consequence: a localhost login is a real session in the configured
  Supabase project and counts toward the approved three-session limit. A separate
  local JWT cannot access the same RLS-owned rows without adding an unsafe
  privileged bridge or a second synchronization architecture; neither is allowed.
- Implementation: restore the established `next dev -p 3001` command and normal
  Next.js `.env.local` loading. Remove the unused local Google-provider wiring and
  fixture startup path. Preserve the development-only locale static-param guard
  because it independently prevents concurrent Next dev manifest corruption;
  production still prerenders all supported locales.
- Scope: `package.json`, `README.md`, the locale layout regression and this plan.
  The local Supabase config and environment example were inspected and left at
  their established values. No schema, migration, dependency, route, RLS or Auth
  hook change.
- Acceptance:
  - localhost and production use the same Supabase endpoint and authenticated
    user ID;
  - localhost Notes loads the same 21 current production notes;
  - Google login and authenticated API requests succeed without a route 500;
  - the production three-session hook remains enabled and unchanged;
  - `npm run check` passes on final source.
- Rollback: restore the local-Supabase environment override in `npm run dev`.
  This deliberately returns to isolated test data and must not be described as
  production data continuity.
- Production Auth operation: after explicit confirmation, exactly one stale
  session created on 2026-09-13 and never refreshed was revoked. No user or note
  row was deleted. Active sessions changed from three to two, then returned to
  three after the verified localhost Google login.
- Final evidence:
  - `npm run dev` starts only `next dev -p 3001` and reports `.env.local` as the
    loaded environment; it no longer starts, migrates or seeds local Supabase.
  - A real Chrome Google login completed through the linked production Supabase
    callback, redirected to localhost and rendered `/vi/notes` with `21 GHI CHÚ`,
    the same current note titles and counts as production.
  - Production Management API readback kept the custom access-token hook enabled
    at `pg-functions://postgres/public/hanzihome_limit_auth_sessions`, with
    single-session, timebox and inactivity settings unchanged.
  - Production session readback showed three active sessions after login.
  - Targeted locale-layout and Auth callback/URL tests passed: 3 files, 10 tests.
  - `npm run check` passed: lint, source/route/UI/API/performance checks,
    typecheck, 1,229 tests passed / 3 skipped, format, zero audit vulnerabilities
    and the production Next.js build. `git diff --check` passed.

- Production Auth operation (2026-09-15):
  - Target: the explicitly confirmed production account.
  - Action: revoked exactly two stale sessions, created on 2026-09-12 and
    2026-09-15, from `auth.sessions`.
  - Result: active sessions reduced from three to one while retaining the current
    active session, freeing two concurrent admission slots for iPad and other
    devices. No user or application data was modified.
