# AI Conversation Persistence & Memory Data Contract

Status: Phase 1 design checkpoint — no schema applied
Branch: `feat/persistent-social-memory-ai-redesign`
Parent plan: `docs/architecture/ai-conversation-persistent-memory-plan.md`

This document fixes the data ownership, integrity, security and migration shape before any SQL migration is added. It is intentionally narrower than the full product plan.

## 1. Scope of this checkpoint

This checkpoint designs:

- stable character ownership;
- conversation preferences;
- persisted conversation/message ownership;
- relationship state;
- long-term memory lifecycle and provenance;
- durable post-turn job state;
- sequence/idempotency invariants;
- strict-BFF access boundaries;
- the split between core persistence and later retrieval extensions.

This checkpoint does **not**:

- add a migration file;
- enable `vector`, PGroonga or another extension;
- change generated Supabase types;
- change routes/services/UI;
- write to any Supabase environment;
- choose an embedding provider/model/dimension;
- choose the final Chinese lexical retrieval implementation.

Those mutations remain behind the repository's DB/RLS confirmation gate.

## 2. Repository precedents verified

The current repository establishes these relevant patterns:

- user-owned records reference `auth.users(id) on delete cascade`;
- RLS uses server-authenticated identity, normally `(select auth.uid())`;
- parent/child ownership is validated rather than trusting request IDs;
- migrations are timestamped, transactional where coherent, and refresh generated types afterward;
- server-only code already has a precedent for constructing a Supabase client from `SUPABASE_SECRET_KEY` / legacy `SUPABASE_SERVICE_ROLE_KEY` after separately authenticating the user;
- the current authenticated route helper returns a cookie/bearer-scoped Supabase client, so direct authenticated-table grants would also make those tables addressable through the public Supabase API.

For this feature we deliberately choose a stricter boundary than existing ordinary user-state tables: AI transcript/memory persistence is backend-owned and is not a browser Supabase data API.

## 3. Security boundary — strict BFF

### 3.1 Browser contract

The browser talks only to application routes such as:

```text
/api/ai/conversations
/api/ai/conversations/:id
/api/ai/conversations/:id/messages
/api/ai/memories
/api/ai/characters
```

The browser must not directly select/insert/update/delete the AI persistence tables through the public Supabase client.

### 3.2 Server contract

A route must:

1. authenticate the request with the existing session/bearer boundary;
2. derive `user.id` on the server;
3. validate the request with Zod;
4. use a server-secret Supabase data client for the AI persistence repository;
5. include the authenticated `user.id` in every repository read/write predicate or RPC argument;
6. verify parent-child ownership before mutations;
7. never accept a client-supplied `user_id` as authority.

Using the server-secret client means RLS is not the runtime authorization owner. Application authorization remains explicit in the BFF/repository. RLS is still enabled as defense-in-depth for non-bypass roles.

### 3.3 Grants and RLS

For user-facing AI tables:

```text
RLS: enabled
anon: no table grants
authenticated: no table grants
service_role: server persistence path
```

Own-row RLS policies may still exist for defense-in-depth, but no authenticated grants are added in V1. Accidentally adding a browser query therefore does not create a new data path.

For `ai_post_turn_jobs`:

```text
RLS: enabled
anon/authenticated: no grants
no user-facing RLS policy
service_role only
```

Any mutation RPC used for message sequencing is revoked from `public`, `anon` and `authenticated` and executable only by the server persistence role.

## 4. Character/template policy

V1 has **user-owned characters only**.

There is no shared/system-template ownership model in this schema. The product may create a default character such as `小林` lazily for a user, but the resulting row is still owned by that user and may later be edited.

This avoids nullable ownership and mixed seed/user rules in the first persistence model.

A future shared-character catalog requires a separate explicit contract rather than weakening `user_id not null`.

## 5. Core tables

The proposed core persistence migration contains eight tables:

```text
ai_characters
ai_conversation_preferences
ai_conversations
ai_messages
ai_relationship_states
ai_memories
ai_memory_evidence
ai_post_turn_jobs
```

