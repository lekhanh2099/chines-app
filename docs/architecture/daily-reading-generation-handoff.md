# Daily Reading V2 — implementation handoff

Status: source implementation complete; executable and viewport verification still required before release.

Shared AI credential/runtime authority: `docs/architecture/ai-runtime-byok.md`.

## Product contract

Daily Reading V2 is a local-first article acquisition feature. Its critical path is:

```text
discover -> extract -> validate/rerank -> persist source article -> readable
```

AI enrichment is optional and starts only after the source article is durably stored.

The product must preserve this invariant:

```text
article acquisition success != AI enrichment success
```

A missing API key, quota error, invalid AI response or failed grammar/question module must never hide or invalidate an already captured article.

## Release clock and scheduler

The scheduler remains browser-session-owned rather than server cron.

- Default capture time is 10:00 in `Asia/Ho_Chi_Minh`; V2 settings can change the local capture time.
- When an authenticated visible app session reaches/passes the configured time, the scheduler may capture the day's source.
- If the app was closed, the next visible session performs catch-up.
- A persisted scheduled V2 article counts as that day's success even when later enrichment fails.
- Multiple tabs coordinate through the existing Daily Reading lock to avoid duplicate capture.

The application must not claim that Daily Reading runs while every browser/app session is closed.

## Collection settings and policy

User settings may influence:

- capture time;
- target HSK level;
- source freshness window;
- topics;
- reviewed sources;
- preferred article length;
- topic diversity and recent-article avoidance;
- no-match behavior (`skip-day` vs bounded freshness expansion);
- whether AI learning support starts automatically after capture.

Internal safety/quality bounds remain application-owned. User settings never expand the reviewed publisher allowlist or bypass content-quality checks.

## Source acquisition

`src/features/hanzihome/reader/daily-reading/daily-reading-source.server.ts` owns discovery orchestration.

Discovery uses reviewed official RSS/listing sources plus bounded GDELT discovery. Metadata ranking is not the final selection authority. The collector extracts multiple candidates and reranks the validated content.

Extraction priority is:

```text
JSON-LD articleBody
-> itemprop=articleBody
-> semantic <article>
-> reviewed/known content containers
-> <main>
-> generic paragraph fallback
```

The parser preserves cleaned paragraph boundaries. Quality validation evaluates extraction confidence, Chinese density, paragraph coherence, title/body consistency, freshness, preferred length, truncation and date evidence.

If an early candidate batch fails quality checks, collection continues through bounded later batches rather than treating the first eight failures as proof that no article exists.

## Article-first persistence

New captures use the V2 ledger and `source-captured` provenance.

The browser:

1. receives a validated source-capture response;
2. writes the immutable Chinese article to V2 storage;
3. verifies the stored value;
4. only then records capture success/run telemetry;
5. optionally starts AI enrichment.

Telemetry failure after article persistence cannot roll the article back.

Deduplication uses article ID, canonical source URL and content fingerprint.

V1 local data is migrated additively when V2 is absent. V1 storage remains untouched for rollback/recovery during the migration period, and migrated content is labeled `legacy-adapted` rather than `source-captured`.

## Pinyin contract

Daily Reading V2 persists no pinyin fields.

Title/paragraph/vocabulary pinyin is derived at render time through the existing contextual-pronunciation engine and current reader display settings. This avoids treating automatically generated readings as pronunciation source of truth.

Legacy V1 data may still contain historical pinyin and `pinyinReviewStatus`; migration intentionally does not copy those fields into V2.

## AI enrichment

Enrichment modules are independent:

```text
translation
vocabulary
grammar
questions
```

Each module owns its own `idle | running | ready | failed | blocked` state and can be retried independently. A later failure must not reset already-ready sibling modules.

All V2 enrichment uses the shared personal-BYOK runtime described in `docs/architecture/ai-runtime-byok.md`. There is no application-wide Gemini/DeepSeek provider-key fallback.

Translation preserves source paragraph IDs/order. Vocabulary must occur in source text. Grammar evidence must match source sentences. Question evidence must point to valid paragraph IDs/source phrases and satisfy the required question-type coverage.

The captured Chinese article is immutable; enrichment must not rewrite it.

## Reader and settings UX

The primary UI separates two concepts:

```text
Bài nguồn / Source article
AI hỗ trợ học / AI learning support
```

Source test and article capture do not require an AI key. A missing key only blocks enrichment and presents the reusable Add API Key recovery interaction.

The reader remains usable when every enrichment module is idle/blocked/failed. Ready enrichment tabs appear as their data becomes available.

Advanced source criteria use progressive disclosure so capture time/target level/source status remain the primary settings.

## Legacy compatibility

The legacy `/api/hanzihome/reader/daily-reading/generate` route and V1 generated-learning structures may remain temporarily for old data/consumer compatibility. They are no longer the primary V2 path and are personal-BYOK-only. System provider fallback is disabled.

Do not remove V1 read/migration support until release verification proves existing browser data remains recoverable.

## Database boundary

Daily Reading V2 adds no Supabase schema/RLS migration and no hosted Daily Reading article persistence. Article/settings/run state remains browser-local by design.

## Focused verification

Run the feature tests and repository gates in an executable checkout. At minimum include the V2 schema/migration/settings/policy/source/capture/storage/scheduler/enrichment tests plus route tests for source capture/enrichment and i18n.

Then run:

```bash
npm run source:check
npm run route:check
npm run ui:check
npm run api:check
npm run typecheck
npm run test:run
npm run format:check
npm run check
```

Manual browser acceptance must cover mobile ~390×844, iPad portrait ~820×1180 and desktop 1440×900 in light/dark; source test/capture without a key; auto capture/catch-up; multi-tab single flight; pinyin toggle; partial enrichment/retry; missing-key/Add-Key; reload persistence; offline/interruption and no overflow/focus regressions.

No executable or viewport gate is considered passed until it is actually run in a dependency/browser environment.
