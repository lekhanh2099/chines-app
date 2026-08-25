# AI Runtime + Daily Reading V2 — Temporary Implementation Plan

> TEMPORARY EXECUTION NOTE: delete this file only after every source scope is complete, executable verification has passed, viewport/manual verification is complete, and the durable contracts have been folded into permanent architecture docs. Do not leave this checklist as stale product documentation.

> **CURRENT CHECKOUT NOTE (2026-08-25):** the full repository gate passes on
> `main`; manual viewport, multi-tab, and authenticated runtime acceptance items
> below remain open. Earlier unchecked executable items are retained as phase
> history, not current gate status.

## Goal

Make Daily Reading an article-acquisition system with optional AI enrichment, and make every user-facing AI generation path use encrypted per-user BYOK credentials from the backend. Daily Reading must remain readable after source capture even if AI enrichment fails or no AI key exists. Conversation uses HTTP streaming rather than WebSocket.

Durable architecture authorities now created/updated during this migration:

- `docs/architecture/ai-runtime-byok.md`
- `docs/architecture/daily-reading-generation-handoff.md`

## Non-goals

- No Supabase schema/RLS migration for Daily Reading.
- No server cron for Daily Reading.
- No WebSocket transport.
- No provider API key in localStorage, IndexedDB, URL/search params or public env.
- No application-wide provider-key fallback for user-facing AI.
- No persisted pinyin in Daily Reading V2.
- No AI rewrite of the captured Chinese article.
- No new crawler/storage dependency unless existing primitives are proven insufficient.

## Hard invariants

1. `discover -> extract -> validate -> persist` is the critical Daily Reading path.
2. A persisted article is immediately readable and counts as the day's successful capture.
3. Translation, vocabulary, grammar and questions are independent retryable enrichments.
4. Missing/invalid/quota AI credentials never delete or invalidate a captured article.
5. Chinese source text is immutable after capture; AI only adds learning support.
6. Pinyin is derived at render/runtime from the existing contextual-pronunciation system.
7. User provider credentials come from encrypted backend storage only; browser surfaces receive masked metadata only.
8. Existing V1 Daily Reading data migrates safely with `legacy-adapted` provenance and V1 rollback data retained.
9. Automated tests mock provider/storage boundaries and must never write production data/provider state.
10. Missing semantic embeddings never block conversation; lexical memory remains the fallback.

## Scope status

### Scope 0 — Plan and permanent contracts

Status: source contract work complete; temporary plan intentionally retained until executable verification closes.

- [x] Record implementation order, invariants, migration and deletion note.
- [x] Add durable strict-BYOK runtime architecture contract.
- [x] Replace stale Daily Reading V1 handoff with V2 article-first contract.
- [ ] Delete this temporary plan only after Scope 13 executable/manual verification passes.

### Scope 1 — Additive Daily Reading V2 foundation

Status: source implementation complete; executable checks pending.

- [x] V2 article/enrichment/capture-run/enrichment-run schemas added additively.
- [x] Provenance distinguishes `source-captured` and `legacy-adapted`.
- [x] V2 persisted contract contains no pinyin.
- [x] V1 -> V2 migration validates before write and retains V1 recovery data.
- [x] Deterministic migration/schema tests added.
- [ ] Execute targeted type/test checks.

### Scope 2 — Collection preferences and resolved policy

Status: source implementation complete; executable checks pending.

- [x] Capture time, freshness, topics, sources, preferred length, diversity/repeat, fallback, target level and auto-enrichment are versioned settings.
- [x] V1 defaults migrate safely.
- [x] Reviewed source catalog is centralized without broadening the allowlist.
- [x] User preferences resolve against app-owned safety bounds.
- [x] Deterministic settings/policy tests added.
- [ ] Execute targeted type/test checks.

### Scope 3 — Source acquisition hardening

Status: source implementation complete and the live false-`incoherent-paragraphs`/first-eight-candidates bug was fixed during user verification.

