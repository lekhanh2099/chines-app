# AI Conversation Phase 2 — Persisted Turn Test Handoff

Status: ready for user-run integration test; database migration is not applied by the implementation agent.
Branch: `feat/persistent-social-memory-ai-redesign`
Migration prerequisite: `supabase/migrations/20260818095100_create_ai_conversation_persistence.sql`

## Scope completed in this checkpoint

This checkpoint implements one coherent flow only:

```text
open AI Conversation
  -> load latest persisted session from backend
  -> lazily create default character + first conversation when needed
  -> send one new user turn command
  -> server persists user message with clientMessageId idempotency
  -> server reloads recent transcript from authoritative persistence
  -> provider generates reply
  -> server persists assistant reply linked to the user message
  -> client renders the persisted turn
  -> reload restores persisted transcript
```

The client no longer owns the authoritative transcript for the new workspace flow.

## Deliberate non-goals

This checkpoint does not implement:

- long-term memory extraction/retrieval;
- relationship-state evolution;
- summary compaction;
- vector/PGroonga retrieval;
- character/mode architecture cutover from the legacy local profile;
- multi-conversation history/archive/delete UI;
- conversation/settings visual redesign;
- generated Supabase type refresh before a real schema target exists.

The legacy full-transcript request contract remains temporarily available on `/api/ai/conversation` for compatibility, but the AI Conversation workspace uses the persisted action contract.

## API action contract

The already-registered internal route remains:

```text
POST /api/ai/conversation
```

New internal actions:

```json
{ "action": "session" }
```

```json
{ "action": "ensure-session" }
```

```json
{
  "action": "message",
  "conversationId": "uuid",
  "clientMessageId": "uuid",
  "content": "你好",
  "profile": { "...": "temporary compatibility profile" },
  "apiKeyId": "optional uuid"
}
```

The message action intentionally contains only the new turn plus temporary compatibility profile data. It does not accept a client-owned transcript.

## Retry contract

`clientMessageId` is stable across a failed UI retry as long as the failed draft is retried unchanged.

Server behavior:

- repeated user message ID + same normalized content returns the existing user row;
- repeated user message ID + different content is rejected by the persistence RPC;
- if an assistant reply already exists for that user row, the server returns the persisted reply without another provider call;
- runtime provider/model/key metadata is persisted with the assistant row so an idempotent retry can return consistent runtime metadata.

The UI refetches the authoritative session after an error because the user row may already have been committed even when provider generation failed.

## Strict-BFF boundary

AI persistence is server-only:

```text
browser
  -> authenticated Next route
  -> server-derived auth user id
  -> server secret / service-role PostgREST path
  -> AI persistence tables + server-only append RPC
```

The browser does not query the new AI tables directly.

Both Supabase server credential formats are supported:

- current `sb_secret_...` key: `apikey` header only;
- legacy service-role JWT: `apikey` plus Bearer authorization.

## Database behavior before migration

If the migration is not applied, persisted session/message actions intentionally return:

```text
HTTP 503
code = AI_PERSISTENCE_NOT_READY
```

The workspace should show the returned error rather than silently falling back to browser-owned history.

## Manual integration test

Use a database target you explicitly choose. The implementation agent has not applied any DDL to the live Supabase project.

After the migration exists on that test target:

1. Sign in and open AI Conversation.
2. Send `你好，我叫测试用户。`.
3. Confirm one user bubble and one assistant bubble appear.
4. Reload the page. Both persisted messages must still appear.
5. Send a second turn. Reload again. Sequence/order must remain stable.
6. In Network tools, inspect the new message request. It must contain `action`, `conversationId`, `clientMessageId`, `content`, `profile`, and optional `apiKeyId`; it must not contain a `messages` transcript array.
7. Replay the exact same message request with the same `clientMessageId`. No duplicate user row or assistant row may be created.
8. Simulate a provider failure, then retry the unchanged restored draft. The same logical user turn must be reused rather than inserted twice.
9. Confirm another authenticated user cannot reuse the first user's `conversationId` to append a message.
10. Confirm local legacy `memoryNotes` are not copied into `ai_memories` or another new persistence table by this phase.

Expected core rows after the first successful turn:

```text
ai_characters:      1 default user-owned character if none existed
ai_conversations:   1 active conversation if none existed
ai_messages:        2 rows, seq 1 user + seq 2 assistant
```

`ai_memories`, `ai_memory_evidence`, `ai_relationship_states`, and `ai_post_turn_jobs` are not expected to change in this phase.

## Repository checks added for this flow

Tests were added/extended to cover:

- persisted session action routing;
- server-owned turn persistence orchestration;
- existing assistant reply short-circuit on retry;
- client transport not sending a transcript array;
- Postgres timestamptz offset parsing;
- required `clientMessageId` and non-empty message content;
- legacy AI conversation behavior remaining available during cutover.

These tests are committed but have not been executed by the implementation agent because the current tool environment cannot run the repository dependency tree. Do not report them as passing until they are actually run.

Suggested local verification before integration testing:

```bash
npm run source:check
npm run typecheck
npm run test:run -- src/app/api/ai/conversation/route.test.ts src/features/hanzihome/ai-conversation/ai-conversation-api.test.ts src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.test.ts
npm run lint
```

After applying the migration to the chosen target, regenerate authoritative database types rather than editing them manually:

```bash
SUPABASE_PROJECT_REF=<chosen-test-project-ref> npm run types:supabase
```

Do not commit a generated type file from a different schema target.

## Known boundary for the next checkpoint

The persisted flow still serializes the legacy local profile as compatibility context for provider generation. The database conversation fields and stable character identity do not yet own provider behavior. That ownership transfer belongs to Phase 3 and should only begin after this persistence flow is accepted.
