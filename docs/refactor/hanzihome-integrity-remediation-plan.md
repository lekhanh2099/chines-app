# HanziHome Integrity Remediation Plan

Status: Phase 2–4 implementation and CI complete; deployed smoke and repository governance remain
Branch: `refactor/hanzihome-integrity-remediation`  
Base branch: `main`  
Base SHA: `864037d31376bbff3854e8198695be6259a969e4`  
Base commit: `refactor(hanzihome): consolidate learning state ownership`  
Created: 2026-08-19  
Execution mode: phased, small coherent batches, documentation checkpoint after every batch

## 1. Purpose

This document is the authoritative execution plan for the post-audit HanziHome refactor. It converts the architecture/security/data findings into ordered implementation work with explicit ownership, scope, risk gates, acceptance criteria, and verification.

The plan is intentionally broader than one bug fix, but implementation MUST remain incremental. A batch is complete only when its code/tests and this document are updated together.

Do not build a learner-facing Learning Overview/Progress dashboard until the underlying account isolation, attempt evidence, review scheduling, and completion semantics are trustworthy.

## 2. Repository contracts loaded for this plan

Before this plan was created, the following current `main` contracts were re-read:

- `AGENTS.md`
- `src/features/hanzihome/AGENTS.md`
- `.agents/skills/frontend-feature-workflow/SKILL.md`
- `.agents/skills/hanzihome-content-editing/SKILL.md`
- `.codex/skills/hanzihome-supabase-migration/SKILL.md`
- `docs/architecture/frontend-structure.md`
- `docs/agent/risk-confirmation.md`
- `supabase/AGENTS.md`

The nearest `AGENTS.md`, generated types, installed Next.js documentation, and local source remain authoritative while implementing each task.

## 3. Branch and checkout protocol

All implementation for this remediation train starts from:

```bash
git fetch origin
git checkout refactor/hanzihome-integrity-remediation
git pull --ff-only origin refactor/hanzihome-integrity-remediation
```

Before every implementation batch:

```bash
git status --short
git rev-parse HEAD
```

Rules:

1. Do not implement these changes directly on `main`.
2. Preserve unrelated work.
3. If `main` advances, do not merge/rebase automatically. Inspect the delta and confirm the integration strategy if it changes an active contract.
4. No force push.
5. No merge to `main` without explicit user authorization.
6. Every completed batch updates this document before handoff.

## 4. Status vocabulary

Each work item uses exactly one status:

- `TODO` — not started.
- `IN_PROGRESS` — active batch; plan checkpoint must name current scope.
- `BLOCKED_CONFIRMATION` — investigation is complete but a high-risk decision requires explicit user confirmation.
- `BLOCKED_DEPENDENCY` — prerequisite is incomplete.
- `DONE` — acceptance criteria met and stated verification actually ran.
- `DEFERRED` — intentionally postponed with reason.

## 5. Non-negotiable invariants

### 5.1 State ownership

```text
course mastery       -> user_learning_state.progress
saved vocab + SRS    -> user_vocab_progress
due practice queue   -> hanzihome_learning_loop_items
attempt evidence     -> hanzihome_practice_attempts
display preference   -> user_learning_state.settings
Reader progress      -> completion semantics + exercise answers only
```

These owners must not be silently mirrored.

### 5.2 Authenticated client isolation

No user-owned TanStack Query data, browser persistence, pending mutation, module-level in-flight worker, or cross-feature store status may execute or render under a different authenticated user.

### 5.3 Shared content integrity

Shared/canonical Dictionary and HanziHome content must not be writable merely because a browser session is authenticated. User-owned SRS/notes/progress may reference canonical data, but ordinary learner actions must not silently mutate shared truth.

### 5.4 Review scheduling

A due queue must expose items whose `due_at <= now`. Future scheduled items are not due items.

### 5.5 Attempt evidence

Current/resumable state and immutable attempt evidence are separate concepts. A submitted/graded attempt should not disappear merely because the surface state changes.

### 5.6 High-risk confirmation

