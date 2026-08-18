# Daily Reading Generation — implementation handoff

Status: source implementation complete on `feat/persistent-social-memory-ai-redesign`; local verification still required before merge.

## Product contract

Daily Reading is intentionally local-first.

- Release clock: 10:00 in `Asia/Ho_Chi_Minh`.
- If the authenticated app is open and visible at/after 10:00, the scheduler may create that day's scheduled reading.
- If the app was closed at 10:00, the first visible app session after 10:00 performs the catch-up attempt.
- Turning automatic generation off prevents scheduled runs but does not disable `Kiểm tra nguồn thật` or `Tìm và tạo bài ngay`.
- This is not a server cron. The product must not claim that generation runs while every browser/app session is closed.

## Source discovery

`src/features/hanzihome/reader/daily-reading/daily-reading-source.server.ts`

The server searches reviewed Chinese-news sources using official RSS/listing endpoints plus a bounded GDELT discovery fallback. The source policy:

- canonicalizes HTTPS URLs and strips tracking parameters;
- allows only reviewed publisher domains;
- prefers recent articles and topic diversity;
- rejects excluded/high-risk news themes for the learner-reading product;
- fetches bounded HTML with timeouts and a 2 MB limit;
- requires at least three usable paragraphs and 240 Han characters before a page can become source evidence.

The source-test endpoint returns only bounded metadata/report fields. Extracted publisher article text is never returned to the browser or persisted in the local Daily Reading archive.

## Generation pipeline

`POST /api/hanzihome/reader/daily-reading/generate` is authenticated and streams NDJSON progress events:

1. `discovering`
2. `extracting`
3. `drafting` / `repairing_core`
4. `checkpoint` after the reading core is valid
5. `enriching` / `repairing_learning`
6. `validating`
7. `finalizing`
8. browser-owned `saving`
9. browser-owned `completed`

The server generates the reading in two structured stages:

- reading core: title, learning value, level/topic, 4–8 paragraphs;
- learning apparatus: vocabulary, grammar evidence, questions, source phrases, verification note.

The reading core is checkpointed before learning enrichment starts. Learning enrichment retries from that locked core when a provider or validation attempt fails, and a later request can resume from the checkpoint without rediscovering or regenerating the source reading. Deterministic validation checks include source-copy protection, vocabulary presence in the locked reading, grammar evidence matching a sentence in the locked reading, required question-type coverage, and evidence paragraph bounds. Content is not rejected merely for missing an arbitrary character-count target.

The active personal API key is tried first. If no usable personal structured result is produced, the configured system Gemini runtime is used. Provider choice does not weaken the same Zod/content validation boundary.

Pinyin for generated titles, paragraphs and vocabulary is produced by the existing `pinyin-pro` dependency. It is stored with `pinyinReviewStatus: "auto-generated"`; UI copy explicitly warns that pronunciation should be checked before speaking practice.

## Local persistence and retry

The browser stores a versioned Daily Reading ledger and settings in localStorage.

- Up to 120 readings and 400 run records are accepted by schema.
- Writes are verified after storage.
- Quota pressure progressively compacts the archive rather than silently failing the current write.
- Corrupt ledger content is preserved in a bounded recovery key before reset.
- A failed generation keeps source metadata and the validated reading core in a separate checkpoint; raw publisher article text is never persisted.
- Readings deduplicate by ID, source URL and content fingerprint.
- Clearing generated readings requires a destructive confirmation dialog and intentionally keeps run history for diagnostics.

Scheduled retry behavior:

- succeeded scheduled run: blocks another scheduled reading for that date;
- fresh pending run: blocks for 15 minutes;
- hard failure: backs off for 30 minutes;
- interrupted/offline failure: can retry immediately, resuming from the checkpoint when one exists;
- three hard failures for the date stop further automatic attempts.

## Cross-tab coordination

Generation is single-flight across tabs:

1. `navigator.locks` when available;
2. IndexedDB transactional lease fallback;
3. localStorage lease as the final browser fallback.

The lease has a bounded lifetime and heartbeat so a crashed tab does not block the feature permanently.

## UI integration

`/daily-reading` now uses the generated local library as its default landing surface. Generated-reading selection is URL-owned through `?generated=<id>`, so refresh/back navigation preserves the selected local article.

Existing static Reader content remains available for the existing `?document=<id>` deep-link path; it is not loaded on the generated-library landing path.

`/settings?section=reading` includes:

- automatic generation switch;
- HSK 4/5/6 default level;
- real-source test;
- manual generate-now action;
- current pipeline status;
- six most recent run records;
- confirmed local-library clear action.

The global authenticated app layout mounts `DailyReadingSchedulerAgent`, so catch-up is not tied to keeping the Daily Reading page open.

## Database boundary

This implementation adds no database migration, RLS change, Supabase table, extension or hosted-data write. Daily Reading article/settings/run persistence remains browser-local by design.

## Local verification

Run the focused checks first:

```bash
npm run source:check
npm run route:check
npm run ui:check
npm run api:check
npm run typecheck

npm run test:run -- \
  src/features/hanzihome/reader/daily-reading/daily-reading.scheduler.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading.schemas.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-lock.client.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-source-policy.server.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-source-parsers.server.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-storage.client.test.ts \
  src/features/hanzihome/reader/daily-reading/daily-reading-generation.server.test.ts \
  src/app/api/hanzihome/reader/daily-reading/source/route.test.ts \
  src/app/api/hanzihome/reader/daily-reading/generate/route.test.ts \
  src/i18n/messages.test.ts

npm run lint
npm run format:check
```

Before merge/release run:

```bash
npm run check
```

## Manual acceptance

Verify at minimum:

- automatic switch off prevents a due scheduled run;
- source test finds a real source but creates/saves no reading;
- manual generation displays stage progress and produces a locally persisted reading;
- a failure after the reading core is valid offers a resume path that starts at learning enrichment;
- generated article survives refresh and URL back/forward navigation;
- source tab exposes the original source URL and the learning-edition notice;
- generated title/paragraph/vocabulary pinyin is present and marked auto-generated;
- two tabs cannot generate concurrently;
- offline/interrupted runs become retryable while hard failures back off;
- clearing the library requires confirmation and keeps run history;
- desktop 1440×900, iPad portrait ~820×1180, mobile ~390×844 and dark mode have no overflow or overlay issues.

No automated or viewport gate is claimed as passing until it is executed in a real dependency/browser environment.