- [x] Metadata score is separate from extracted-content quality.
- [x] Multiple bounded candidate batches are extracted before final selection.
- [x] Validated content is reranked using extraction confidence, Chinese density, coherence, title/body consistency, freshness and preferred length.
- [x] Structured/semantic article extraction precedes page-wide paragraph fallback.
- [x] Cleaned paragraph boundaries and page title/date evidence are preserved.
- [x] Truncated/stale/future/low-density/incoherent/title-body/date failures are rejected.
- [x] Source/topic/freshness/repeat and bounded expand-window settings are honored.
- [x] Short valid news paragraphs are not rejected by contradictory magic-length thresholds.
- [x] Collector continues beyond the first eight failed candidates within app-owned limits.
- [x] Deterministic parser/quality/ranking regressions added.
- [ ] Add publisher-specific selectors only if verified live HTML fixtures prove a stable selector contract.
- [ ] Execute targeted type/test checks.

### Scope 4 — Article-first persistence

Status: source implementation complete; reload/render execution pending.

- [x] Authenticated source-only capture route never resolves AI credentials.
- [x] Source-captured V2 article preserves Chinese paragraph order/provenance.
- [x] Article persists before capture-success telemetry.
- [x] Versioned V2 ledger/settings writes parse, verify and compact safely under quota pressure.
- [x] V2 reads first; absent V2 safely migrates V1 while leaving V1 keys untouched.
- [x] ID/source-URL/fingerprint deduplication is enforced.
- [x] Article readiness is independent from enrichment state.
- [x] V2 source storage is pinyin-free.
- [x] Capture/storage tests use mocked boundaries.
- [ ] Execute targeted checks and actual reload/render verification.

### Scope 5 — Scheduler capture semantics

Status: source implementation complete; multi-tab browser execution pending.

- [x] Scheduler captures source instead of waiting for all AI generation.
- [x] Persisted scheduled article is the day's success regardless of enrichment.
- [x] Configurable capture time uses `Asia/Ho_Chi_Minh` with mount/focus/visibility catch-up.
- [x] Article persistence prevents duplicate recapture even if run telemetry fails.
- [x] Retry/backoff/interrupted/offline recovery remains bounded.
- [x] Existing cross-tab coordination lock is reused and task errors cannot accidentally rerun through another lock backend.
- [x] Auto enrichment starts only after durable capture success.
- [x] Scheduler/lock decisions have deterministic tests.
- [ ] Execute targeted checks and multi-tab browser verification.

### Scope 6 — Shared backend BYOK AI runtime

Status: source implementation complete; executable/UI checks pending.

- [x] `ai-runtime.service.ts` owns active encrypted credential selection by priority/capability.
- [x] Decrypted credentials stay server-only; readiness exposes masked metadata only.
- [x] Capabilities cover conversation, Daily Reading translation/learning, lookup, structured memory and semantic memory.
- [x] Missing key is distinct from schema/vault/credential-read failure.
- [x] Shared provider-operation error taxonomy exists.
- [x] Authenticated `GET /api/ai/runtime` and client query owner are implemented.
- [x] Shared runtime never reads provider API keys from browser storage or provider env variables.
- [x] Reusable Add API Key dialog keeps plaintext transient and persists through encrypted backend storage.
- [x] Key/runtime queries invalidate after credential mutations.
- [x] vi/en/zh-CN key-storage state copy is present.
- [ ] Execute targeted type/test/i18n/source-standard checks.
- [ ] Render/verify Add-Key focus, Select collision, discovery/loading/failure/success states.

### Scope 7 — Daily Reading enrichment modules

Status: source implementation complete; executable checks pending. Manual verification exposed Groq 429 classification ambiguity; source handling has been hardened and needs rerender/retest.

- [x] Authenticated V2 enrichment route resolves only shared user capabilities.
- [x] Groq/OpenAI/DeepSeek/Gemini enrichment is personal-key-only.
- [x] Translation chunks preserve every source paragraph ID/order.
- [x] V2 enrichment prompts/persistence stay pinyin-free and cannot rewrite source Chinese.
- [x] Vocabulary/grammar/question evidence is validated against immutable source text.
- [x] Modules repair, persist, fail/block and retry independently.
- [x] Ready sibling modules survive later failures.
- [x] Missing/invalid/quota/provider states are module-local blocked states; network/invalid-response/cancelled are module-local failures.
- [x] Groq HTTP 429/rate-limit failures are no longer classified as exhausted account quota by default.
- [x] V2 Groq enrichment performs bounded, abort-aware retries using `retry-after`/rate-limit reset hints before surfacing a temporary provider limit.
- [x] Provider error bodies stay server-side; learner-facing diagnostics remain bounded and non-secret.
- [x] Deterministic route/provider/service/client/storage/chunking tests added, including transient/repeated Groq 429 regressions.
- [x] Reader/settings expose module-local status/retry/Add-Key/manage-key actions.
- [ ] Execute targeted type/test/source-standard checks.

