# AI Conversation Persistent Memory — Implementation Plan

Status: active implementation guardrail
Branch: `feat/persistent-social-memory-ai-redesign`
Baseline: `main` at `86f41ccb500953114f6410934f0d513f28b52e64`

This document is the implementation boundary for the persistent social-memory and AI Conversation redesign. It exists to prevent opportunistic refactors and to make each delivery independently reviewable.

## 1. Product goal

Turn AI Conversation from a transient tutor-style chat into a persistent Chinese-speaking character relationship while keeping infrastructure details secondary to the conversation itself.

The target context hierarchy is:

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

The user-facing product should feel like talking to a continuing character. Provider, model, API key, retrieval, embeddings and summarization are supporting infrastructure.

## 2. Current verified baseline

Current `main` behavior:

- conversation messages are local React state and disappear after reload;
- the browser sends recent transcript messages plus the profile to `/api/ai/conversation`;
- the route keeps the latest 19 transcript messages and prepends profile context;
- BYOK and system providers flatten the conversation into one prompt;
- `memoryNotes` is a browser-persisted manual profile field, not learned memory;
- there is no persisted conversation, message, relationship or memory table;
- Supabase `vector` is available but not installed;
- the current conversation instruction hierarchy still frames the model primarily as a tutor, even when the selected mode is `friend`.

## 3. Hard architecture invariants

### 3.1 One owner per value

Do not duplicate authoritative state.

```text
character identity     -> character record
relationship strength  -> familiarity_score
closeness label        -> derived from familiarity_score
long-term facts/events -> memory records
thread continuity      -> summary + summary_until_seq
recent transcript      -> persisted messages
runtime selection      -> conversation/request preference contract
```

Do not persist both `scope` and `character_id` when `character_id NULL` can represent global memory. If a future third scope is required, redesign the contract explicitly instead of encoding two contradictory owners.

### 3.2 Character identity is not conversation mode

A stable character must remain the same person when the user switches practice behavior.

```text
Character identity:
- name
- background
- personality
- speaking style
- interests

Conversation mode:
- natural conversation
- speaking practice
- grammar coaching
- HSKK practice
```

### 3.3 Relationship state is not memory

Relationship state may contain only compact state required to render or derive the relationship, for example:

- nickname;
- familiarity score;
- interaction style;
- revision/version.

Inside jokes, promises, shared events, unfinished topics and plans are memories, not relationship-state fields.

### 3.4 Backend owns transcript continuity

The final API must not trust the client to send the authoritative transcript.

Target request shape:

```text
POST /conversations/:conversationId/messages

{
  clientMessageId,
  content,
  runtimeKeyId?
}
```

The server authenticates, persists, reconstructs context from owned data, calls the provider, persists the assistant response and returns it.

### 3.5 Memory is data, never instruction authority

Retrieved memories must be serialized into a clearly delimited data block. They cannot override product policy, character policy or safety instructions.

### 3.6 Explicit user control wins

The memory lifecycle must support:

```text
IGNORE
ADD
REINFORCE
SUPERSEDE
RESOLVE
FORGET
```

An explicit request such as `别记这个`, `忘掉这个` or equivalent user intent has higher authority than extractor inference.

### 3.7 Summary coverage is explicit

A conversation summary must always carry:

```text
summary
summary_until_seq
summary_version
```

Compaction is triggered by context pressure and unsummarized span, not by an arbitrary message count. Periodic rebuild/rebase from persisted raw messages is required to limit recursive-summary decay.

### 3.8 Retrieval starts exact and measurable

V1 uses exact vector retrieval as the baseline. Do not add HNSW/IVFFlat until measured data volume and latency justify ANN.

Chinese/Vietnamese lexical retrieval must be benchmarked separately; do not assume default PostgreSQL FTS is sufficient for Chinese.

## 4. Intended persistent model

The exact SQL is deliberately deferred to the schema phase. The conceptual owners are:

```text
ai_characters
ai_conversation_preferences
ai_conversations
ai_messages
ai_memories
ai_relationship_states
ai_post_turn_jobs
```

Expected semantics:

### `ai_characters`

Stable character identity owned by the authenticated user or a future system-template contract.

### `ai_conversation_preferences`

