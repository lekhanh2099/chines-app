# AI Runtime + Daily Reading V2 — Temporary Implementation Plan

> TEMPORARY EXECUTION NOTE: delete this file when every scope below is complete, verified, and the durable architecture/contracts have been folded into the permanent docs. Do not leave this checklist as stale product documentation.

## Goal

Make Daily Reading an article-acquisition system with optional AI enrichment, and make all user-facing AI use encrypted per-user BYOK credentials from the backend. Daily Reading must remain readable after source capture even if AI enrichment fails or no AI key exists. Conversation should later use HTTP streaming, not WebSocket.

## Non-goals

- No Supabase schema/RLS migration for Daily Reading.
- No server cron in this change.
- No WebSocket transport.
- No provider API key in localStorage or public env.
- No system provider-key fallback for user-facing AI once migrated.
- No persisted pinyin in Daily Reading V2.
- No AI rewrite of the captured Chinese article.
- No new crawler/storage dependency unless existing primitives are proven insufficient.

## Hard invariants

1. `discover -> extract -> validate -> persist` is the critical Daily Reading path.
2. A persisted article is immediately readable and counts as the day's successful capture.
3. Translation, vocabulary, grammar, and questions are independent retryable enrichments.
4. Missing/invalid/quota AI credentials never delete or invalidate a captured article.
5. Chinese source text is immutable after capture; AI only adds learning support.
6. Pinyin is derived at render/runtime from the existing contextual pronunciation system.
7. User provider credentials come from encrypted backend storage only; frontend receives metadata only.
8. Existing V1 Daily Reading data must migrate safely and retain provenance as legacy adapted content.
9. No automated test may write production data/provider state.

## Scope order

### Scope 0 — Plan and contracts
- [x] Record implementation order, invariants, migration and deletion note in this temporary file.
- [ ] Keep permanent architecture docs synchronized as contracts become final.

### Scope 1 — Additive Daily Reading V2 foundation

Status: implementation landed additively; execution verification is still pending because the current agent runtime cannot clone/install the repository. No production behavior has been switched to V2 yet.

- [x] Add V2 article/enrichment/capture-run/enrichment-run schemas without breaking V1 consumers.
- [x] Define provenance: `source-captured` vs `legacy-adapted`.
- [x] Remove pinyin from the V2 persisted contract.
- [x] Add pure V1 -> V2 item/ledger migration helpers.
- [x] Add deterministic migration/schema tests, including explicit no-pinyin persistence coverage.
- [x] Preserve V1 run history separately instead of relabeling it as V2 capture history.
- [x] No UI, scheduler, storage key or route behavior change in this scope.
- [ ] Execute targeted type/test checks when an executable checkout/CI run is available.

### Scope 2 — Collection preferences and resolved policy

Status: additive collection-policy contracts are implemented. They are not wired into V1 storage, scheduler, collector requests or UI yet, so current production behavior remains unchanged.

- [x] Add V2 collection settings for local capture time, freshness, topics, sources, length preference, diversity/repeat behavior, no-match fallback, target level and auto enrichment.
- [x] Preserve current V1 defaults during migration: 10:00 local release, 14-day source ceiling, all reviewed sources/topics, no length restriction, diversity/repeat protection enabled and enrichment enabled.
- [x] Add a reviewed source catalog that centralizes source IDs/domains/publisher labels without broadening the existing allowlist.
- [x] Add pure V1 settings -> V2 settings migration.
- [x] Add a pure resolved-policy owner that combines user preferences with app-owned safety bounds.
- [x] Keep internal history limits and maximum fallback freshness app-owned rather than exposing crawler knobs.
- [x] Add deterministic settings/policy tests and keep the existing source-policy behavior compatible with the centralized catalog.
- [x] No UI, scheduler, storage-key or collector request behavior change in this scope.
- [ ] Execute targeted type/test checks when an executable checkout/CI run is available.

### Scope 3 — Source acquisition hardening

Status: source selection is hardened behind the existing V1-compatible discovery entrypoint, with a policy-aware V2 entrypoint ready for later wiring. Full captured paragraphs are preserved in the selected-source result while the V1 `extractedTextZh` projection remains bounded for compatibility.

