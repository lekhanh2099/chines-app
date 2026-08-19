# AI Runtime + Daily Reading V2 — Temporary Implementation Plan

> TEMPORARY EXECUTION NOTE: delete this file when every scope below is complete, verified, and the durable architecture/contracts have been folded into the permanent docs. Do not leave this checklist as stale product documentation.

## Goal

Make Daily Reading an article-acquisition system with optional AI enrichment, and make all user-facing AI use encrypted per-user BYOK credentials from the backend. Daily Reading must remain readable after source capture even if AI enrichment fails or no AI key exists. Conversation uses HTTP streaming rather than WebSocket.

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
9. Automated tests mock provider/storage boundaries and never write production data/provider state.

## Scope order

### Scope 0 — Plan and contracts

- [x] Record implementation order, invariants, migration and deletion note in this temporary file.
- [ ] Keep permanent architecture docs synchronized as contracts become final.

### Scope 1 — Additive Daily Reading V2 foundation

Status: additive V2 schema/migration foundation is implemented; executable verification remains pending.

- [x] Add V2 article/enrichment/capture-run/enrichment-run schemas without breaking V1 consumers.
- [x] Define provenance: `source-captured` vs `legacy-adapted`.
- [x] Remove pinyin from the V2 persisted contract.
- [x] Add pure V1 -> V2 item/ledger migration helpers and preserve legacy run history separately.
- [x] Add deterministic migration/schema tests including explicit no-pinyin persistence coverage.
- [ ] Execute targeted type/test checks when an executable checkout is available.

### Scope 2 — Collection preferences and resolved policy

Status: V2 collection settings and app-owned safety policy are implemented and now consumed by the active V2 capture/settings flow.

- [x] Add local capture time, freshness, topics, sources, preferred length, diversity/repeat behavior, no-match fallback, target level and auto-enrichment settings.
- [x] Preserve current defaults during V1 -> V2 migration.
- [x] Centralize reviewed source IDs/domains/publisher labels without broadening the allowlist.
- [x] Add a resolved policy owner that combines user preferences with app-owned safety bounds.
- [x] Add deterministic settings/policy tests.
- [ ] Execute targeted type/test checks when an executable checkout is available.

### Scope 3 — Source acquisition hardening

Status: source discovery/extraction is policy-aware and reranks validated article content rather than accepting the first extractable candidate.

- [x] Separate metadata discovery score from extracted-content quality score.
- [x] Extract bounded top-candidate batches before final selection.
- [x] Rerank using extraction confidence, Chinese density, paragraph coherence, title/body consistency, freshness and preferred length.
- [x] Prefer JSON-LD `articleBody`, `itemprop=articleBody`, semantic `<article>`, known content containers and `<main>` before page-wide `<p>` fallback.
- [x] Preserve cleaned paragraph boundaries and page title/date evidence up to the app-owned safety ceiling.
- [x] Reject truncated, stale/future, low-density, incoherent, title/body-mismatched and materially date-mismatched candidates.
- [x] Honor source/topic/freshness/repeat filters and configured `expand-window` behavior.
- [x] Add deterministic parser/quality/ranking tests.
- [ ] Add source-specific selectors only when live HTML fixtures prove a stable publisher contract.
- [ ] Execute targeted type/test checks when an executable checkout is available.

### Scope 4 — Article-first persistence

Status: V2 capture is the primary Daily Reading acquisition/library path; V1 remains a rollback/legacy compatibility owner.

- [x] Add authenticated source-only capture route that never resolves AI credentials.
- [x] Build `source-captured` V2 article while preserving cleaned Chinese paragraph order and source provenance.
- [x] Persist article before capture-success telemetry; telemetry failure cannot roll article back.
- [x] Add versioned V2 ledger/settings storage with parse/write/read-back verification and quota compaction.
- [x] Read V2 first and safely migrate V1 when V2 is absent while leaving V1 keys untouched for recovery.
- [x] Deduplicate by article ID, source URL and article fingerprint.
- [x] Treat persisted source as `article-ready` independent of enrichment state.
- [x] Keep source-captured V2 storage pinyin-free.
- [x] Add capture-builder/route/storage tests without production provider/DB writes.
- [ ] Execute targeted checks and actual reload/render verification when an executable checkout is available.

### Scope 5 — Scheduler capture semantics

Status: the scheduler captures the source article first and may start optional enrichment only after durable capture success.

- [x] Switch scheduler from all-or-nothing generation to `captureDailyReadingNow`.
- [x] Count a persisted scheduled V2 article as the day's success independent of enrichment.
- [x] Respect V2 `captureTime` in `Asia/Ho_Chi_Minh`, including catch-up on mount/focus/visibility change.
- [x] Prevent duplicate capture after article persistence even if run telemetry fails.
- [x] Preserve bounded retry/backoff and interrupted/offline recovery.
- [x] Reuse cross-tab Daily Reading coordination lock.
- [x] If auto enrichment is enabled, start it only after scheduled article save; enrichment failure does not change capture success.
- [x] Add scheduler/lock/capture-run decision tests.
- [ ] Execute targeted checks and multi-tab browser verification when an executable checkout is available.