User-level conversation behavior such as learner level, correction style, reply-language preference and memory enablement. Do not mix stable character identity into this record.

### `ai_conversations`

Owns thread title, character reference, summary checkpoint, memory mode and archive state.

### `ai_messages`

Owns stable `seq`, role, content and `client_message_id` idempotency.

### `ai_memories`

Owns long-term facts, preferences, habits, goals, episodes, open loops, inside jokes and similar continuity data.

Important fields expected to be considered during schema design:

```text
character_id nullable
kind
memory_key nullable
content
embedding
importance
confidence
status
source_message_id
superseded_by
last_recalled_at
valid_until
created_at
updated_at
```

### `ai_relationship_states`

Owns the compact user-character relationship state. `closeness` is derived from `familiarity_score`, not independently writable.

### `ai_post_turn_jobs`

Durable post-response processing state for memory extraction/embedding/summary work. Do not implement post-turn persistence as an untracked fire-and-forget Promise.

## 5. Target server flow

```text
USER MESSAGE
    │
    ├─ authenticate
    ├─ idempotency check
    ├─ persist user message
    │
    ▼
CONTEXT BUILDER
    ├─ product policy
    ├─ character identity
    ├─ relationship state
    ├─ relevant global memories
    ├─ relevant character memories
    ├─ thread summary
    └─ recent raw messages
    │
    ▼
LLM
    │
    ├─ persist assistant message
    └─ return response immediately
    │
    ▼
DURABLE POST-TURN PIPELINE
    ├─ extract memory candidates
    ├─ deduplicate / match existing memories
    ├─ IGNORE / ADD / REINFORCE / SUPERSEDE / RESOLVE / FORGET
    ├─ embed affected memories
    └─ compact/rebase summary when required
```

## 6. Target conversation UX

The conversation surface is a workspace, not an AI control panel.

Primary hierarchy:

```text
character identity / relationship
conversation
composer
secondary runtime status
```

Provider/model/API-key controls are secondary and opened on demand.

Required product behavior eventually includes:

- persisted conversation history;
- new conversation;
- archive/delete conversation;
- stable character while switching conversation mode;
- temporary conversation mode that neither reads nor writes long-term memory;
- visible but non-intrusive relationship label;
- explicit memory provenance/control where destructive actions need it;
- deletion UX that explains whether learned memories are also forgotten.

The feature must inherit App Shell height and use bounded scroll ownership. Do not keep guessed chat heights such as `max-h-[62dvh]` as the final workspace contract.

## 7. Target AI Settings information architecture

AI Settings should answer these first:

```text
Which character is active?
Which runtime is active?
Is memory enabled?
Is the API-key setup healthy?
```

Target IA:

```text
AI overview

Conversation
- character
- default conversation mode
- correction/reply preferences
- default runtime

Memory & relationship
- memory on/off
- manage remembered information
- relationship overview
- privacy / temporary conversation explanation

Models & providers
- system model behavior
- personal API keys

Usage
- only telemetry that is actually available

Advanced
- word-lookup prompt
- sentence-analysis prompt
- other developer-like controls
```

Do not add this as another stack of nested dashboard cards. Use section hierarchy, rows, separators and terminal cards only where a framed object is semantically useful.

## 8. Delivery phases and stop gates

Only one phase may be actively implemented at a time. After each phase, report the evidence and stop for user review before expanding scope.

### Phase 0 — Implementation guardrail

Scope:

- add this plan only;
- no runtime code;
- no database mutation;
- no extension enablement.

Exit criteria:

- plan exists on the feature branch;
- phase boundaries and stop conditions are explicit.

### Phase 1 — Domain contracts and migration design

Scope:

- inspect existing migration and generated-type conventions;
- design exact table/index/RLS/ownership contracts;
- design vector/lexical retrieval columns and extension requirements;
- add migration file and generated application contracts only after explicit confirmation for DB/schema work;
- no conversation UI redesign yet.

Must resolve before mutation:

- exact target environment;
- RLS ownership;
- character ownership/template policy;
- vector dimension/provider used for embeddings;
- lexical-search approach for Chinese/Vietnamese;
- rollback or forward-fix strategy;
- existing-row and lock risk.

