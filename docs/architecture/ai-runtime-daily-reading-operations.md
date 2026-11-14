# AI Runtime + Daily Reading — Current State and Operations

## Product contract

Daily Reading persists an immutable Chinese source article first. Translation, vocabulary,
grammar and questions are optional AI enrichments. A missing, disabled or unavailable AI
runtime never makes the source article unreadable.

Every enrichment module resolves an `AiTaskId` to one user-owned API key and model before the
workflow starts. The resulting runtime receipt is snapshotted on the job. Assigned tasks do not
fall back to another key or provider.

## Durable enrichment jobs

`POST /api/hanzihome/reader/daily-reading/enrichment-jobs` creates one run and up to four module
jobs. The browser may leave the page after the API returns. Vercel Workflow continues the jobs in
translation, vocabulary, grammar and questions order, while a failed module does not block later
modules.

The browser ledger tracks the server `runId` and reconciles pending jobs on mount, focus,
visibility changes and a 30-second interval. Terminal validated results are applied only when the
article ID and fingerprint still match.

The job table contains runtime metadata and validated module results, but never API keys, source
article text, prompts, partial provider output or raw provider errors. Terminal rows expire after
90 days.

## Progressive translation

Translation metadata is generated separately from paragraph batches. Batches contain at most
three paragraphs and 1,500 source characters. Oversized paragraphs are split at sentence
boundaries and emitted only after every segment for that source paragraph is complete.

The workflow writes validated paragraph events to the named `translation-progress` stream. The
authenticated stream route verifies ownership before proxying the matching Workflow run. A
client disconnect closes only the proxy request; it does not cancel the Workflow. Reconnection
uses `startIndex`, deduplicates paragraph IDs and reconciles the terminal GET response when the
stream closes. Partial paragraphs remain transient browser state and are never written into the
article or localStorage.

The Reader shows translation inline through the existing meaning toggle. There is no separate
translation tab and no raw token or JSON streaming.

## Reuse contract

Each module job has a SHA-256 request signature containing:

- article fingerprint;
- module and target count;
- enrichment contract version and task ID;
- snapshotted key ID, provider and model.

With `regenerate: false`, a same-user, unexpired successful result with the exact signature is
cloned into the new run without a provider call. `regenerate: true` always queues new Workflow
work. A run may contain reused and queued modules together.

The browser ledger version is `2.2.0`. It stores queued time, provider start time and whether the
result was reused. Migration from `2.1.0` preserves existing runs and uses their prior attempt time
as the best available historical start time.

## Metrics and activity

Daily Reading records total provider-request latency for each module. Backoff and queue time are
not provider latency. Gemini usage comes from `usageMetadata`; OpenAI-compatible providers use
the `usage` envelope. Metrics already consumed before a later validation failure remain attached
to the failure activity.

The activity summary groups attempts by task, provider and model. Success rate is
`success / (success + failure + cancelled)`. Blocked events and `ai-runtime-check` probes are
excluded.

## Runtime operations

The AI task settings screen can probe the currently resolved runtime without fallback. Generative
tasks use a minimal structured generation request; semantic memory uses an embedding request.
Probe activity is retained for diagnostics but excluded from product success-rate aggregates.

Before applying `20260828090000_optimize_ai_runtime_after_audits.sql` outside local development:

1. confirm the Supabase project and migration drift;
2. confirm `pg_cron` and existing job-retention schedules;
3. apply the migration before deploying the application;
4. verify the new columns, indexes, function grants and service-role-only RPC;
5. deploy a preview and run an authenticated translation while leaving the page mid-job;
6. verify live Gemini and DeepSeek receipts, progress replay, terminal reconciliation and activity
   metrics;
7. promote to production only after the preview evidence is accepted.

Application rollback does not require dropping the additive columns or functions. Production
migrations and deployment require explicit confirmation.