### Scope 8 — Daily Reading Settings and status UX

Status: source implementation complete and real source discovery has been manually exercised. First browser verification exposed stale i18n rendering and unowned raw icons; source fixes are landed and require another render pass.

- [x] Settings clearly separate source capture from optional AI learning support.
- [x] Primary settings expose auto capture, capture time and target level.
- [x] Advanced disclosure exposes freshness, length, no-match behavior, diversity, recent avoidance, topics and reviewed sources.
- [x] Empty topic/source selections are prevented.
- [x] Manual source action is source-oriented (`Tìm bài mới` / localized equivalent).
- [x] Source preview uses the capture policy without persistence or AI runtime.
- [x] AI readiness/recovery is independent from source status.
- [x] Ready article remains visible regardless of enrichment state.
- [x] Runtime pinyin follows Reader display settings without V2 persistence.
- [x] Daily Reading workspace uses canonical `PageHeader`, `Tabs`, one-column article rows and the existing `ReaderSurface` rather than a parallel reader dialect.
- [x] Real capture/enrichment run history is exposed as an Activity tab instead of fake status cards.
- [x] Raw standalone feature icons that escaped primitive sizing were removed from article/detail/source rows.
- [x] Settings now exposes V2 saved-article management with per-article/delete-all confirmation while preserving diagnostic run history.
- [x] vi/en/zh-CN V2 messages include library/activity/management/status copy and partial-enrichment/source-preview regressions.
- [ ] Re-render after a clean dev-server/message reload and confirm no `DailyReading.v2.*` missing-message text remains.
- [ ] Execute targeted type/test/i18n/source-standard checks.
- [ ] Verify 390x844, 820x1180 and 1440x900 light/dark plus keyboard/touch/error/destructive states.

### Scope 9 — Conversation HTTP streaming

Status: source implementation complete; executable/viewport verification pending.

- [x] Persist user message and `clientMessageId` idempotency before provider streaming.
- [x] Dedicated authenticated `/api/ai/conversation/stream` NDJSON route added without breaking the legacy JSON compatibility route.
- [x] Persisted user-facing turns resolve shared personal `conversation` runtime only.
- [x] Provider SSE is normalized to `start` / `delta` / `heartbeat` / `final` / `error` NDJSON events.
- [x] Provider reasoning fields and split `<think>` content are suppressed before UI deltas.
- [x] Complete response is final-sanitized before assistant persistence.
- [x] Stop aborts provider work; cancelled partial assistant output is presentation-only.
- [x] Retry reuses the same client message ID and replay skips a second provider call when a final assistant already exists.
- [x] Streaming bubble exposes compact Stop action.
- [x] Auto is personal-BYOK-only; history remains readable without a key; Add-Key recovery is available in the runtime menu.
- [x] vi/en/zh-CN streaming/runtime copy and deterministic stream regressions added.
- [ ] Execute targeted type/test/i18n/source-standard checks.
- [ ] Render/verify phone, iPad and desktop streaming/Stop/retry/missing-key/provider-error states.

### Scope 10 — Conversation memory/runtime migration

Status: source implementation complete; executable checks pending.

- [x] Structured memory extraction/summary resolves shared `structured-memory` user runtime only.
- [x] System conversation provider service and its tests were removed after consumer migration.
- [x] Semantic embedding resolves compatible personal `semantic-memory` runtime only.
- [x] Embedding code no longer reads `GEMINI_API_KEY`.
- [x] Missing/unavailable semantic embeddings fall back to lexical retrieval and never block chat.
- [x] Post-turn embedding enrichment is opportunistic/deferred rather than turn-fatal.
- [x] Runtime/memory/embedding tests cover strict BYOK and lexical fallback.
- [ ] Execute targeted type/test/source-standard checks.

