# User AI Runtime — strict BYOK contract

Status: durable architecture contract

This document is the authority for user-facing AI runtime selection across HanziHome. Feature-specific documents may add narrower rules but must not weaken this contract.

## Credential ownership

Provider credentials belong to the signed-in user and are stored through the existing `user_api_keys` backend service.

```text
browser paste (transient)
-> authenticated API-key route
-> server encryption
-> user_api_keys encrypted_key
-> server decrypt for one authenticated request
-> provider request
```

The browser receives masked metadata only. A raw provider key must never be persisted in localStorage, IndexedDB, URL/search params, client query data, logs, public environment variables or user-visible diagnostics.

`BYOK_ENCRYPTION_SECRET`, Supabase server credentials and similar infrastructure secrets are server infrastructure. They are not provider credentials and may remain in server environment configuration.

User-facing provider keys must not come from `GEMINI_API_KEY`, `DEEPSEEK_API_KEY` or another application-wide provider environment fallback.

## Runtime authority

`src/services/ai-runtime.service.ts` owns provider selection.

A server feature requests a capability rather than selecting a provider directly:

```text
conversation
daily-reading-translation
daily-reading-learning
lookup
structured-memory
semantic-memory
```

The resolver selects from active encrypted credentials in user priority order, verifies capability compatibility and returns the decrypted credential only to server code. Browser readiness is projected to safe metadata through `GET /api/ai/runtime`.

Readiness is intentionally distinct:

```text
ready
missing-key
storage-unavailable
```

Operational provider failures are also distinct:

```text
invalid-key
quota-exhausted
provider-unavailable
network-error
invalid-response
cancelled
```

A missing key is a recoverable product state, not a reason to silently switch to a platform provider key.

## Compatibility adapters

Some older structured-analysis functions still accept a `UserApiKeyCredential` record. `src/services/ai-analysis-runtime.service.ts` is the temporary compatibility bridge for those callers:

1. resolve the requested capability through `ai-runtime.service`;
2. recover only the exact selected credential record;
3. pass that one record to the legacy adapter.

The bridge does not own selection and must not introduce a second fallback order. New server features should consume `ResolvedUserAiRuntime` directly when practical.

## Daily Reading

Daily Reading is article acquisition first and AI enrichment second.

```text
discover
-> extract
-> validate/rerank
-> normalize/fingerprint
-> persist immutable Chinese article
-> article-ready
-> optional user-BYOK enrichment
```

A captured article is readable and counts as the day's successful capture before any AI request starts. Translation, vocabulary, grammar and questions are independent modules with independent retry/status state. Failure or missing credentials in one enrichment module must not delete, hide or invalidate the source article.

The captured Chinese article is immutable source evidence. AI may add Vietnamese translation and learning support but must not replace the source Chinese text.

Daily Reading stores no pinyin. Pronunciation is derived at render/runtime from the existing contextual-pronunciation system. Legacy adapted readings may still contain their historical pinyin fields and are marked with legacy provenance during migration.

Daily Reading remains browser-local for article/settings/run persistence in this architecture. There is no Daily Reading database migration and no server cron. The authenticated app scheduler performs visible-session catch-up using the configured local capture time.

The unused legacy `/api/hanzihome/reader/daily-reading/generate` AI path has been removed. V1 browser data remains supported only as a read-only migration input for the current article-first flow.

## Conversation transport

Persisted conversation uses HTTP streaming, not WebSocket.

```text
persist idempotent user message
-> resolve personal `conversation` runtime
-> provider SSE stream on server
-> suppress reasoning / split <think> tags
-> normalized NDJSON delta events to browser
-> full final sanitizer
-> persist assistant reply
-> final event
```

`clientMessageId` remains the idempotency key for a user turn. A retry with the same ID must not create another user message. If a persisted assistant reply already exists for that user turn, the server replays it without another provider call.

Stop/cancel aborts the provider request. A partial assistant response may be shown as transient presentation state while streaming, but it is not persisted. Assistant persistence occurs only after provider completion and final sanitization.

Conversation history, settings and memory controls remain readable without an AI key. Only generation is gated.

## Conversation memory

Structured memory extraction and summary tasks use the shared `structured-memory` personal runtime.

Semantic memory is optional acceleration, not a chat dependency. `semantic-memory` currently requires a compatible personal Gemini credential for the embedding endpoint. If no compatible user runtime exists, or embedding retrieval is unavailable, memory retrieval continues with lexical ranking. Chat must not fail merely because semantic embeddings are unavailable.

Post-turn embedding enrichment is opportunistic. Failure is logged/deferred rather than converting a completed conversation turn into a failed turn.

## Lookup, editor and vocabulary AI

Dictionary, lesson vocabulary, legacy cached analyses and other non-AI/cache paths remain available without a provider credential when they already contain usable data.

When new AI generation is required, lookup/basic/deep lookup, vocabulary generation and editor context must resolve the shared `lookup` capability first. They must not call a platform provider environment key when user runtime resolution fails.

## Client behavior

The reusable Add API Key interaction is the recovery surface for `missing-key` states. It accepts plaintext only transiently, verifies/discovers models through authenticated backend actions, then saves encrypted backend state and invalidates safe readiness metadata.

UI copy must describe Auto as personal-key priority selection. It must not promise or imply a hidden system-provider fallback.

## Legacy and cleanup boundaries

Compatibility code may remain while old consumers/data still require it, but it must be fail-closed with respect to provider credentials. A compatibility route or adapter is not permission to revive an application-wide provider key.

Before deleting a compatibility owner, prove its consumers through repository search/reachability and preserve any required migration/read path.

## Verification contract

At release verification, prove at minimum:

```text
no raw provider key in browser responses/storage
no user-facing provider env fallback
cached/non-AI lookup still works without a key
Daily Reading source capture works without a key
Daily Reading persisted JSON contains no pinyin
conversation history works without a key
conversation generation streams with personal BYOK
Stop does not persist a partial assistant
same clientMessageId does not duplicate a user turn
semantic-memory absence falls back to lexical retrieval
```

Run focused tests first, then the repository's complete `npm run check` gate. Source inspection alone is not evidence that executable or viewport verification passed.