### Scope 6 — Shared backend BYOK AI runtime

#### Scope 6A — Runtime resolver and readiness

Status: strict user-BYOK resolver/readiness contract is implemented additively.

- [x] Resolve active encrypted user credentials by priority and capability.
- [x] Keep decrypted provider secrets server-only; browser readiness receives only safe metadata.
- [x] Model capabilities for conversation, Daily Reading translation/learning, lookup, structured memory and Gemini-compatible semantic memory.
- [x] Distinguish missing key from schema/vault/credential-read failures.
- [x] Add shared operational error taxonomy.
- [x] Add authenticated `GET /api/ai/runtime` and TanStack Query readiness owner.
- [x] Never read provider API keys from localStorage or `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` in the shared user runtime.
- [x] Add resolver/route tests proving capability selection and no raw key exposure.
- [ ] Execute targeted type/test checks when an executable checkout is available.

#### Scope 6B — Reusable Add API Key interaction

Status: Settings owns one reusable paste/discover/provider/model/verify/save interaction.

- [x] Extract reusable `AddApiKeyDialog` from API Key Manager.
- [x] Keep plaintext provider credential transient until POST; backend encrypted storage remains the persistence owner.
- [x] Distinguish secure-storage failure from normal missing-key state.
- [x] Allow replacement-key recovery when stored credential is unreadable.
- [x] Invalidate managed-key and runtime-readiness queries after mutations.
- [x] Add vi/en/zh-CN storage-state copy parity.
- [ ] Execute targeted type/i18n/UI checks when executable checkout is available.
- [ ] Render/verify Dialog focus return, Tab trapping, Select collision, clipboard/discovery loading, failure and success states.

### Scope 7 — Daily Reading enrichment modules

Status: independent strict-BYOK post-capture enrichment modules are implemented and wired to Scope 8 UI.

- [x] Add authenticated enrichment route resolving only shared user runtime capabilities.
- [x] Keep Groq/OpenAI/DeepSeek/Gemini V2 enrichment user-key-only with no provider-env fallback.
- [x] Translate immutable captured article in bounded chunks preserving every paragraph ID/order.
- [x] Keep enrichment prompts/persistence pinyin-free and forbid rewriting source Chinese.
- [x] Validate vocabulary terms against source text and reject duplicates/invented items.
- [x] Validate grammar evidence against complete source sentences.
- [x] Validate question paragraph IDs/source phrases and required question-type coverage.
- [x] Repair/validate each module independently.
- [x] Persist module state independently; run history is diagnostic only.
- [x] Preserve interruption/partial-success semantics.
- [x] Map missing/invalid/quota/provider states to module-local blocked states and network/invalid-response/cancelled to module-local failures.
- [x] Add per-module retry/full-support client entry points while preserving ready modules.
- [x] Add deterministic route/provider/service/client/storage/chunking tests with mocked provider/storage boundaries.
- [x] Wire module status, retry/Add-Key/manage-key controls and optional auto-enrichment into the rendered V2 reader/settings flow.
- [ ] Execute targeted type/test/source-standard checks when an executable checkout is available.

### Scope 8 — Daily Reading Settings and status UX

Status: V2 source-first settings/status UX is implemented. Source preview/capture is independent from AI, optional enrichment starts only after article persistence, and the reader exposes module-local status/actions while retaining the article. Source/type/UI execution verification remains pending because this agent runtime has no executable checkout.

- [x] Redesign Daily Reading settings into a clear source-capture section, separate AI-learning section and progressive advanced criteria.
- [x] Expose auto capture, capture time and target level as primary settings.
- [x] Expose freshness, preferred length, no-match behavior, topic diversity, recent-article avoidance, allowed topics and reviewed sources under advanced disclosure.
- [x] Guard topic/source controls so the user cannot persist an empty selection.
- [x] Rename manual acquisition to source-oriented `Tìm bài mới` / equivalent localized copy.
- [x] Add V2 source preview using the same source-capture contract without persisting article/run data and without resolving an AI key.
- [x] Make source-test copy explicitly state that source testing and article capture do not use an AI API key.
- [x] Separate AI readiness from source status and show ready/missing-key/storage-unavailable/credential-unreadable recovery actions.
- [x] Reuse `AddApiKeyDialog` directly from Daily Reading for missing/replacement key flows.
- [x] Surface translation/vocabulary/grammar/questions as independent idle/running/ready/failed/blocked states with module-local retry or key-management actions.
- [x] Keep the article visible regardless of enrichment state and expose ready learning tabs only when their module exists.
- [x] Preserve already-ready modules when completing missing support or when a later module becomes blocked.
- [x] Start optional enrichment after manual/scheduled source save without coupling AI failure to capture success.
- [x] Derive title, reading-paragraph and vocabulary pinyin at render time from the existing contextual-pronunciation engine and current reader display setting; persist no V2 pinyin.
- [x] Add vi/en/zh-CN V2 message wiring and source-preview/partial-enrichment regression tests.
- [ ] Execute targeted type/test/i18n/source-standard checks when an executable checkout is available.
- [ ] Render and verify 390x844, 820x1180 and 1440x900 in light/dark, including keyboard/touch, Dialog/Select, missing-key, runtime-error and partial-enrichment states.

