# HanziHome Remediation — Final QA Acceptance

Branch context: `refactor/hanzihome-integrity-remediation`  
Basis: `docs/refactor/hanzihome-integrity-remediation-plan.md` and Phase 0/1 execution checkpoints.

This is the final acceptance QA for the full Phase 0 -> Phase 4 remediation train. It is not an implementation plan. A later phase may change internal structure, but the observable and data-ownership outcomes below must remain true.

## 1. Expected end state

After the remediation train is complete, HanziHome should have these properties:

- authenticated user state is isolated by owner across Query cache, browser persistence, pending mutations and in-flight sync;
- course mastery, saved vocabulary/SRS, due scheduling, immutable attempts, display settings and Reader progress each have one authoritative owner;
- shared/canonical Dictionary data is not writable by an ordinary authenticated browser session;
- review evidence is append-only and distinct from current mastery state and due scheduling;
- Reader completion has one explicit meaning and is not inferred from TTS playback;
- Reader source links can round-trip back to the exact document/paragraph/range;
- casual Dictionary lookup does not create SRS progress;
- Daily Reading has one active V2 runtime path with explicit device-owned archive/settings and explicit guest/auth attempt behavior;
- business-data trust boundaries are progressively moved behind feature-owned server/BFF contracts where justified;
- Reader content has one documented source of truth;
- dead schema/code and obsolete compatibility paths are removed only after lifecycle verification;
- database grants/RPCs follow least privilege;
- BYOK encryption uses dedicated secret material rather than accidental coupling to unrelated Supabase secrets;
- Learning Overview is a derived projection, not a new progress owner;
- learner navigation does not expose developer/admin tooling without capability gating;
- Reader UI is complete for `vi`, `en`, and `zh-CN`;
- branding/navigation are consistent;
- critical ownership and persistence flows have deterministic automated coverage plus release E2E;
- the release branch is protected by appropriate CI/status checks before merge/release.

## 2. Final QA matrix

### QA-01 — Account isolation

Steps:

1. Login as account A.
2. Create/load Notes, saved Dictionary/SRS state, learning settings, mastery and bookmarks.
3. Create at least one offline pending learning-state/review mutation.
4. Logout without refreshing the browser runtime.
5. Login as a genuinely different account B.

PASS when:

- B renders none of A's user-owned state;
- A's pending mutation is not sent with B credentials;
- B remote state remains unchanged by A's pending work.

### QA-02 — Learning-state conflict merge

Steps:

1. Start from one common base state.
2. Change one nested setting locally and a different nested setting remotely.
3. Add/remove bookmarks concurrently on unrelated items.
4. Edit the same progress node with controlled `lastReviewedAt` values.

PASS when:

- unrelated settings survive together;
- local bookmark delta applies on top of latest remote membership;
- same-node progress follows the documented deterministic timestamp/tie rule;
- no unrelated branch is lost.

### QA-03 — Due queue semantics

Steps:

1. Create one due item with `due_at <= now`.
2. Create one future item with `due_at > now`.
3. Grade an item so it is rescheduled into the future.

PASS when:

- only due items appear/count as due;
- future items disappear from the due queue immediately;
- an empty due queue is valid even when scheduled future items exist.

### QA-04 — Review action ownership

Steps:

1. Review one vocab or grammar item online.
2. Inspect mastery state, practice attempts and Learning Loop scheduling.
3. Retry the same durable attempt UUID.

PASS when one learner action produces:

- exactly one current mastery transition;
- exactly one immutable `surface = review` evidence row;
- one schedule update when applicable;
- retry does not duplicate evidence.

### QA-05 — Offline review retry

Steps:

1. Go offline.
2. Review an item.
3. Confirm local mastery changes immediately.
4. Reconnect.

PASS when:

- the queued attempt eventually syncs once;
- mastery is not rolled back merely because evidence was temporarily offline;
- no duplicate attempt is created.

### QA-06 — Dictionary trust boundary

Steps:

1. Perform a casual lookup.
2. Check user SRS/progress.
3. Explicitly Save-to-SRS.
4. Attempt a direct browser/shared canonical write or legacy RPC call using normal authenticated credentials.

PASS when:

- casual lookup creates no SRS/progress row;
- explicit save creates/updates only the intended user's relationship plus allowed server-side canonical work;
- shared canonical reads still work;
- direct browser shared write/RPC execution is denied.

### QA-07 — Reader completion semantics

Steps:

1. Open a Reader document and read without TTS.
2. Mark completion explicitly.
3. Reload.
4. In a second document, only play the final TTS segment.

PASS when:

- explicit completion persists;
- final-segment playback alone does not mark the document complete.

### QA-08 — Reader source round trip

Steps:

1. Create a Learning Loop/review source from a Reader selection or Shadowing context.
2. Preserve document, paragraph and offsets.
3. Open the item from Review Queue/Learning Loop.

PASS when:

- correct Reader document opens;
- correct paragraph is focused;
- selection offsets restore the originating range when available.

### QA-09 — Reader progress ownership

PASS when runtime Reader progress owns only:

- `completed`;
- exercise `answers`;
- optimistic `revision`.

Display preferences must resolve from the approved learning-settings owner, not be mirrored back into Reader progress.

### QA-10 — Shadowing microphone

Run on deployed app, not localhost.

PASS when:

- response header contains `Permissions-Policy: camera=(), microphone=(self), geolocation=()`;
- browser can request microphone for Shadowing;
- record/stop works;
- denial/unsupported state is visible;
- media tracks are released on stop/unmount;
- camera/geolocation remain unavailable.

### QA-11 — Daily Reading V2 ownership

Steps:

1. Use a browser with legacy V1 data and no V2 ledger.
2. Open generated Daily Reading.
3. Reload.
4. Switch A -> logout -> B in the same browser.

PASS when:

- V1 migrates/forward-fixes into V2 once;
- V2 remains the only active runtime/UI path after reload;
- archive/settings remain across account switch because they are intentionally device-owned;
- no V1/V2 dual-write path reappears.

### QA-12 — Daily Reading guest/auth behavior

Steps:

1. As guest, answer a static Daily Reading question/translation.
2. As authenticated user, submit an equivalent attempt.

PASS when:

- guest interaction works locally without an authenticated attempt request/401;
- authenticated submission records immutable evidence or surfaces an explicit save error;
- current answer/draft state is not treated as immutable history.

### QA-13 — Strict BFF / business-write boundaries

Review the final browser network/data-access paths.

PASS when:

- privileged/shared business writes are behind feature-owned server/API boundaries where the plan requires them;
- Notes/Reader/user-data direct access remains only where explicitly justified by the final architecture;
- no generic catch-all data proxy was introduced;
- browser Supabase usage is not relied on as shared-content authority.

### QA-14 — Reader content source of truth

PASS when exactly one architecture is documented and implemented:

- static curated Reader package is the intentional content source while Supabase owns user state; or
- normalized Supabase Reader content tables are the runtime source.

FAIL if docs, source and DB comments still contradict each other about the authoritative content owner.

### QA-15 — Repository bounded contexts

PASS when `reader-state-repository` responsibilities are split by real data/authorization owners where appropriate, without merely slicing by file length, and callers import the bounded owner they actually need.

### QA-16 — Dead schema/code cleanup

For every removed table/RPC/module/compatibility path, verify runtime references, migrations, generated types and rollback/forward-fix implications first.

PASS when:

- confirmed-dead paths are gone;
- active paths still work;
- no deletion was justified only by `0 rows` or one unused-index snapshot.

### QA-17 — Database least privilege

PASS when:

- authenticated users retain only grants required by actual browser call paths;
- user-owned tables still enforce owner RLS;
- shared/content mutation is capability/server controlled;
- obsolete RPC execution paths are revoked;
- post-migration security advisor findings are reviewed rather than blindly applied.

### QA-18 — BYOK hardening

PASS when:

- new BYOK encryption uses a dedicated production `BYOK_ENCRYPTION_SECRET` or the final documented dedicated key source;
- old Supabase-secret-derived decryption, if retained, is explicitly migration compatibility only;
- rotation/recovery is documented;
- plaintext API keys are never returned to clients.

### QA-19 — Evidence-backed indexes

PASS when every new DB index has a concrete query/FK/growth reason and no index is added or removed solely because an advisor suggested it or a small current dataset showed low usage.

### QA-20 — Learning Overview

PASS when the overview is a derived read model from existing owners such as mastery, SRS, due queue, attempts and Reader completion.

FAIL if it introduces another persisted progress table/store that duplicates those states without a separately approved need.

### QA-21 — Learner IA, capability gating, i18n and branding

PASS when:

- Data Quality/API Docs/engineering tools are hidden from normal learner navigation unless capability allows them;
- Reader controls/status copy is complete in `vi`, `en`, and `zh-CN`;
- Chinese learning content remains content data, not UI locale strings;
- product metadata/branding uses the chosen HanziHome identity consistently;
- learner navigation has no duplicated or contradictory entry points introduced by the refactor.

### QA-22 — Automated quality gate

PASS when the final branch head passes:

```bash
npm run check
```

and targeted regression tests cover the ownership boundaries changed by the remediation.

A source-only claim is insufficient for browser-specific behavior.

### QA-23 — Critical E2E release matrix

At minimum automate or explicitly execute:

- A -> logout -> B isolation;
- offline learning-state write -> reconnect -> conflict rebase;
- due/future Review Queue scheduling;
- Reader completion rule;
- Daily Reading guest/auth persistence behavior;
- learner credentials cannot mutate shared Dictionary canonical data;
- Shadowing microphone recording.

PASS only when failures block release or are recorded as an explicit accepted exception.

### QA-24 — Release governance

PASS when the final release path has the repository-approved CI/status checks and branch protection/governance required by Phase 4, and the remediation branch is not merged while its required gate is red.

## 3. Final release acceptance

The remediation train is considered complete only when all of the following are true:

```text
Architecture/state ownership       PASS
Auth/account isolation             PASS
Persistence/offline/retry          PASS
Dictionary trust boundary          PASS
Review evidence + scheduling       PASS
Reader semantics + source links    PASS
Daily Reading V2                   PASS
BFF/DB least privilege             PASS
BYOK/DB cleanup/index review       PASS
Learning Overview/IA/i18n/brand    PASS
npm run check                      PASS
Critical E2E                       PASS
Release governance                 PASS
```

Any item that is intentionally deferred must name the reason, owner, target release and rollback/forward-fix strategy. Do not convert an unverified item into `PASS` merely because implementation source exists.

## 4. Expected output when the refactor is finished

The practical output is not just "cleaner code". It should be a HanziHome where:

1. the app can state exactly where every important learning datum lives;
2. switching accounts cannot leak or replay another user's state;
3. offline/retry behavior is deterministic;
4. learner actions cannot mutate shared truth through browser credentials;
5. historical evidence is durable and separate from current state;
6. Reader/Daily Reading behavior has stable, testable semantics;
7. server/DB boundaries reflect the intended trust model;
8. product UI is a projection of trustworthy lower-layer data rather than a second owner;
9. critical regressions are caught by tests before release;
10. the repository has a repeatable release gate instead of relying on manual confidence.