Any DB schema, RLS, grant, auth contract, production-data mutation, destructive persisted-state migration, route/public API break, dependency change, merge, or production deployment MUST stop for the required confirmation unless that exact mutation has already been explicitly authorized.

## 6. Master execution order

The ordering below is a dependency graph, not a suggestion.

```text
Phase 0 — Integrity and functional correctness
    ↓
Phase 1 — Learning data semantics
    ↓
Phase 2 — Persistence / BFF / DB consolidation
    ↓
Phase 3 — Product / IA / UI projections
    ↓
Phase 4 — release hardening and cleanup closeout
```

Do not pull a Phase 3 dashboard forward to compensate for incomplete lower-layer semantics.

---

# PHASE 0 — Integrity and functional correctness

## P0-01 — Authenticated client-state isolation

Status: `DONE`
Risk: high product/data integrity; source changes can begin only after tracing all consumers; DB mutation is not required for the first batch.

### Problem

User-owned client state is not consistently namespaced by authenticated user. The global QueryClient survives SPA auth transitions; several user-specific query keys are user-agnostic; learning-state IndexedDB/pending mutation records are singleton records; module-level sync/in-flight state is also global.

### Target state

```text
Authenticated identity
  -> user-scoped Query keys
  -> user-scoped local persistence
  -> owner-scoped pending writes
  -> owner-scoped in-flight/cooldown/sync UI state
  -> previous-user cache eviction on auth transition
```

### Primary scope

- `src/components/providers/QueryProvider.tsx`
- authenticated app/layout boundary
- `src/components/layout/ProfileSettingsMenu.tsx`
- `src/features/hanzihome/hooks/useLearningState.ts`
- learning-state local-first / IndexedDB adapters
- `src/features/hanzihome/query-keys.ts`
- `src/features/notes/query-keys.ts`
- user-specific Notes hooks
- `src/features/dictionary/query-keys.ts`
- Dictionary queries whose cached payload contains SRS/note ownership
- tests for auth transitions and account switching

### Explicit substeps

1. Inventory every TanStack Query payload containing user-owned data and every user-agnostic key.
2. Define one stable authenticated user identity boundary; do not create a parallel auth store if the existing session contract can own it.
3. Change user-owned query keys to include `userId` or an equivalent authenticated owner token.
4. Partition learning-state IndexedDB records by owner.
5. Add `ownerUserId` to pending mutation records or encode it in a validated owner-scoped identity.
6. Make pending mutation listing/sync owner-specific; never scan-and-send another user's mutation.
7. Scope/reset module-level write chains, in-flight requests, refresh cooldowns, and sync status by user.
8. On auth transition, cancel/evict previous-user sensitive query data and reset previous-owner client state.
9. Decide treatment of legacy singleton local records. Default rule: quarantine/discard; never silently assign legacy `current` state to whichever user logs in next.
10. Verify same-user offline/reconnect still works.

### Out of scope

- changing Supabase Auth provider;
- DB schema mutation;
- deciding Daily Reading device-owned vs user-owned storage; that is P1-07.

### Acceptance

- User B cannot render User A's Notes, Dictionary personal note/SRS status, learning settings, mastery, bookmarks, or pending-sync UI.
- User A pending learning-state mutation can never execute with User B credentials.
- Same-user refresh, offline write, reconnect, and conflict retry continue to work.
- Auth switch does not leave previous-user Query cache visible during background refetch.

### Required regression test

```text
A login
-> populate Notes + Dictionary personal state + learning state
-> create offline pending learning-state write
-> logout
-> B login in the same browser runtime
-> B sees none of A state
-> A pending mutation is not sent
-> B remote state remains unchanged
```

### Verification tier

Full persisted-state/auth-transition path. Targeted tests first; `npm run check` before phase closeout.

---

## P0-02 — Restore microphone capability for Shadowing without weakening unrelated permissions

Status: `DONE`
Risk: medium security/browser capability change.

### Problem

Global `Permissions-Policy` currently denies microphone while Shadowing calls `getUserMedia({ audio: ... })`.