`ai_memory_evidence` is intentionally added beyond the original conceptual plan. A single `source_message_id` cannot correctly represent a memory that was created in one conversation and reinforced in another, and it cannot safely implement "delete this conversation + forget memories learned only here". Provenance is many-to-many.

## 6. `ai_characters`

Authoritative owner: stable character identity.

Proposed columns:

```text
id uuid primary key default gen_random_uuid()
user_id uuid not null -> auth.users(id) on delete cascade
display_name text not null
city text not null default ''
age integer null
background text not null default ''
personality text not null default ''
speaking_style text not null default ''
interests text[] not null default '{}'
identity_notes text not null default ''
archived_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Constraints:

```text
trim(display_name) is non-empty
age is null or in a human-safe configured range
unique(id, user_id) for composite child ownership FKs
```

Do not store an opaque `persona_prompt` as the canonical identity. Prompt serialization is derived by the context builder from typed character data plus product policy. `identity_notes` is user-owned descriptive data, not instruction authority.

Indexes:

```text
(user_id, archived_at, updated_at desc)
```

## 7. `ai_conversation_preferences`

Authoritative owner: user defaults for newly created AI conversations.

One row per user.

Proposed columns:

```text
user_id uuid primary key -> auth.users(id) on delete cascade
default_character_id uuid null
default_mode text not null default 'natural'
default_correction_style text not null default 'balanced'
default_reply_mode text not null default 'adaptive'
learner_level text not null default 'intermediate'
memory_enabled boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Checks:

```text
default_mode in ('natural', 'speaking-practice', 'grammar-coach', 'hskk-practice')
default_correction_style in ('light', 'balanced', 'strict')
default_reply_mode in ('adaptive', 'chinese', 'bilingual')
learner_level in ('beginner', 'intermediate', 'advanced')
```

Ownership integrity:

```text
(default_character_id, user_id)
  -> ai_characters(id, user_id)
```

The default record does not override an existing conversation's current mode/settings. Defaults and per-thread current settings have different responsibilities and are not duplicate owners.

## 8. `ai_conversations`

Authoritative owner: one persisted thread and its continuity checkpoint.

Proposed columns:

```text
id uuid primary key default gen_random_uuid()
user_id uuid not null -> auth.users(id) on delete cascade
character_id uuid not null
title text not null default ''
mode text not null
correction_style text not null
reply_mode text not null
memory_policy text not null default 'inherit'
summary text not null default ''
summary_until_seq bigint not null default 0
summary_version integer not null default 1
last_message_seq bigint not null default 0
last_message_at timestamptz null
archived_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Checks:

```text
mode in the same conversation-mode set as preferences
correction_style in ('light', 'balanced', 'strict')
reply_mode in ('adaptive', 'chinese', 'bilingual')
memory_policy in ('inherit', 'enabled', 'disabled')
summary_until_seq >= 0
last_message_seq >= 0
summary_until_seq <= last_message_seq
summary_version > 0
```

Ownership integrity:

```text
unique(id, user_id)
(character_id, user_id)
  -> ai_characters(id, user_id)
```

Indexes:

```text
(user_id, archived_at, updated_at desc)
(user_id, character_id, last_message_at desc)
```

### Temporary/no-memory semantics

The persistence schema deliberately calls this `memory_policy`, not `temporary`, because memory behavior and transcript retention are separate concepts.

V1 can safely implement "không ghi nhớ" with `memory_policy = disabled`:

- no long-term memories are read;
- no long-term memories are written;
- transcript persistence is unchanged.

A true temporary/no-history mode requires an explicit retention/expiry contract and cleanup mechanism. It must not be faked by naming a persisted thread "temporary". That product step remains for the conversation UX phase.

## 9. `ai_messages`

Authoritative owner: persisted raw transcript.

Proposed columns:

```text
id uuid primary key default gen_random_uuid()
user_id uuid not null
conversation_id uuid not null
seq bigint not null
role text not null
content text not null
client_message_id uuid null
reply_to_message_id uuid null
metadata jsonb not null default '{}'
created_at timestamptz not null default now()
```

Role contract in V1:

```text
user:
  client_message_id required
  reply_to_message_id null