### Scope 11 — Remaining AI surfaces

Status: source implementation complete for known user-facing consumers; executable checks pending.

- [x] Lookup word/sentence generation resolves shared `lookup` capability.
- [x] Basic/deep lookup AI fallback resolves shared `lookup` capability.
- [x] Vocabulary generation resolves shared `lookup` capability.
- [x] Editor word/sentence enrichment resolves shared `lookup` capability.
- [x] Cached dictionary/lesson/legacy usable data returns without requiring an AI key.
- [x] Legacy Daily Reading generation is gated by shared personal `daily-reading-learning` capability.
- [x] Legacy conversation compatibility generation is gated by shared personal `conversation` capability.
- [x] Compatibility bridge may recover only the exact credential selected by `ai-runtime.service`; it does not own fallback order.
- [x] Route/bridge regressions were added or updated for cache-first and missing-key boundaries.
- [ ] Execute targeted type/test/api/source-standard checks.

### Scope 12 — Remove/isolate system-provider fallbacks

Status: active user-facing runtime source migration complete; dormant legacy adapter isolation and executable proof remain to verify.

- [x] Active conversation generation/health no longer uses a system provider key.
- [x] Obsolete `ai-conversation-system.server.ts` runtime owner was removed after consumer proof.
- [x] Active Daily Reading V1/V2 generation no longer falls back to system Gemini.
- [x] Daily Reading legacy provider compatibility fallback is fail-closed rather than reading provider env.
- [x] Semantic embeddings no longer read system Gemini env.
- [x] Known lookup/editor/vocab user-facing callers resolve shared personal runtime before legacy structured adapters.
- [x] `.env.example` no longer documents `GEMINI_API_KEY` or `DEEPSEEK_API_KEY` provider fallbacks.
- [x] Infrastructure secrets such as BYOK encryption and Supabase server credentials remain documented.
- [x] Durable `docs/architecture/ai-runtime-byok.md` and V2 Daily Reading handoff document the final runtime contract.
- [ ] In executable verification, prove no reachable user-facing route can enter dormant provider-env compatibility paths in `ai.service.ts`.

### Scope 13 — Regression and UI verification

Status: first manual Daily Reading verification is actively feeding source fixes back into the branch; full executable/browser gate remains open.

- [x] Real source capture was manually exercised and the source-quality false-negative regression was fixed.
- [x] First Daily Reading UI pass identified raw missing-message text and oversized raw feature icons; source/i18n ownership fixes are landed.
- [x] First AI-support pass identified Groq 429 being conflated with account quota; classification and V2 bounded retry are hardened.
- [ ] Re-pull/restart the local dev server and reverify the Daily Reading list, detail, Activity log and Settings article manager.
- [ ] Run focused unit/integration suites for Daily Reading, AI runtime, lookup/editor and Conversation.
- [ ] Run `npm run source:check`, `route:check`, `ui:check`, `api:check`, `typecheck`, `test:run`, `format:check` and final `npm run check`.
- [ ] Render Daily Reading/Settings/Conversation at 390x844, 820x1180 and 1440x900 in light/dark.
- [ ] Verify keyboard/focus/dialog/select/loading/offline/missing-key/partial-enrichment/streaming/error/destructive states.
- [ ] Verify no raw provider key crosses to browser/storage/log-facing payloads.
- [ ] Verify stored V2 Daily Reading contains no pinyin fields.
- [ ] Verify multi-tab capture single-flight and reload/migration recovery.
- [ ] After every item above passes and permanent docs remain current, delete this temporary plan.

## Verification discipline

Each source scope must leave the application working. Start with the smallest deterministic test boundary, then escalate. Mock provider/storage/DB boundaries; never write production data/provider state during automated tests. Do not claim UI, typecheck, test, build or full-gate success from source inspection.

## Completion condition

Source implementation is complete through Scope 12. The migration is **not release-complete** until Scope 13 has actually run in an executable checkout/browser environment. Keep this temporary file until that verification is complete; then remove it in the final cleanup commit rather than preserving stale execution history.