### Target state

Allow same-origin microphone only where the product supports recording, while keeping camera/geolocation denied unless explicitly required.

### Primary scope

- `src/lib/supabase/middleware.ts`
- Shadowing recorder flow
- deployed response/header verification

### Implementation direction

Prefer the narrowest correct policy. Candidate:

```http
Permissions-Policy: camera=(), microphone=(self), geolocation=()
```

Verify installed/browser behavior before finalizing exact syntax.

### Acceptance

- Reader Shadowing can request/use microphone in a deployed browser.
- Denial and unsupported states still render correctly.
- Recording stop/unmount releases tracks.
- Camera/geolocation remain unavailable.

### Verification

Source test if feasible plus actual browser/deployed header and recording flow.

---

## P0-03 — Protect canonical/shared Dictionary writes

Status: `DONE`
Risk: `BLOCKED_CONFIRMATION` once RLS/grant/RPC changes are ready, because DB authorization changes are high-risk.

### Problem

Ordinary authenticated learner flows can mutate `dictionary_core` and legacy shared vocabulary cache. Inspector lookup tracking currently participates in shared upsert paths.

### Target state

```text
browser learner action
  -> user-owned lookup/SRS state only

canonical/shared dictionary write
  -> server-owned validated boundary
  -> provenance/merge policy
  -> explicit authorization
```

### Investigation scope

- `src/services/vocab.service.ts`
- Dictionary hooks and lookup routes
- `dictionary_core`
- `vocabularies`
- `upsert_legacy_vocabulary_cache`
- RLS policies/grants/functions touching shared dictionary cache
- generated types and migration history

### Substeps

1. Separate read-only lookup from canonical enrichment/upsert.
2. Identify every direct client call that can change shared dictionary/cache rows.
3. Define canonical write authority and provenance rules.
4. Route canonical writes through a server/BFF boundary.
5. Keep user SRS relationship user-owned.
6. Prepare explicit migration for RLS/grant/RPC changes.
7. STOP AND CONFIRM before applying schema/RLS/grant/function changes to any live target.

### Acceptance

- A normal lookup cannot alter shared meaning/pinyin/analysis.
- A normal SRS save changes only permitted user relationship/progress plus an authorized canonical operation if explicitly designed.
- Authenticated users cannot directly update shared canonical Dictionary rows through client credentials.
- Existing shared Dictionary reads still work.

---

## P0-04 — Make Review Queue truly due-aware

Status: `DONE`
Risk: medium behavior/API-query change; route contract impact must be inspected.

### Problem

The scheduler writes future `due_at`, but list/read behavior currently returns future scheduled items and the UI treats the first item as due.

### Target state

```text
Due queue      -> due_at <= now
Scheduled list -> due_at > now, separate projection if needed
```

### Primary scope

- Learning Loop repository/list query
- `/api/hanzihome/learning-loop`
- `LearningLoopWorkspace`
- query tests

### Acceptance

- `good` items scheduled for future days disappear from the due queue immediately.
- `again` items scheduled +10 minutes do not reappear before their due time.
- due count counts due items, not all scheduled items.
- empty due queue is a valid state even when future items exist.

---

## P0-05 — Drain learning-state sync until stable

Status: `DONE`
Risk: medium concurrency/state ownership.

### Problem

A mutation enqueued while another remote sync is in flight can remain pending after the first sync completes, because the second sync call reuses the existing in-flight promise instead of ensuring a subsequent drain.

### Target state

Sync worker guarantees that if a newer owner-scoped pending mutation exists when an in-flight write finishes, exactly one subsequent drain is scheduled/run until the queue is stable.

### Primary scope

- learning-state local-first sync worker
- sync agent
- deterministic concurrency tests

### Acceptance

- M1 in flight + M2 enqueued => M2 reaches remote without requiring focus/reconnect/third mutation.
- no duplicate uncontrolled sync loop.
- owner isolation from P0-01 is preserved.

---

## P0-06 — Fail closed on incompatible authoritative learning state

