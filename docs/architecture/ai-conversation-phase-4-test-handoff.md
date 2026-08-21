# AI Conversation Phase 4 — Test Handoff

Status: source implementation complete; user-run database integration pending
Branch: `feat/persistent-social-memory-ai-redesign`
Live database changes performed by implementation agent: none
Next phase blocked until this checkpoint is accepted

## Implemented continuity flow

```text
assistant message persisted
  -> DB trigger creates exactly one durable post-turn job

next persisted turn
  -> claim at most one due prior job
  -> load prior learner/assistant evidence
  -> effective memory policy
  -> conservative memory extraction
  -> transactional ADD / REINFORCE / SUPERSEDE / RESOLVE / FORGET
  -> evidence rows
  -> opportunistic missing-embedding enrichment
  -> saturating relationship update
  -> summary compaction/rebase when pressure threshold is met
  -> durable succeeded/retry/dead state
  -> reload relationship/summary context when a job changed them
  -> explicit current-turn forget handling
  -> hybrid long-term-memory retrieval
  -> PRODUCT -> CHARACTER -> RELATIONSHIP -> MEMORY -> SUMMARY -> RECENT
  -> provider reply
```

The processor is intentionally opportunistic in Phase 4. The durable row is created in the same database transaction as a new assistant message, so correctness does not depend on a detached server Promise. A final pending job may wait until the next persisted turn.

## Database source changes

Apply this forward migration only after the canonical baseline is present in
the target's migration history:

```text
20260821110000_apply_pending_ai_memory_runtime.sql
```

The canonical baseline includes the original persistence and retrieval schema.
The forward migration:

- creates one post-turn job for each future assistant-message insert without
  backfilling historical assistant messages;
- provides the synchronous explicit-forget deletion RPC, limited to
  global/current-character active memories;
- renames the internal lifecycle implementation and restores the public
  server-only RPC name through a scope-checking wrapper. A model-proposed
  target id from another character is rejected before lifecycle mutation.

## Runtime changes

### Retrieval

Semantic retrieval:

```text
gemini-embedding-001
RETRIEVAL_DOCUMENT / RETRIEVAL_QUERY
768 dimensions
exact cosine search
```

`GEMINI_API_KEY` is optional for Phase 4 continuity. Without it, embeddings remain absent and deterministic lexical retrieval still works. The embedding runtime is deliberately stable/system-owned rather than coupled to a user BYOK conversation key.

Lexical fallback uses:

- Unicode-normalized Vietnamese/Latin tokens;
- Chinese bi-grams and tri-grams;
- exact normalized phrase containment;
- memory-key text;
- importance/recency only as deterministic tie-breaks.

Semantic + lexical candidates are merged with Reciprocal Rank Fusion and capped before prompt injection.

### Memory extraction

The extractor receives only bounded current-turn evidence plus a bounded relevant-memory digest. Long input is clipped at both head and tail so the structured request cannot silently exceed the existing conversation-message contract.

The learner message is authoritative for learner facts. Assistant text is interpretation context only. Credentials/secrets/private app internals are prohibited memory content.

### Explicit forget

Forget wording is detected before normal retrieval. Retrieval is suppressed for that turn even when target resolution fails. When a stored target is confidently resolved, the row is deleted synchronously before the provider prompt is built.

### No-memory

Effective policy:

```text
conversation disabled -> off
conversation enabled  -> on
conversation inherit  -> ai_conversation_preferences.memory_enabled
```

When off, long-term memory read/write and relationship evolution are skipped. Thread summary remains because it is thread-local continuity, not cross-thread long-term memory.

There is intentionally no new no-memory UI in Phase 4. The final workspace control belongs to Phase 5.

### Summary

The summary path:

- keeps 12 recent raw messages outside the summary;
- requires message-count or character-volume pressure before compaction;
- chunks provider input below the current 6000-character conversation-message boundary;
- uses `summary_until_seq` and expected `summary_version` for safe checkpoint mutation;
- every fifth summary version rebuilds from persisted raw transcript rather than feeding the old persisted summary into the rebase.

## Local repository verification