- [x] Separate discovery metadata score from extracted-content quality score.
- [x] Extract all top candidates in bounded batches before final selection instead of returning the first extractable article.
- [x] Add post-extraction scoring/reranking using semantic extraction confidence, Chinese density, paragraph coherence, title/body consistency, freshness and preferred length.
- [x] Prefer JSON-LD `articleBody`, `itemprop=articleBody`, semantic `<article>`, known content containers and `<main>` before generic page-wide `<p>` fallback.
- [x] Preserve cleaned Chinese paragraph boundaries, extraction method, page title/date evidence and full captured text up to an app-owned safety ceiling.
- [x] Reject truncated, stale/future, low-density, incoherent, title/body-mismatched and materially date-mismatched candidates.
- [x] Make source/topic/freshness/repeat filters policy-aware and honor `expand-window` only when configured.
- [x] Limit official discovery requests to selected source registries where direct endpoints exist; GDELT discovery uses the selected topic set and resolved freshness horizon.
- [x] Add deterministic parser/quality/ranking regression tests.
- [x] Preserve the existing `discoverDailyReadingSource(...)` caller contract as a compatibility wrapper; no route/UI/persistence contract is switched to V2 yet.
- [ ] Add verified source-specific selectors only when live HTML fixtures prove a stable publisher contract; do not invent brittle selectors from memory.
- [ ] Execute targeted type/test checks when an executable checkout/CI run is available.

### Scope 4 — Article-first persistence

Status: the V2 capture path is now the primary Daily Reading library/manual-acquisition path and is independent from AI. V1 storage and the legacy generated-reader path remain intact as rollback/compatibility owners until later cleanup; old V1 items are migrated or mirrored into the V2 library as `legacy-adapted`.

- [x] Add an authenticated source-capture route that performs collection only and never resolves an AI provider/key.
- [x] Build a `source-captured` V2 article from the selected source while preserving exact cleaned Chinese paragraph order and source provenance.
- [x] Persist the V2 article before capture success telemetry; a telemetry failure after save cannot roll the article back.
- [x] Use a dedicated versioned V2 ledger/settings storage key with parse/write/read-back verification and quota compaction.
- [x] Read V2 first and safely migrate valid V1 data when V2 is absent; keep the V1 storage keys untouched for rollback/recovery.
- [x] Deduplicate V2 writes by article id, source URL, and article fingerprint.
- [x] Treat presence in the V2 item ledger as `article-ready`; enrichment state is independent and starts `idle` for a source capture.
- [x] Make the primary Daily Reading library/reader render a V2 article with only Reader + Source available when enrichments are idle/blocked/failed.
- [x] Keep V1 readings readable through migration/legacy fallback and mirror successful legacy generation into V2 best-effort.
- [x] Keep persisted V2 source-captured content free of pinyin fields.
- [x] Add deterministic capture-builder, route-boundary and V2 persistence tests without provider/production DB writes.
- [ ] Execute targeted type/test checks and an actual reload/render flow when an executable checkout is available.

### Scope 5 — Scheduler capture semantics

Status: scheduled Daily Reading now owns source capture rather than all-or-nothing AI generation. Configurable capture-time data is active in the scheduler contract, while the full settings UI for editing it remains Scope 8.

- [x] Switch the scheduler agent from `generateDailyReadingNow` to source-only `captureDailyReadingNow`.
- [x] Count a persisted scheduled V2 article as the day's successful completion independent of enrichment state.
- [x] Respect V2 `captureTime` in `Asia/Ho_Chi_Minh` while preserving 10:00 as the migrated/default value.
- [x] Preserve catch-up behavior on initial mount, focus and `visibilitychange` after the configured time.
- [x] Prevent duplicate daily capture after article persistence even if success-run telemetry fails.
- [x] Keep bounded retry/backoff semantics for capture runs and allow immediate recovery from interrupted/offline failures.
- [x] Reuse the cross-tab Daily Reading lock for capture and fix lock fallback so a task failure is never rerun through a second lock backend.
- [x] Add scheduler/lock/capture-run decision tests.
- [ ] Execute targeted type/test checks and multi-tab browser verification when an executable checkout is available.

### Scope 6 — Shared backend BYOK AI runtime

Status: Scope 6A establishes the strict BYOK runtime owner and safe readiness contract additively. Scope 6B extracts the existing add-key task into one reusable Settings-owned interaction and makes the API Key Manager consume it. Legacy AI consumers still have old consumer-specific system-provider fallbacks; those remain explicitly tracked in Scopes 7, 9, 10, 11 and 12 rather than being hidden behind this runtime work.

#### Scope 6A — Runtime resolver and readiness