Status: `DONE`
Risk: medium/high data integrity; persisted-state migration decisions may require confirmation.

### Problem

One invalid subtree can cause the entire authoritative remote row to normalize to empty state, which can then participate in conflict rebase and overwrite valid data.

### Target state

```text
valid remote row      -> normalized state
legacy supported row  -> explicit migration/normalization
invalid remote row    -> typed incompatibility error; block automatic overwrite
```

### Primary scope

- `src/app/api/learning-state/route.ts`
- learning-state schema/normalizer
- local-first conflict code
- tests with malformed settings/progress/bookmark/history subtrees

### Acceptance

- invalid remote state never silently becomes authoritative empty state.
- unrelated valid remote branches are not erased because one legacy record is malformed.
- conflict handler surfaces an observable error/recovery path.

---

# PHASE 1 — Learning data semantics

Phase 1 starts only after P0-01, P0-04, P0-05, and P0-06 are stable.

## P1-01 — Complete deterministic 3-way learning-state merge semantics

Status: `DONE`

### Problem

Nested display preferences and bookmark arrays are currently merged too coarsely during conflict resolution, so unrelated remote edits can be lost.

### Target merge rules

- settings scalar fields: 3-way per field.
- `lessonTextDisplayMode`: 3-way per nested field.
- bookmark memberships: apply local add/remove delta to latest remote set.
- progress item conflicts: define explicit same-item rule before implementation.

### Acceptance tests

1. local changes `showPinyin`; remote changes `hanziSize` => both survive.
2. base bookmarks `[A]`; local adds `B`; remote adds `C` => result `[A,B,C]` modulo stable ordering policy.
3. local remove and remote unrelated add both survive.
4. same progress node edited concurrently follows the documented rule.

---

## P1-02 — Consolidate immutable review/practice evidence

Status: `DONE`
Risk: likely `BLOCKED_CONFIRMATION` before DB/schema changes.

### Problem

`user_learning_state.reviewHistory[]` remains an append-only JSON history while `hanzihome_practice_attempts` is the declared immutable attempt owner.

### Target state

- `user_learning_state` keeps current state only.
- vocabulary/grammar/radical review submissions generate immutable attempt evidence.
- review scheduling remains in Learning Loop, not attempt records.
- old `reviewHistory` gets an explicit compatibility/migration policy; do not silently drop user history.

### Required decisions before migration

- whether to backfill legacy history into practice attempts;
- new/expanded attempt surface values;
- retention policy;
- whether old clients require dual-write compatibility.

### Acceptance

One review action produces one current mastery transition, one immutable evidence record, and optional schedule update — no duplicate competing history owners.

---

## P1-03 — Define Reader completion semantics

Status: `DONE`

### Problem

Current completion is tied to playback reaching the end, which is not equivalent to learner completion.

### Decision required

Choose and document one semantic owner, for example:

- explicit learner completion action; or
- derived completion from required exercise/reading criteria.

If playback completion remains useful, model it separately rather than overloading `completed`.

### Acceptance

- reading without TTS can complete under the chosen rule.
- playing only the final segment cannot falsely imply full study completion.
- future Progress/Learning Overview reads this field with unambiguous meaning.

---

## P1-04 — Make Review Queue source links round-trip to original context

Status: `DONE`

### Problem

Some review producers store paragraph-oriented URLs that Reader does not consume, so the queue cannot restore document + paragraph context.

### Target state

Review source identity contains enough typed information to resolve:

```text
documentId
paragraphId optional
start/end offset optional
source surface
```

### Acceptance

A Shadowing or Reader selection review item opens the correct document and focuses the originating paragraph/range.

---

## P1-05 — Separate casual Dictionary lookup history from saved SRS progress

Status: `DONE`

### Problem

Inspector lookup persists non-favorited rows into `user_vocab_progress`, mixing lookup history with SRS/saved vocabulary semantics and causing unbounded growth from casual reading interactions.

### Decision

Choose one:

A. do not persist casual lookups; or  
B. store bounded/device-local recent lookups; or  
C. create a dedicated user-owned lookup event/read model.