Stop condition: schema/RLS/extension mutation requires explicit user confirmation under repository policy.

### Phase 2 — Persisted conversation/message ownership

Scope:

- conversation repository/service contract;
- message persistence;
- stable sequence allocation;
- client-message idempotency;
- backend-owned turn endpoint;
- load/new/archive/delete conversation APIs required by this phase;
- compatibility path for the current UI if required.

Non-goal:

- learned long-term memory retrieval/extraction.

Exit proof:

- reload keeps transcript;
- retrying the same `clientMessageId` does not duplicate the user turn;
- one user cannot read/write another user's conversation;
- provider calls reconstruct recent transcript from backend data.

### Phase 3 — Character, relationship and context builder

Scope:

- stable character identity;
- conversation modes separated from character identity;
- relationship-state owner;
- instruction hierarchy rebuild;
- context builder capable of product policy + character + relationship + summary + recent messages.

Non-goal:

- semantic long-term-memory retrieval if Phase 4 is not yet complete.

Exit proof:

- switching mode does not change character identity;
- `friend` is no longer implemented as a lower-priority user message under a tutor system identity;
- character-specific state cannot leak between characters.

### Phase 4 — Long-term memory and post-turn pipeline

Scope:

- exact vector retrieval baseline;
- lexical candidate retrieval selected from measured Chinese/Vietnamese behavior;
- reranking/merging;
- memory lifecycle operations;
- durable post-turn jobs/retry/idempotency;
- summary compaction + periodic rebase;
- temporary-chat read/write bypass.

Exit proof:

- relevant old memory can be recalled;
- irrelevant memory is not routinely injected;
- changed fact supersedes old fact;
- resolved open loop no longer remains active;
- explicit forget prevents later recall;
- temporary conversation neither reads nor writes long-term memory.

### Phase 5 — Conversation workspace redesign

Scope:

- professional conversation-first layout;
- persisted history/new conversation controls;
- compact runtime status;
- character + relationship presentation;
- temporary-conversation control;
- delete/archive UX;
- responsive/touch/keyboard states.

Exit proof requires rendered verification at:

```text
1440 × 900
820 × 1180
390 × 844
```

and relevant loading/empty/error/long-conversation/dark-mode states.

### Phase 6 — AI Settings IA redesign

Scope:

- AI overview;
- Conversation settings;
- Memory & relationship manager;
- compact API-key management;
- telemetry cleanup;
- Advanced prompt controls;
- responsive/touch/keyboard states.

Exit proof:

- ordinary users can understand active character/runtime/memory/key health without reading infrastructure jargon;
- remembered information can be inspected and forgotten;
- missing telemetry is not represented as fabricated zeroes or rows of meaningless `—` values;
- developer-like prompt settings no longer dominate the main AI settings flow.

## 9. Non-goals unless separately approved

Do not expand this work into:

- unrelated HanziHome navigation or lesson UI;
- dictionary/SRS architecture changes;
- auth redesign;
- general AI provider fallback redesign outside conversation requirements;
- repository-wide component migrations;
- unrelated settings cleanup;
- speculative ANN/vector-index optimization;
- new dependencies without explicit need and approval;
- production database changes without explicit confirmation.

## 10. Verification ladder

During each phase, use the smallest test boundary capable of disproving the implementation.

For completed app-code phases, escalate to repository gates required by the root contract. Do not report checks as passing unless they actually ran.

For DB phases, report:

```text
Target environment:
Migration drift:
Ownership/RLS:
Existing-row risk:
Lock/rewrite risk:
Rollback or forward-fix:
Generated types refreshed:
Security/performance advisors:
```

For UI phases, report:

```text
Rendered routes:
Viewports:
Mouse/touch interactions:
Keyboard interactions:
Loading/empty/error/destructive states:
Console warnings/errors:
Failed requests:
Known unverified states:
```

## 11. Phase handoff template

After each phase, stop and report:

```text
Phase:
Scope completed:
Files changed:
Authoritative owners introduced/changed:
Behavior intentionally changed:
Behavior intentionally preserved:
Checks actually run:
Rendered UI states (if applicable):
Residual risk:
Next proposed phase:
Confirmation required before next phase:
```

Do not begin the next phase until the user has reviewed the current phase report.
