# AI Conversation Phase 4 — Long-term Memory, Relationship, Retrieval and Summary

Status: active implementation checkpoint
Branch: `feat/persistent-social-memory-ai-redesign`
Live Supabase mutation by implementation agent: none
Deployment model: migration source may be added, but the implementation agent does not apply it to any hosted database

## Goal

Add real persistent continuity without turning the conversation request into an unbounded transcript replay.

The target context order for a persisted turn is:

```text
0. PRODUCT POLICY
1. CHARACTER IDENTITY
2. RELATIONSHIP STATE
3. RELEVANT LONG-TERM MEMORY
4. THREAD SUMMARY
5. RECENT RAW MESSAGES
             ↓
            LLM
```

Long-term memory is user data, never instruction authority.

## Phase boundary

This phase owns:

- durable post-turn jobs;
- memory extraction;
- memory lifecycle application;
- explicit forget handling;
- exact vector retrieval when a stable embedding runtime is available;
- deterministic lexical retrieval fallback;
- rank fusion;
- relationship familiarity evolution;
- thread summary compaction;
- periodic summary rebase;
- no-memory read/write bypass.

This phase does not own:

- the final conversation workspace redesign;
- conversation history/new-thread/archive/delete UI;
- the final Settings IA or Memory Manager UI;
- character editing UI;
- production deployment;
- HNSW/IVFFlat ANN indexes;
- PGroonga installation;
- fabricated usage telemetry.

## 1. Retrieval decision

### 1.1 Semantic baseline

Use pgvector exact cosine search, without ANN indexes.

Embedding model contract:

```text
model       = gemini-embedding-001
dimension   = 768
document    = RETRIEVAL_DOCUMENT
query       = RETRIEVAL_QUERY
version     = 1
```

Rationale:

- the current Google embedding API supports explicit retrieval task types;
- 768 is an officially recommended reduced dimension for Gemini embeddings;
- pgvector exact search is sufficient for the expected personal-memory row count;
- adding HNSW before measuring memory volume and latency would add tuning/recall complexity without evidence.

The embedding runtime uses server `GEMINI_API_KEY` only. User BYOK conversation keys are not silently repurposed as the durable embedding identity because changing or deleting a conversation key must not invalidate stored memory vectors.

If `GEMINI_API_KEY` is unavailable or embedding generation fails, memory still works through deterministic lexical retrieval. Missing embeddings are retryable enrichment, not a reason to lose the memory itself.

### 1.2 Lexical fallback

Do not assume PostgreSQL native FTS tokenizes Chinese well enough.

Phase 4 uses an application-side deterministic candidate rank over a bounded active-memory set:

- normalized Latin/Vietnamese tokens;
- CJK bi-grams and tri-grams;
- exact normalized substring matches;
- memory-key token overlap;
- stable importance/recency tie-breaks.

PGroonga remains deferred until measured Chinese/Vietnamese retrieval evaluation proves it is needed.

### 1.3 Fusion

Candidate sets are merged with Reciprocal Rank Fusion (RRF), not raw unnormalized weighted sums or multiplicative scoring.

```text
semantic rank list
lexical rank list
importance/recency only as deterministic tie-breaks
            ↓
           RRF
            ↓
      bounded top memories
```

Character-scoped and global memories are both eligible only when the current memory policy allows long-term memory.

## 2. Memory lifecycle

The extractor may propose only:

```text
IGNORE
ADD
REINFORCE
SUPERSEDE
RESOLVE
FORGET
```

Lifecycle application is server/DB authoritative. The LLM proposes changes; it does not decide ownership, transaction boundaries, or row identity.

### `ADD`

Create a new active memory. Canonical facts/preferences/habits/goals/open loops should have a stable `memory_key`. Episodes and inside jokes may have a nullable key.

If an `ADD` collides with an already-active canonical key, the database function converts the operation deterministically to reinforce or supersede rather than violating uniqueness.

### `REINFORCE`

Increase reinforcement count and evidence for an existing active memory. Do not create a duplicate fact row.

### `SUPERSEDE`

Atomically mark the old memory `superseded`, insert the replacement, link `superseded_by_id`, and record evidence for both sides.

### `RESOLVE`

Only active `open_loop` memories may become `resolved`.

### `FORGET`

Delete the matching long-term memory row. Do not preserve forgotten content under a hidden `forgotten` status.

### `IGNORE`

No persistence side effect.

## 3. Provenance

Every created, reinforced, superseded or resolved memory links to the user message that supports the change through `ai_memory_evidence`.

The extractor primarily learns from learner/user statements. Assistant claims are context for interpretation only and must not become authoritative user facts by themselves.

## 4. Explicit forget privacy path

An explicit forget phrase has higher authority than normal retrieval.

Before building the next prompt:

```text
current user message
  -> detect explicit forget intent
  -> temporarily suppress long-term memory retrieval for this turn
  -> resolve/delete matching active memory synchronously when possible
  -> continue conversation without injecting the forgotten memory
```

If the forget resolver cannot confidently map the request to a stored row, retrieval still stays suppressed for that turn. The normal post-turn extractor receives the same explicit instruction and must not re-add the just-rejected information.

## 5. No-memory semantics

Effective long-term memory is derived from:

```text
ai_conversation_preferences.memory_enabled
+
ai_conversations.memory_policy
```

Resolution:

```text
conversation disabled -> false
conversation enabled  -> true
conversation inherit  -> user preference
```

When false:

- do not retrieve long-term memories;
- do not extract/write/reinforce/resolve memories;
- do not evolve relationship familiarity;
- thread summary may still update because it is thread-local continuity, not long-term cross-thread memory.