Do not use SRS progress as incidental analytics/history.

### Acceptance

Casual lookup no longer creates misleading SRS/progress records.

---

## P1-06 — Explicitly retire legacy Reader progress fields

Status: `DONE`
Risk: `BLOCKED_CONFIRMATION` before DB schema/RPC changes.

### Problem

Runtime Reader state no longer owns display preferences, but legacy DB/RPC fields remain and are overwritten with neutral constants on save.

### Target state

- Reader progress schema contains only approved Reader-owned state.
- RPC/route no longer requires deprecated display/summary fields.
- migration explicitly handles existing rows.
- generated Supabase types are refreshed.

### Acceptance

No runtime save path writes fake `show_pinyin/show_meaning/summary_text` compatibility values.

---

## P1-07 — Normalize Daily Reading persistence and public/auth behavior

Status: `DONE`

### Problems to resolve together

- Daily Reading V1 and V2 coexist.
- browser storage ownership is not explicitly device-vs-user scoped.
- public users can answer questions while attempt persistence requires auth.
- Daily question current answers are transient while attempt evidence may persist.

### Required design decisions

1. Daily Reading archive/settings are either device-owned or user-owned; document the choice.
2. Public user attempt behavior is explicit: anonymous-local, sign-in-required, or non-persistent with clear UI.
3. Current answer state and submitted attempt evidence use distinct owners.
4. V1 -> V2 cutover has explicit exit criteria and rollback/forward-fix strategy.

### Acceptance

- no unhandled rejected attempt promise for public users.
- reload semantics are intentional and documented.
- V1/V2 has one final authoritative path after cutover.

---

# PHASE 2 — Persistence, BFF, DB and architecture consolidation

## P2-01 — Continue Strict BFF migration by risk order

Status: `DONE`

### Goal

Browser Supabase SDK may manage session, but business data writes/privileged shared data access should move behind server-owned API/service boundaries where this repository's trust model requires it.

### Migration order

1. Dictionary canonical/shared mutations.
2. Notes business reads/writes.
3. Reader annotations/pronunciation and remaining direct business writes.
4. remaining user data paths only where the boundary materially improves authorization/contract ownership.

Do not create a generic data proxy. Preserve feature-owned APIs and typed contracts.

---

## P2-02 — Resolve Reader content source-of-truth contradiction

Status: `DONE`

### Current contradiction

- HanziHome contract says normalized Supabase tables are runtime content source.
- Reader runtime repository currently consumes checked-in Studio seed/static data.
- normalized Reader static-content tables exist but are empty.

### Decision

Reader static package is the intentional immutable-content exception; Supabase
owns Reader user state only. The retired normalized content tables had no rows
and no runtime callers. Reader state continues to use stable static IDs, with
server-side validation against the reviewed package.

---

## P2-03 — Split `reader-state-repository` by bounded context

Status: `DONE`

### Goal

Separate server ownership for:

- Reader progress
- Personal Learning state
- Daily Reading state
- practice attempts
- annotations
- pronunciation overrides
- Learning Loop

Do not split merely by file size; split by data owner and authorization contract.

---

## P2-04 — Remove confirmed dead schema/code only after lifecycle verification

Status: `DONE`
Risk: `BLOCKED_CONFIRMATION` before DB drop/destructive cleanup.

### Candidates requiring fresh reachability/migration checks

- `hanzihome_learning_events`
- legacy listening attempt/progress tables if still unused
- import chunk residue
- obsolete compatibility code after Daily Reading/Reader cutovers

Completed candidates:

- `hanzihome_learning_events`
- `hanzihome_import_chunks`
- legacy `hanzihome_listening_attempts` and `hanzihome_listening_item_progress`

### Rule

Zero rows is not sufficient evidence. Confirm runtime references, migrations, generated types, RPC dependencies, and rollback/forward-fix before deletion.

---

## P2-05 — Reduce DB grants/RPC attack surface

Status: `DONE`
Risk: `BLOCKED_CONFIRMATION` before RLS/grant/function changes.

