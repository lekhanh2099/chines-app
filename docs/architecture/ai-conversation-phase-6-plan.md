# AI Conversation Phase 6 — Settings + Memory Manager Plan

Status: active implementation guardrail
Branch: `feat/persistent-social-memory-ai-redesign`
Depends on: Phase 5 conversation workspace closure

This document is the scope boundary for the final feature phase. It exists to prevent Settings work from expanding into new database schema, unrelated app settings, or destructive memory semantics that are not already supported by Phase 4.

## 1. User goal

Finish the persistent social-memory AI feature with one coherent settings surface where the learner can understand and control:

- the default conversation behavior;
- whether long-term memory is enabled for the account;
- what the AI currently remembers;
- whether a memory is global or specific to the stable character;
- explicit edit / resolve / forget actions;
- runtime/API-key setup without dashboard-like clutter;
- actual usage telemetry only;
- advanced prompt controls as secondary configuration.

Primary settings hierarchy:

```text
AI overview
conversation defaults
memory + relationship
model + provider
usage
advanced prompts
```

## 2. Current friction verified in source

- the AI tab is model-first rather than conversation-first;
- API-key management combines education, stats and operational rows in one permanent large section;
- usage renders token placeholders even when token telemetry does not exist;
- long-term memory is persisted but the user cannot inspect or manage it in Settings;
- account-wide default conversation preferences exist in `ai_conversation_preferences` but the Settings AI tab does not own them;
- the prompt editor remains visually first-class even though it is an advanced control;
- current UI uses multiple section cards where separator/row hierarchy is sufficient.

## 3. Authoritative owners

```text
account AI defaults             -> ai_conversation_preferences
current/default character       -> ai_characters
relationship                    -> ai_relationship_states
active memories                 -> ai_memories
memory edit/delete/resolve      -> authenticated BFF server actions
API keys                        -> existing useManagedApiKeys Query/mutations
client prompt settings          -> existing ai-prompts API + local fallback contract
usage telemetry                 -> existing browser usage snapshot
section navigation              -> /settings?section=ai
modal/sheet/form draft state    -> local UI / TanStack Form as appropriate
```

No DB-owned preference or memory may be mirrored into local state merely for rendering.

## 4. Phase 6 slices

### 6A — Account preference + Memory Manager contract

Add server-owned API contracts for:

- loading account AI defaults and current stable character/relationship summary;
- updating default mode, correction style, reply mode, learner level and account memory toggle;
- listing active memories owned by the authenticated user;
- editing memory content while clearing stale embeddings;
- resolving active `open_loop` memories;
- explicitly forgetting one active memory.

No schema migration is allowed in this slice.

Memory edit intentionally clears embedding metadata. Semantic re-embedding is lazy through the existing Phase 4 unembedded-memory pipeline; lexical retrieval remains immediately correct.

### 6B — Settings information architecture

Refactor the AI tab into:

```text
Overview
Conversation
Memory & relationship
Model & provider
Usage
Advanced
```

The Memory Manager is a user-facing modal/sheet surface with filters:

```text
All | Global | With current character | Open loops
```

Memory rows show natural-language content, semantic kind/scope labels and updated time. They do not show importance, confidence, vector metadata or raw memory keys.

### 6C — API key + usage cleanup

- keep Add API Key education inside its dialog;
- remove permanent free-tier tutorial and dashboard stats from the main section;
- keep compact operational key rows and status;
- usage renders request/runtime facts and token totals only when telemetry exists;
- prompt editors move under Advanced and remain behaviorally unchanged.

### 6D — final verification

Targeted tests first, then full repository gate before merge/release.

Required rendered states when available:

- desktop 1440×900;
- iPad portrait ~820×1180;
- mobile ~390×844;
- light/dark;
- memory loading/empty/error/many memories;
- edit/resolve/forget dialogs and pending states;
- API key empty/loading/error/configured;
- usage with and without token telemetry;
- prompt dirty/save/reset states.

## 5. Memory semantics

### Scope

`character_id is null` -> global memory.

`character_id = current character id` -> character-specific memory.

### Edit

User edits only `content`.

Server must filter by authenticated `user_id`, active status and exact memory id. A successful edit clears:

```text
embedding
embedding_model
embedding_version
```

so stale semantic vectors can never represent edited text.

### Resolve

Only active `open_loop` memories may be marked `resolved`.

### Forget

Explicit Settings "Forget" permanently deletes that active memory and cascades its evidence, matching the existing explicit-forget semantics.

The UI must require confirmation and explain the consequence.

## 6. Non-goals

Phase 6 does not:

- add another character system;
- add new memory kinds/statuses;
- add a DB migration;
- expose raw technical scores or embeddings;
- hard-delete conversations;
- change Phase 4 retrieval scoring;
- rewrite the API-key persistence model;
- add persistent server-side usage billing telemetry;
- change unrelated App/Reading settings.

## 7. Acceptance

Phase 6 is complete only when:

1. account defaults persist and affect newly created conversations;
2. account memory toggle persists and changes long-term-memory read/write behavior;
3. Memory Manager lists only memories owned by the authenticated user;
4. global and character scope are clearly distinguished;
5. editing a memory immediately changes displayed/lexical content and invalidates old embedding metadata;
6. resolving an open loop removes it from active recall;
7. forgetting a memory removes it from active memory and requires confirmation;
8. API-key education no longer occupies the permanent settings page;
9. token fields are omitted when telemetry is absent instead of rendering `—`;
10. Advanced prompt save/reset/dirty behavior is preserved;
11. no new Supabase migration is required;
12. source/type/i18n/tests/UI checks are clean before final closure.