This is a no-memory contract, not a no-history/temporary-chat contract.

## 6. Durable post-turn pipeline

The response path must not start an untracked detached Promise.

After persisting the assistant reply:

```text
persist assistant
  -> insert one ai_post_turn_jobs row keyed by assistant_message_id
  -> return response
```

Before a later persisted turn reconstructs context, the server opportunistically claims a small bounded number of due jobs using a server-only `FOR UPDATE SKIP LOCKED` RPC.

```text
claim due job
  -> load assistant + replied-to user message
  -> load active memory digest
  -> extract lifecycle changes when memory is enabled
  -> apply lifecycle changes transactionally
  -> evolve relationship when memory is enabled
  -> compact/rebase thread summary when threshold is met
  -> mark job succeeded
```

Failures are recorded as retry/dead state with bounded exponential backoff. The job survives browser refresh/tab close because the durable row was inserted before the response returned.

Current Phase 4 processing contract is opportunistic rather than cron-based. A pending final-turn job may wait until the next persisted turn or a later explicit processor entry point. Phase 5/6 may surface a harmless background flush trigger, but durability does not depend on it.

## 7. Memory extraction contract

The extractor gets only the minimum evidence needed:

```text
character id/name
conversation mode
replied-to learner message
assistant reply for interpretation
bounded active-memory digest {id, kind, key, content, scope}
```

It returns strict JSON with a bounded candidate count.

Each candidate includes:

```text
action
kind
targetMemoryId?
memoryKey?
content?
importance
confidence
scope = global | character
```

Rules:

- store durable facts/preferences/habits/goals/events/open loops/inside jokes only;
- ignore transient wording and ordinary one-off small talk;
- do not infer sensitive personal attributes that the user did not state;
- do not store credentials, secrets, access tokens or private app internals;
- prefer `IGNORE` when confidence is low;
- explicit forget wins;
- candidate count remains small to prevent memory spam.

## 8. Relationship evolution

Relationship state remains compact and deterministic.

Phase 4 does not ask the LLM to output a raw familiarity score. The server increments familiarity from persisted interaction evidence with a small saturating update and records a new revision.

Inputs may include:

- a completed learner/assistant turn;
- whether the turn produced novel/reinforced durable memory;
- current familiarity.

The score remains in `[0, 1]`; UI continues to derive semantic bands and never exposes a pseudo-scientific raw number by default.

No-memory turns do not mutate relationship state.

## 9. Summary compaction

Thread summary is independent of long-term memory.

Compaction keeps a recent raw tail and summarizes only the older unsummarized span.

Trigger is based on context pressure, using both:

- unsummarized message count;
- unsummarized character volume.

A normal rolling compaction consumes:

```text
existing summary
+
messages after summary_until_seq up to the new summary boundary
```

and updates atomically:

```text
summary
summary_until_seq
summary_version + 1
```

Every fixed number of summary versions, rebase from persisted raw messages in bounded chunks to reduce recursive-summary drift. Raw transcript remains authoritative.

Summary content is context data and is always delimited as non-instruction data in the provider prompt.

## 10. Database migration B

One additive migration may contain:

- `vector` extension in the `extensions` schema;
- nullable `embedding extensions.vector(768)` on `ai_memories`;
- nullable embedding model/version metadata with consistency checks;
- exact-memory match RPC;
- transactional memory lifecycle RPC;
- atomic post-turn job claim RPC;
- explicit service-role-only grants/revokes.

No ANN index is added.

Existing rows remain valid with `embedding IS NULL`; the migration does not backfill or rewrite existing memory content.

Rollback policy before deployment: revert the migration file while unapplied. Once applied, use a forward-fix migration rather than editing applied history.

## 11. Acceptance criteria

### Memory

- a durable learner fact can be recalled in a later conversation turn;
- a changed canonical fact supersedes the old active fact;
- repeated same fact reinforces instead of duplicating;
- an open loop can become resolved;
- explicit forget removes the stored row and does not inject it into that turn;
- no-memory mode neither reads nor writes long-term memory.

### Retrieval

- semantic retrieval uses exact cosine search when embedding runtime is available;
- lexical fallback still retrieves obvious Chinese/Vietnamese references without embeddings;
- irrelevant memories are not routinely injected;
- global and current-character memory are eligible; another character's scoped memory is not.

### Relationship

- normal remembered interaction can increase familiarity gradually;
- score never exceeds `[0, 1]`;
- no-memory turn leaves relationship unchanged.

### Summary

- long conversations compact old raw span while retaining recent raw messages;
- `summary_until_seq <= last_message_seq` remains true;
- periodic rebase uses persisted raw transcript rather than recursively summarizing summaries forever.

### Durability

- one assistant message creates at most one post-turn job;
- concurrent processors cannot claim the same job;
- failed processing retries without duplicating lifecycle side effects;
- no detached server Promise is required for correctness.

## 12. Verification target

Targeted tests:

```bash
npm run source:check
npm run typecheck
npm run test:run -- \
  src/app/api/ai/conversation/route.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-context.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-memory.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-post-turn.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-turn.server.test.ts \
  src/services/ai.service.test.ts
npm run lint
npm run format:check
```

Full path before merge/release:

```bash
npm run check
```

Database integration remains user-run until a safe target is explicitly authorized.

## Stop gate

After one complete Phase 4 continuity flow is implemented, report exact migration/runtime files, tests added, manual migration/test steps, and known unverified states. Do not continue into Phase 5 UI redesign without user review.
