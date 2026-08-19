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
- [ ] Persist selected article before any AI request.
- [ ] Emit/represent `article-ready` independently from enrichment.
- [ ] Make Daily Reading library/reader render V2 article when enrichments are idle/blocked/failed.
- [ ] Keep V1 data readable through migration/compatibility.
- [ ] Verify reload after capture preserves the article.

### Scope 5 — Scheduler capture semantics
- [ ] Scheduler triggers capture, not all-or-nothing generation.
- [ ] A captured scheduled article completes the day even if enrichment fails.
- [ ] Respect configurable local release time with catch-up on focus/app open.
- [ ] Prevent duplicate daily captures after successful persistence.

### Scope 6 — Shared backend BYOK AI runtime
- [ ] Add one server-side runtime resolver for active user credentials/capabilities.
- [ ] Add a safe client readiness endpoint returning metadata/status only.
- [ ] Extract reusable Add API Key flow from Settings.
- [ ] Distinguish user missing/invalid/quota/provider errors from server vault misconfiguration.
- [ ] Do not use local/env provider keys as fallback.

### Scope 7 — Daily Reading enrichment modules
- [ ] Translation runs after durable article save and persists independently.
- [ ] Vocabulary, grammar and questions validate/persist independently.
- [ ] Partial success is preserved; retry only the failed module.
- [ ] Missing key sets enrichment to blocked while article stays ready.
- [ ] AI prompts use immutable captured article evidence and never rewrite Chinese source.

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