- [x] Add one server-only runtime resolver that selects active encrypted user credentials by priority and capability.
- [x] Keep decrypted provider secrets inside the server runtime result only; safe metadata contains masked key/provider/model/capabilities and never `apiKey`.
- [x] Add capability ownership for conversation, Daily Reading translation/learning, lookup, structured memory and Gemini-compatible semantic memory.
- [x] Distinguish `missing-key` from server `schema-unavailable`, `vault-unavailable` and `credential-unreadable` states.
- [x] Add shared operational error taxonomy for invalid key, quota/rate-limit, provider unavailable, network, invalid response and cancellation.
- [x] Add authenticated `GET /api/ai/runtime` readiness endpoint returning private/no-store safe metadata only.
- [x] Add a TanStack Query readiness owner and invalidate it when managed keys are added, deleted, toggled, reordered or have their model changed.
- [x] Ensure the new runtime resolver never reads provider API keys from localStorage or `GEMINI_API_KEY` / `DEEPSEEK_API_KEY`; env access is limited to BYOK/server encryption infrastructure.
- [x] Add deterministic resolver and route-boundary tests proving missing-key/vault separation, capability selection and no raw key in the readiness response.
- [ ] Execute targeted type/test checks when an executable checkout is available.

#### Scope 6B — Reusable Add API Key interaction

- [x] Extract the existing paste/discover/provider/model/verify/save task into one reusable `AddApiKeyDialog` owned by Settings and composed only from canonical UI primitives.
- [x] Give the reusable dialog unique field IDs and keep provider discovery/live-model validation identical to the existing manager flow.
- [x] Keep plaintext provider credentials only in transient dialog state until POST; successful save continues through the encrypted backend key route.
- [x] Make the API Key Manager consume `AddApiKeyDialog` while preserving key list/model/toggle/order/delete behavior.
- [x] Read shared AI runtime readiness in the dialog and distinguish secure-storage failures from a normal `missing-key` state.
- [x] Hard-block add/discovery when key schema/vault storage is unavailable while allowing `credential-unreadable` to remain a visible recovery warning so a replacement key can still be added.
- [x] Add storage-unavailable copy with vi/en/zh-CN message parity.
- [x] Reuse the Scope 6A query invalidation so a successful add immediately invalidates both managed-key and AI-runtime readiness state.
- [ ] Execute targeted type/i18n/UI checks when an executable checkout is available.
- [ ] Render and verify Dialog focus return, Tab trapping, Select collision, clipboard/discovery loading, failure and success states at desktop/tablet/mobile before final UI completion.

### Scope 7 — Daily Reading enrichment modules

Status: V2 enrichment is now an independent post-capture path. It accepts an already-persisted V2 article, resolves only the shared user BYOK runtime, and writes one module state at a time. Capture/scheduler success remains independent; UI status, user-triggered retry controls and auto-enrichment orchestration remain Scope 8.

- [x] Add an authenticated V2 enrichment route that resolves `daily-reading-translation` / `daily-reading-learning` through the shared strict-BYOK runtime only.
- [x] Keep the V2 enrichment provider user-key-only for Groq, OpenAI, DeepSeek and Gemini; never read `GEMINI_API_KEY`, `DEEPSEEK_API_KEY` or another provider env fallback.
- [x] Translate the immutable captured article after durable save, preserving every source paragraph ID/order and using bounded chunks rather than head/tail evidence truncation.
- [x] Keep Daily Reading V2 prompts and persisted enrichment free of generated pinyin; AI is explicitly forbidden from rewriting the captured Chinese source.
- [x] Validate vocabulary against exact terms present in the captured article, reject duplicate/invented terms, and assign stable module-local item IDs on the server.
- [x] Validate grammar evidence against complete sentences from the immutable captured article before accepting the module.
- [x] Validate question evidence paragraph IDs and source phrases against the captured article, and require main-idea/detail/inference/summary coverage.
- [x] Give each module its own schema/content repair attempt instead of returning one all-or-nothing translation/vocab/grammar/questions envelope.
- [x] Add module-specific V2 storage mutation and enrichment-run persistence so one module can become ready/failed/blocked without resetting source content or sibling modules.
- [x] Treat run history as diagnostics only: article/module persistence remains authoritative if telemetry cannot be written.
- [x] Add interruption recovery so a pending/running enrichment can become retryable `failed` while the captured article remains readable.
- [x] Map missing key to `blocked` and propagate that block to remaining learning modules without making redundant provider calls.
- [x] Map invalid key, exhausted quota and provider-unavailable responses to module-local blocked states; network/invalid-response/cancelled remain module-local failures.
- [x] Add client entry points for retrying one module independently and for sequentially requesting the full learning-support set without coupling it to capture.
- [x] Add deterministic route/provider/service/client/storage tests for authorization, missing/vault states, raw-key non-exposure, no system-env fallback, full translation evidence coverage, source-bound validation, partial success and interruption safety.
- [x] Keep automated tests at mocked provider/storage boundaries; no test writes production DB/provider state.
- [ ] Execute targeted type/test/source-standard checks when an executable checkout is available.
- [ ] Wire module status, retry/Add-Key controls and optional auto-enrichment orchestration into the rendered Daily Reading UX in Scope 8.