Run:

```bash
npm run source:check
npm run typecheck

npm run test:run -- \
  src/app/api/ai/conversation/route.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-context.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-embedding.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-memory.schemas.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-memory.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-memory-persistence.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-post-turn.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-structured.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-summary.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-turn.server.test.ts \
  src/services/ai.service.test.ts

npm run lint
npm run format:check
```

Before merge/release:

```bash
npm run check
```

The implementation agent could not execute the repository dependency tree in its environment, so these commands remain user-run verification and must not be reported as passing until actually executed.

## Hosted Supabase migration procedure for the current repository state

The repository/remote migration histories were already observed to be divergent. Do not use `db push --include-all` for this checkpoint.

After the production schema has been backed up and preflighted, repair the
linked migration history from a baseline-only worktree, then restore the
forward migration and apply it from the normal checkout:

```bash
# baseline-only worktree: contains 20260820163000 only
npx supabase migration repair --status applied --linked --yes

# normal checkout: contains the baseline plus 20260821110000
npx supabase migration up --linked
npx supabase migration list --linked
```

The repair step updates only migration-history records; it does not execute the
baseline against populated production data. The subsequent `migration up`
executes only `20260821110000_apply_pending_ai_memory_runtime.sql`.

## Small manual integration test

Do not create dozens of test turns. A small sequence is enough for the primary memory path.

### 1. Create one durable fact

Send:

```text
我现在每周打三次羽毛球，这个习惯我坚持很久了。
```

Wait for the assistant reply. That assistant insert should create one pending post-turn job.

### 2. Send one ordinary next turn

Send something unrelated, for example:

```text
对了，今天上海天气怎么样先不聊，我们换个日常话题吧。
```

Before generating this second reply, the server should claim/process the prior job.

Inspect only if needed:

```sql
select id, kind, memory_key, content, status, reinforcement_count, embedding_model
from public.ai_memories
order by created_at desc
limit 10;

select status, attempt_count, memory_applied_at, relationship_applied_at, summary_applied_at, last_error
from public.ai_post_turn_jobs
order by created_at desc
limit 10;
```

Expected: the first assistant job becomes `succeeded` unless its structured provider temporarily failed; a durable badminton fact/habit/preference may exist depending on extractor classification. The exact kind is intentionally semantic, but duplicate rows for the same canonical statement are not expected.

### 3. Recall

Ask:

```text
你还记得我平时做什么运动吗？
```

Expected: the reply can naturally recall the badminton information without the browser resending an old transcript/profile.

### 4. Explicit forget

Send:

```text
忘掉我每周打羽毛球这件事，以后别用这个信息。
```

Then ask again in a later turn.

Expected: the forget turn does not inject that memory; when the resolver identifies the stored target, the memory row is deleted and should not be recalled later.

## Optional semantic-embedding check

If `GEMINI_API_KEY` exists on the server, after a later job runs:

```sql
select memory_key, embedding_model, embedding_version, embedding is not null as has_embedding
from public.ai_memories
where status = 'active'
order by updated_at desc
limit 10;
```

Expected embedding metadata for enriched rows:

```text
embedding_model   = gemini-embedding-001
embedding_version = 1
has_embedding     = true
```

If no system Gemini key exists, `has_embedding = false` is valid; lexical continuity must still work.

## Known unverified states at handoff

- the four Phase 4 migrations have not been executed by the implementation agent on PostgreSQL/Supabase;
- generated Supabase types are intentionally unchanged until the schema exists on the chosen target;
- no live provider call or embedding call was executed by the implementation agent;
- no browser/UI viewport claim is made in Phase 4;
- no-memory behavior is backend/test-only until the Phase 5 workspace control exists;
- old assistant messages that predate the enqueue trigger are intentionally not backfilled into post-turn jobs;
- the opportunistic processor may leave the final conversation job pending until a later turn; a non-blocking flush entry point can be added with the Phase 5 workspace if latency measurements justify it.

## Stop gate

If repository checks and the small integration flow are green, Phase 4 is accepted. Only then proceed to Phase 5 conversation-workspace redesign.