### Work

- verify actual application call paths first;
- revoke direct table/RPC capabilities no longer needed by browser clients;
- preserve owner RLS on user-owned tables;
- keep editor/admin checks explicit for content mutation RPCs;
- re-run security advisor after migration.

Do not treat advisor warnings alone as proof of exploitability.

---

## P2-06 — BYOK encryption configuration hardening

Status: `DONE`

### Goal

Use an independent production `BYOK_ENCRYPTION_SECRET` as the normal encryption key source. Supabase secret-derived decryption support may remain only as an explicit migration compatibility path if needed.

### Acceptance

- new keys use dedicated secret material.
- rotation/recovery behavior is documented.
- no plaintext key is returned to clients.

Environment/secret changes require explicit deployment authorization.

---

## P2-07 — Add only evidence-backed DB indexes

Status: `DONE`
Risk: confirmation required before live DB migration.

### Priority candidates

AI conversation/memory FK/query paths with expected growth, including conversation, reply, memory evidence, post-turn job, and character relationship paths.

### Rule

Do not add every advisor suggestion and do not remove indexes merely because a small database reports them unused.

---

# PHASE 3 — Product, IA and UI projections

## P3-01 — Build Learning Overview as a derived read model

Status: `DONE`

Depends on P0 and P1 semantic ownership completion.

### Rule

Learning Overview is a projection, not a new persisted progress owner.

Candidate inputs:

- course mastery
- saved Dictionary SRS summary
- due queue count
- immutable recent attempts
- Reader completion under the final semantics

Do not duplicate these states into a dashboard-owned table/store without a separate proven need.

---

## P3-02 — Gate developer/system tools from normal learner navigation

Status: `DONE`

### Scope

- Data Quality
- HTML Artifacts
- API Docs
- other engineering/admin surfaces found during fresh navigation audit

Use explicit developer/editor/admin capability rather than normal learner IA.

---

## P3-03 — Complete Reader i18n

Status: `DONE`

Replace hardcoded Vietnamese Reader controls/status copy with semantic message keys in the appropriate feature namespace. Do not move Chinese learning content into locale catalogs.

Verify `vi`, `en`, and `zh-CN` plus keyboard/touch behavior.

---

## P3-04 — Branding and shell metadata consolidation

Status: `DONE`

Resolve stale `KMS — Chinese Learning Portal` metadata vs current HanziHome product naming after confirming the intended public brand.

---

## P3-05 — Navigation/IA cleanup after ownership settles

Status: `DONE`

Review learner-visible route count, grouping, duplicate entry points, and Progress/Learning Overview placement only after P3-01 projection exists.

---

# PHASE 4 — Release hardening and closeout

## P4-01 — Critical E2E coverage

Status: `DONE`

Minimum flows:

1. account A -> logout -> account B isolation.
2. learning-state offline write -> reconnect -> conflict rebase.
3. Review Queue due/future scheduling.
4. Reader completion rule.
5. Daily Reading public/auth persistence behavior.
6. Dictionary lookup cannot mutate canonical shared data through learner credentials.
7. Shadowing microphone recording.

If the repository has no appropriate E2E runner, dependency installation is a separate confirmation decision.

---

## P4-02 — Coverage/gate policy

Status: `DONE`

Establish targeted regression coverage for critical ownership boundaries. Do not introduce arbitrary global percentage thresholds without a repository decision.

---

## P4-03 — Branch/release governance

Status: `BLOCKED_CONFIRMATION`

Current `main` is not branch-protected and has no required status checks. Before the remediation train is merged, evaluate required CI/status-check protection as a repository governance decision.

Changing repository protection settings requires explicit authorization.

---

# 7. Batch execution rules

Every implementation batch MUST follow this order:

1. Re-read this plan and nearest applicable contracts/skills.
2. Verify branch/HEAD and working tree.
3. Change the target item status to `IN_PROGRESS` and append a checkpoint entry below.
4. Trace the real route -> feature -> query/service/API -> schema/DB -> tests path.
5. Implement the smallest coherent change only.
6. Run targeted verification capable of falsifying the change.
7. If the batch closes a full-path contract, run `npm run check`.
8. Update this document with:
   - status;
   - exact files changed;
   - behavior intentionally changed/preserved;
   - checks actually run;
   - residual risk;
   - next task.