assistant:
  client_message_id null
  reply_to_message_id required
```

No system/product-policy/context-builder messages are persisted as transcript rows.

Integrity:

```text
unique(conversation_id, seq)
unique(id, conversation_id, user_id)
(conversation_id, user_id)
  -> ai_conversations(id, user_id)
(reply_to_message_id, conversation_id, user_id)
  -> ai_messages(id, conversation_id, user_id)
```

Partial idempotency indexes:

```text
unique(conversation_id, client_message_id)
where client_message_id is not null

unique(reply_to_message_id)
where role = 'assistant' and reply_to_message_id is not null
```

The first prevents duplicate user turns on retry. The second guarantees at most one persisted assistant reply for a user turn.

Indexes:

```text
(conversation_id, seq desc)
(user_id, conversation_id, seq desc)
```

The first unique index already serves most transcript reads; the user-prefixed index is retained only if query plans show the strict ownership predicate benefits from it. Do not keep redundant indexes without measurement.

## 10. Atomic message sequence allocation

`select max(seq) + 1` in application code is rejected because concurrent requests can allocate the same sequence.

The migration design includes a server-only RPC/function that atomically:

1. locks/updates the owned `ai_conversations` row;
2. increments `last_message_seq`;
3. inserts the message with the resulting `seq`;
4. updates `last_message_at`;
5. returns the inserted row.

For a user message, the function first checks `(conversation_id, client_message_id)`:

- same id + same normalized content -> return the existing row;
- same id + different content -> reject as an idempotency conflict.

For an assistant message it accepts a `reply_to_message_id`, validates that the target belongs to the same user/conversation and has role `user`, then relies on the unique reply index to prevent duplicate replies.

The function is `security invoker` unless implementation evidence proves a definer is required. It receives server-derived `user_id`, validates it against the conversation row, uses a fixed safe `search_path`, and is not executable by browser roles.

## 11. `ai_relationship_states`

Authoritative owner: compact relationship state, not shared history.

Proposed columns:

```text
user_id uuid not null
character_id uuid not null
nickname text not null default ''
familiarity_score numeric(5,4) not null default 0
revision integer not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
primary key(user_id, character_id)
```

Checks:

```text
0 <= familiarity_score <= 1
revision >= 0
```

Ownership integrity:

```text
(character_id, user_id)
  -> ai_characters(id, user_id)
```

`closeness` is never persisted. UI/context derives a semantic band from `familiarity_score`.

Do not add inside jokes, promises, shared history, open loops or plans here. They are memory records.

## 12. `ai_memories`

Authoritative owner: durable long-term continuity data.

Proposed core columns:

```text
id uuid primary key default gen_random_uuid()
user_id uuid not null -> auth.users(id) on delete cascade
character_id uuid null
kind text not null
memory_key text null
content text not null
importance numeric(4,3) not null
confidence numeric(4,3) not null
status text not null default 'active'
reinforcement_count integer not null default 1
last_reinforced_at timestamptz not null default now()
superseded_by_id uuid null
last_recalled_at timestamptz null
valid_until timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Kinds:

```text
fact
preference
habit
goal
episode
open_loop
inside_joke
```

Statuses:

```text
active
superseded
resolved
```

`IGNORE` creates no row.

`FORGET` is a delete operation on the memory record, not a `forgotten` status that keeps the supposedly forgotten content in the long-term-memory table.

Constraints:

```text
0 <= importance <= 1
0 <= confidence <= 1
reinforcement_count > 0
trim(content) non-empty
memory_key is null or trim(memory_key) non-empty
status in ('active', 'superseded', 'resolved')
```

Ownership integrity:

```text
unique(id, user_id)
(character_id, user_id)
  -> ai_characters(id, user_id) when character_id is non-null
(superseded_by_id, user_id)
  -> ai_memories(id, user_id)
```

Scope is derived:

```text
character_id is null     -> available across characters
character_id is not null -> character-specific
```

There is no persisted `scope` column.

### Active keyed-memory uniqueness

A non-null `memory_key` has at most one active value within its scope.

Use two partial unique indexes:

```text
global:
unique(user_id, memory_key)
where character_id is null
  and memory_key is not null
  and status = 'active'

character:
unique(user_id, character_id, memory_key)
where character_id is not null
  and memory_key is not null
  and status = 'active'
```

This makes `SUPERSEDE` an actual database invariant rather than extractor convention.

Candidate retrieval indexes before embeddings:

```text
(user_id, status, updated_at desc)
(user_id, character_id, status, updated_at desc)
(user_id, kind, status)
```

Do not add a recency-only optimization that changes retrieval semantics; indexes only support candidate filtering.

## 13. `ai_memory_evidence`

Authoritative owner: provenance between memories and raw messages.

Proposed columns:

```text
memory_id uuid not null
message_id uuid not null
user_id uuid not null
action text not null
created_at timestamptz not null default now()
primary key(memory_id, message_id, action)
```

Actions:

```text
created
reinforced
superseded
resolved
```

Integrity:

```text
(memory_id, user_id)
  -> ai_memories(id, user_id) on delete cascade
(message_id, user_id)
  -> ai_messages(id, user_id) on delete cascade
```

This supports:

- provenance UI when the source transcript still exists;
- distinguishing one-source from multi-source memories;
- conversation deletion with an optional "also forget memories learned only from this conversation" flow;
- reinforcement without overwriting the original source.

When a transcript is deleted but the user chooses to keep learned memory, evidence may disappear while the memory remains. That is intentional. The UI must then not fabricate a source.

## 14. Memory lifecycle transaction rules

Lifecycle operations are server-owned and transactional where they update more than one row.

### ADD

```text
insert memory(active)
insert evidence(created)
```

### REINFORCE

```text
update active memory:
  confidence/importance according to extractor policy
  reinforcement_count += 1
  last_reinforced_at = now()
insert evidence(reinforced)
```

### SUPERSEDE

Atomically:

```text
insert new active memory
update old memory -> status = superseded, superseded_by_id = new.id
insert evidence for the lifecycle decision
```

The new active row must be inserted/old row transitioned in an order compatible with the partial unique memory-key indexes inside one transaction.

### RESOLVE

```text
update active open_loop -> resolved
insert evidence(resolved)
```

### FORGET

```text
delete memory
```

Evidence cascades. Conversation messages are not deleted unless the user separately deletes the conversation.

## 15. `ai_post_turn_jobs`

Authoritative owner: durable post-response processing state.

Proposed columns:

```text
id uuid primary key default gen_random_uuid()
user_id uuid not null
conversation_id uuid not null
assistant_message_id uuid not null
kind text not null default 'memory-summary'
status text not null default 'pending'
attempt_count integer not null default 0
available_at timestamptz not null default now()
locked_at timestamptz null
completed_at timestamptz null
last_error text null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Checks:

```text
kind in ('memory-summary') for the first implementation
status in ('pending', 'processing', 'retry', 'succeeded', 'dead')
attempt_count >= 0
```

Integrity:

```text
unique(assistant_message_id)
(conversation_id, user_id)
  -> ai_conversations(id, user_id)
(assistant_message_id, conversation_id, user_id)
  -> ai_messages(id, conversation_id, user_id)