### Scope 8 — Daily Reading Settings and status UX
- [ ] Redesign settings into basic collection controls plus advanced source/criteria controls.
- [ ] Separate Source/Capture status from AI Runtime/Enrichment status.
- [ ] Rename manual acquisition action to a source-oriented label such as "Tìm bài mới".
- [ ] Keep source testing usable without an AI key.
- [ ] Surface per-enrichment retry/add-key actions without hiding the article.

### Scope 9 — Conversation HTTP streaming
- [ ] Preserve user-message persistence and idempotency before streaming.
- [ ] Stream sanitized assistant deltas over HTTP/NDJSON.
- [ ] Add Stop via AbortController; partial cancelled assistant output is UI-only and not persisted.
- [ ] Preserve retry using the same client message id without duplication.
- [ ] Incrementally suppress provider reasoning/`<think>` content across chunk boundaries and final-sanitize before persistence.

### Scope 10 — Conversation memory/runtime migration
- [ ] Structured memory uses the shared user runtime only.
- [ ] Semantic embedding uses a compatible user runtime when available.
- [ ] Missing semantic embedding falls back to lexical memory and never blocks chat.

### Scope 11 — Remaining AI surfaces
- [ ] Migrate lookup/deep/basic AI enhancement, vocab generation, editor context and other user-facing AI callers to the shared runtime.
- [ ] Preserve cached/non-AI functionality without an AI key.

### Scope 12 — Remove system-provider fallbacks
- [ ] Remove/isolate user-facing `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` fallback paths after all consumers migrate.
- [ ] Keep infrastructure secrets such as BYOK encryption/Supabase server credentials.
- [ ] Update `.env.example` and permanent architecture docs.

### Scope 13 — Regression and UI verification
- [ ] Targeted unit/integration checks per scope.
- [ ] Final `npm run check` when implementation is complete.
- [ ] Render Daily Reading/Settings/Conversation at 390x844, 820x1180, 1440x900 in light/dark.
- [ ] Verify keyboard/focus/dialog/select/loading/offline/missing-key/partial-enrichment/error states.
- [ ] Verify no raw provider key crosses to the browser.
- [ ] Verify stored V2 Daily Reading contains no pinyin fields.

## Data shape direction

```text
DailyReadingArticleV2
├─ source metadata
├─ immutable article title + Chinese paragraphs
├─ provenance (`source-captured` | `legacy-adapted`)
├─ classification/topic/level metadata
└─ enrichment
   ├─ translation: idle | running | ready | failed | blocked
   ├─ vocabulary: idle | running | ready | failed | blocked
   ├─ grammar: idle | running | ready | failed | blocked
   └─ questions: idle | running | ready | failed | blocked
```

A module failure never changes article readiness.

## Collection flow

```text
resolve settings
-> discover metadata candidates
-> preliminary rank
-> extract top candidates
-> content-quality validation/rerank
-> choose source article
-> normalize/fingerprint
-> persist article
-> article-ready
-> optionally resolve AI runtime
-> independently enrich translation/vocabulary/grammar/questions
```

## Migration strategy

- Introduce V2 additively first; do not delete V1 schema or storage reader while consumers remain.
- Read V2 first; if absent, read/parse V1 and migrate item-by-item.
- Validate V2 before writing it.
- Verify persisted V2 after write.
- Keep V1 storage untouched during the first migration release for rollback/recovery.
- Mark migrated V1 generated/adapted readings as `legacy-adapted`; never claim they are captured publisher originals.
- Ignore V1 persisted pinyin during migration.

## Error semantics

Capture errors: source unavailable, no matching article, timeout, invalid/contaminated/truncated content, offline, storage failure.

AI runtime errors: missing key, invalid key, quota exhausted, provider unavailable, network error, invalid response, cancelled, server vault unavailable.

Enrichment errors are module-local and must not convert a ready article into a failed Daily Reading.

## Verification discipline

Each scope must be small enough to leave the application working. Start with the smallest check that can falsify the scope, then escalate. Do not claim UI verification from source inspection. Avoid production DB/provider calls in automated tests; mock boundaries instead.

## Completion condition

When all scopes are complete and permanent docs contain the final architecture, delete this temporary implementation-plan file in the final cleanup commit.