9. Commit code + updated plan together where practical.
10. Push only the active refactor branch. Do not merge automatically.

## Batch size rule

Prefer one high-risk invariant or one tightly connected subsystem per batch. Do not mix unrelated P0 tasks merely to reduce commit count.

## Database rule

Investigation, SQL drafting, migration review, and tests may occur on the branch. Applying a migration to a live/production target, changing RLS/auth/grants, or destructive schema cleanup requires the explicit confirmation gate defined by repository policy.

---

# 8. Verification matrix

## Source-only/local behavior

Use the smallest relevant set first:

```bash
npm run typecheck
npm run lint
npm run test:run
```

Use feature-targeted commands if repository scripts provide them.

## Full-path completion

```bash
npm run check
```

Do not claim this passed unless it actually ran.

## UI/browser claims

Source inspection is insufficient for:

- microphone capability;
- account switch cache isolation;
- responsive/keyboard behavior;
- Reader deep-link focus;
- public/auth Daily Reading flow.

Render/interact with the real affected state when the environment supports it and report exactly which viewport/state was checked.

## Supabase changes

For each approved migration:

- state exact target environment;
- inspect drift;
- inspect existing-row/lock/rewrite risk;
- choose rollback OR forward-fix strategy;
- apply a timestamped migration;
- refresh generated types;
- run affected tests;
- run security/performance advisors where available;
- report unresolved findings.

---

# 9. Execution checkpoint log

This section is append-only except for correcting factual mistakes. Every coding session must add a checkpoint.

## Checkpoint 000 — Plan baseline

Date: 2026-08-19  
Branch: `refactor/hanzihome-integrity-remediation`  
Base SHA: `864037d31376bbff3854e8198695be6259a969e4`  
Scope: create branch and establish full remediation plan only.  
Code mutation: none.  
DB mutation: none.  
Verification: branch created from the verified current `main`; repository contracts/skills listed in Section 2 were re-read.  
Next item: P0-01 authenticated client-state isolation.  
Confirmation still required later: DB/RLS/auth/grant/schema mutations, destructive persisted-state migration, merge, production deployment.

---

# 10. Handoff template for every completed batch

Use this exact information in the plan checkpoint and user report:

```text
Scope:
Root cause / contract gap:
Authoritative owner:
State/data flow:
Files changed:
Behavior preserved:
Behavior intentionally changed:
Tests/checks actually run:
UI states actually rendered:
DB environment touched:
Residual risk:
Confirmation still required:
Next checkpoint:
```

A task is not `DONE` merely because source code was edited. It is `DONE` only when its acceptance criteria are satisfied with recorded evidence.

## Checkpoint 001 — Phase 2–4 implementation and release-gate audit

Date: 2026-08-20
Branch: `refactor/hanzihome-integrity-remediation`
Head: `ccad9306`

Scope:

- Phase 2 BFF/repository split, static Reader content retirement, confirmed-dead
  state cleanup, server-only Reader state authority, BYOK secret contract, and
  evidence-backed AI query review are implemented and recorded in the Phase 2
  checkpoint ledger.
- Phase 3 derived Learning Overview, capability gates, Reader i18n, HanziHome
  shell metadata, and learner navigation cleanup are implemented and recorded in
  the Phase 3 checkpoint ledger.
- Phase 4 Playwright fixtures, CI local-Supabase job, targeted ownership flows,
  and release runbook are implemented. The latest source fix removes duplicate
  email-login navigations and makes the E2E auth wait tolerant of normal route
  settling (`86fba2f9`, `ccad9306`).

Verification actually run:

- `npm run check` passed locally: 173 test files / 766 tests, format, audit, and
  production build (112 static/dynamic routes).