### Scope 9 — Conversation HTTP streaming

Status: persisted conversation turns now have an additive HTTP/NDJSON streaming path backed only by the shared personal BYOK runtime. The legacy JSON route remains available as a compatibility surface until cleanup. Source implementation and deterministic regression coverage are present; executable type/test/UI verification remains pending.

- [x] Preserve user-message persistence and `clientMessageId` idempotency before provider streaming.
- [x] Add a dedicated authenticated `/api/ai/conversation/stream` NDJSON route without breaking the legacy JSON route/action.
- [x] Resolve persisted user-facing turns through shared `conversation` BYOK capability only; no system-provider fallback in the persisted turn path.
- [x] Stream Groq/OpenAI/DeepSeek/Gemini provider responses over SSE internally and emit normalized `start` / `delta` / `heartbeat` / `final` / `error` NDJSON events to the browser.
- [x] Ignore provider reasoning fields and incrementally suppress `<think>` content across split chunk boundaries before any delta reaches the UI.
- [x] Final-sanitize the complete server-side reply before assistant persistence and emit `final` only after that persisted assistant exists.
- [x] Add Stop through AbortController; cancelled partial assistant output stays presentation-only and is not persisted.
- [x] Preserve retry with the same `clientMessageId`; an already-persisted assistant reply is replayed without a second provider call.
- [x] Render streamed assistant text in the existing typing bubble and expose a compact Stop action while the stream is active.
- [x] Keep transient stream presentation in a scoped TanStack Store rather than persisted/browser storage.
- [x] Make Auto runtime personal-BYOK-only, keep history readable without a key, gate new sends through runtime health, and expose reusable Add API Key recovery in the runtime menu.
- [x] Update vi/en/zh-CN runtime/Stop copy parity.
- [x] Add deterministic filter/provider/client/route/turn tests for split reasoning tags, SSE parsing, personal-key use, idempotent replay and cancelled persistence safety.
- [ ] Execute targeted type/test/i18n/source-standard checks when an executable checkout is available.
- [ ] Render/verify phone, iPad and desktop states for streaming, Stop, retry, missing-key/Add-Key and provider failures.

### Scope 10 — Conversation memory/runtime migration

- [ ] Structured memory uses the shared user runtime only.
- [ ] Semantic embedding uses a compatible user runtime when available.
- [ ] Missing semantic embedding falls back to lexical memory and never blocks chat.

### Scope 11 — Remaining AI surfaces

- [ ] Migrate lookup/deep/basic AI enhancement, vocab generation, editor context and remaining user-facing AI callers to shared runtime.
- [ ] Preserve cached/non-AI functionality without an AI key.

### Scope 12 — Remove system-provider fallbacks

- [ ] Remove/isolate user-facing `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` fallback paths after all consumers migrate.
- [ ] Keep infrastructure secrets such as BYOK encryption/Supabase server credentials.
- [ ] Update `.env.example` and permanent architecture docs.

### Scope 13 — Regression and UI verification

- [ ] Run targeted unit/integration checks per scope.
- [ ] Run final `npm run check` when implementation is complete.
- [ ] Render Daily Reading/Settings/Conversation at 390x844, 820x1180, 1440x900 in light/dark.
- [ ] Verify keyboard/focus/dialog/select/loading/offline/missing-key/partial-enrichment/error states.
- [ ] Verify no raw provider key crosses to browser.
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
- Validate V2 before writing it and verify the persisted V2 value after write.
- Keep V1 storage untouched during the first migration release for rollback/recovery.
- Mark migrated V1 generated/adapted readings as `legacy-adapted`; never claim they are captured publisher originals.
- Ignore V1 persisted pinyin during migration.

## Error semantics

Capture errors: source unavailable, no matching article, timeout, invalid/contaminated/truncated content, offline, storage failure.

AI runtime errors: missing key, invalid key, quota exhausted, provider unavailable, network error, invalid response, cancelled, server vault unavailable.

Enrichment errors are module-local and must not convert a ready article into a failed Daily Reading.

## Verification discipline

Each scope must leave the application working. Start with the smallest deterministic check that can falsify the scope, then escalate. Do not claim UI verification from source inspection. Avoid production DB/provider calls in automated tests; mock boundaries instead.

## Completion condition

When all scopes are complete and permanent docs contain the final architecture, delete this temporary implementation-plan file in the final cleanup commit.