```

Queue index:

```text
(status, available_at, created_at)
where status in ('pending', 'retry')
```

No prompt/messages are duplicated into a job payload. The job reconstructs its inputs from the authoritative message/conversation state.

The execution mechanism is not chosen in Phase 1. Vercel request-local fire-and-forget is explicitly not considered durable execution.

## 16. Updated-at ownership

Define an AI-local trigger function, for example:

```text
public.ai_touch_updated_at()
```

rather than coupling the new subsystem to a HanziHome Studio-named trigger function.

The trigger applies only to tables with `updated_at`.

## 17. Core migration vs retrieval migration

To keep persistence independent from embedding vendor/model decisions, split DB work into two additive migrations.

### Migration A — core persistence

Contains:

```text
pgcrypto if required for gen_random_uuid()
8 core tables
constraints / foreign keys
indexes
updated_at triggers
RLS
strict-BFF grants
server-only message append RPC
comments
```

Does **not** install vector/PGroonga.

### Migration B — retrieval capability (Phase 4)

Added only after benchmark/provider decisions:

```text
vector extension
embedding column and metadata
exact similarity query/RPC
chosen Chinese/Vietnamese lexical extension/index
hybrid candidate merge/rerank support if DB-owned
```

Expected memory embedding metadata when the retrieval migration is designed:

```text
embedding
embedding_model
embedding_dimensions
embedding_version
embedded_at
```

The vector dimension must match the chosen embedding model. Phase 1 deliberately does not invent a dimension.

No HNSW/IVFFlat index is part of the baseline. Exact retrieval is measured first.

## 18. Chinese/Vietnamese lexical retrieval decision

Current live project capability was previously verified as:

```text
vector    available, not installed
pgroonga  available, not installed
pg_trgm   available, not installed
```

No extension is enabled in this checkpoint.

Phase 4 must benchmark representative memory text containing:

- Simplified Chinese without spaces;
- mixed Chinese + Vietnamese;
- names/nicknames;
- exact phrases/inside jokes;
- short preference/fact sentences;
- typo/spacing variants where relevant.

The final lexical layer is selected from measured behavior. Native PostgreSQL FTS is not assumed sufficient for Chinese by default.

## 19. Existing-row / lock / rewrite risk

For the core persistence migration as designed:

```text
existing AI rows: none
backfill: none
existing-table rewrite: none
existing-table lock: only extension/function/catalog work plus new-object DDL
foreign keys: only among new AI tables + auth.users + optional user_api_keys if later required
```

Do not migrate `memoryNotes` or browser profile data automatically in SQL. Existing local profile data belongs to a later explicit user import flow.

Core migration is additive and should not modify current chat behavior until Phase 2 routes/services start using the new tables.

## 20. Rollback / forward-fix strategy

Before any environment apply, choose one documented strategy.

Recommended for the first non-production apply: **rollback by dropping only the new AI objects**, because the migration is additive and has no backfill/consumer yet.

Once Phase 2 writes real conversation data, destructive rollback is no longer the default. From that point the strategy changes to forward-fix migrations unless the target contains disposable test data.

No rollback SQL is added yet because no migration file is being created in this checkpoint.

## 21. Generated and application contracts after migration approval

After Migration A is explicitly approved and added:

1. apply to the explicitly named safe target;
2. regenerate `src/types/supabase.generated.ts`;
3. do not hand-edit generated DB types;
4. add feature-owned Zod schemas only at API/runtime boundaries;
5. repository/service types should derive from generated rows where practical;
6. run targeted migration/repository tests;
7. run Supabase security/performance advisors when live access is available;
8. report exact environment touched.

## 22. Decisions fixed by this design

The following are no longer open questions for Migration A:

```text
character ownership       = user-owned only
browser DB access         = none; strict BFF
relationship owner        = familiarity_score only
closeness                 = derived
memory scope              = character_id nullability
memory provenance         = many-to-many evidence table
forget semantics          = delete memory row
message ordering          = atomic conversation sequence RPC
user-turn idempotency     = client_message_id
assistant idempotency     = unique reply_to_message_id
summary checkpoint        = summary_until_seq + summary_version
embedding dimension       = not part of core persistence migration
ANN index                 = not part of baseline
local profile auto-import = prohibited
```

## 23. Decisions still required before mutation

No migration file or DB apply begins until these are explicit:

```text
1. Target environment for first apply
   local / disposable Supabase branch / another safe target

2. Permission to add Migration A
   tables + RLS + grants + server-only RPC

3. Exact rollback mode for that target
   destructive drop-new-objects rollback vs forward-fix
```

Embedding provider/dimension and Chinese lexical engine are **not blockers for Migration A** because retrieval is deliberately split into a later additive migration.

## 24. Phase 1 exit boundary

Phase 1 design is complete when:

- this contract is reviewed;
- the parent implementation plan reflects the evidence-table and split-migration decisions;
- no schema has been mutated;
- the next action is a single explicit confirmation for Migration A, not an open-ended implementation request.