- CI `verify` passed for head `ccad9306`.
- CI `e2e` executed local Supabase migrations and fixture seeding, but both the
  original attempt and the failed-job rerun ended with 3 failed / 2 flaky
  Playwright tests. Runner logs show Docker image `toomanyrequests: Rate exceeded`,
  repeated existing `notes` permission warnings, `ECONNRESET`, and 30-second
  REST/page timeouts. This is not a green product E2E result.
- Local Supabase/Playwright execution remains unavailable because Docker is not
  installed in this checkout.

Residual external gates:

- Re-run E2E on a Docker-enabled runner with a healthy Supabase/PostgREST stack;
  do not mark P4-01 complete from the failed run.
- The branch is not merged or promoted to `main`; production still serves the
  older `main` deployment.
- GitHub branch protection remains blocked by the private-repository plan
  limitation; deployed authenticated account isolation, BYOK round-trip, and
  real microphone/Permissions-Policy smoke remain owner-side release evidence.

Next checkpoint: establish a green local-stack E2E run, then record deployed
release smoke and governance evidence before calling Phase 2–4 release-complete.

## Checkpoint 002 — Phase 2–4 CI closeout

Date: 2026-08-20
Branch: `refactor/hanzihome-integrity-remediation`
Head: `b6f98297`

Scope:

- Closed the final Learning Loop conflict boundary found by CI: the server
  repository now prechecks the owner-scoped revision with service-role
  authority before invoking the unchanged atomic scheduling RPC.
- Made the Playwright Learning Loop fixture deterministic by delete/inserting
  the owned due item and verifying revision/state/due invariants before each
  test.
- Updated the phase ledgers and master statuses after the full CI gate.

Verification actually run:

- Targeted route/repository tests: 6/6 passed; local typecheck, lint, format,
  and diff checks passed.
- CI run `32384114057`: `verify` passed `npm run check`; `e2e` applied all local
  migrations, seeded fixtures, and passed all five Playwright flows (`5 passed,
3.1m`).
- Linked Supabase migration/postflight evidence and preview header/route smoke
  remain recorded in the earlier Phase 2/4 ledgers.

Residual release gates:

- The branch is intentionally not merged/rebased/promoted to `main`.
- Production still serves the older `main` deployment; deployed authenticated
  account isolation, Daily Reading, Dictionary, Reader, BYOK round-trip, and
  real microphone smoke are not claimed for this branch.
- GitHub branch protection remains `BLOCKED_CONFIRMATION`: the current private
  repository plan returns `403 Upgrade GitHub Pro or make this repository
public`. An owner must change the plan/visibility and enable required PR
  checks.

Next checkpoint: owner-side PR/governance configuration and deployed smoke.

## Checkpoint 003 — deployed preview and final CI audit

Date: 2026-08-20
Branch: `refactor/hanzihome-integrity-remediation`
Head: `c3ad3ae9`

Verification actually run:

- CI run `32385315544` passed both `verify` and `e2e`; the latter applied the
  local migration set, seeded two fixtures, and reported `5 passed (3.2m)`.
- A READY Vercel Preview from the current head rendered guest Daily Reading
  with no Daily Reading API `401` responses and the exact deployed
  `Permissions-Policy: camera=(), microphone=(self), geolocation=()` header.
- Vercel Production and Preview both have sensitive `BYOK_ENCRYPTION_SECRET`
  and `SUPABASE_SECRET_KEY` entries. Secret values are intentionally not
  recorded here.
- Linked migration history has matching local/remote entries for the Phase 0
  lock and reviewed Phase 1/2 migrations. Read-only postflight and schema lint
  remain clean for errors; only pre-existing warnings remain.

Release status remains `COMPLETE_PENDING_DEPLOYED_SMOKE`: Production still
serves the older `main` deployment, so authenticated account isolation,
Dictionary denial, Reader/Daily Reading auth behavior, BYOK round-trip, and
real microphone capture are not claimed. GitHub branch protection is also
blocked by the current private-repository plan returning HTTP 403; these gates
require owner-provided deployed credentials and repository-plan action.
