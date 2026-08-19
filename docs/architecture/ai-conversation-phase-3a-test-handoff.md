# AI Conversation Phase 3A — Trusted Context Ownership Handoff

Status: implementation checkpoint ready for user-run code/integration verification
Branch: `feat/persistent-social-memory-ai-redesign`
Database mutation by implementation agent: none
Migration prerequisite for persisted integration testing: `supabase/migrations/20260818095100_create_ai_conversation_persistence.sql`

## Scope completed

This checkpoint changes only the authority model used to generate a persisted AI turn.

```text
persisted user turn
  -> server loads owned conversation
  -> server loads stable character identity
  -> server loads optional relationship state
  -> server loads learner-level preference (fallback: intermediate)
  -> server loads thread summary checkpoint
  -> server loads recent persisted messages
  -> trusted context builder constructs system authority
  -> BYOK or system provider receives that authority as a real system instruction
  -> assistant reply is persisted through the Phase 2 flow
```

Long-term memory retrieval is deliberately not included yet.

## Authority contract after this checkpoint

The persisted provider stack is now:

```text
0. PRODUCT POLICY
1. CHARACTER IDENTITY
2. RELATIONSHIP STATE
3. THREAD SUMMARY
4. RECENT RAW MESSAGES
             ↓
            LLM
```

Phase 4 will insert relevant long-term memory between relationship state and thread summary.

Character, relationship and summary values are serialized into delimited data blocks. The system prompt explicitly states that those blocks are data, not executable instructions. Prompt-like text inside character/relationship/summary fields therefore does not receive system authority merely because it was persisted.

Recent user messages remain user content and are not copied into the system-data block.

## Stable character versus conversation mode

The character and the interaction mode now have separate owners.

Stable character identity is loaded from `ai_characters`:

```text
display_name
city
age
background
personality
speaking_style
interests
identity_notes
```

Conversation behavior is loaded from `ai_conversations`:

```text
mode
correction_style
reply_mode
memory_policy
```

Changing a mode changes behavior instructions; it does not replace the character id or character data.

Relationship presentation is derived from one authoritative `familiarity_score` rather than persisting a second closeness value:

```text
< 0.20  -> new
< 0.50  -> familiar
< 0.80  -> friends
>= 0.80 -> close
```

The numeric score is an internal state contract, not intended as normal learner-facing UI.

## Client trust boundary tightened

The persisted turn command is now intentionally narrow:

```json
{
 "action": "message",
 "conversationId": "uuid",
 "clientMessageId": "uuid",
 "content": "你好",
 "apiKeyId": "optional uuid"
}
```

It no longer accepts the browser's local `profile` object.

The current workspace still has the legacy local profile UI for compatibility while the UI/settings redesign is pending. Its persisted transport adapter accepts that caller argument temporarily so the workspace does not need an unrelated UI rewrite in this checkpoint, but the adapter discards it before sending the request.

Consequences:

- local `displayName` cannot redefine the persisted character;
- local `persona` cannot turn the character into another identity;
- local `characterNotes` cannot become trusted system instructions;
- local `memoryNotes` are not uploaded into persisted context or memory;
- local correction/reply fields do not override the persisted conversation row;
- learner level is read from `ai_conversation_preferences`, falling back to `intermediate` when no row exists.

The legacy non-persisted compatibility request path still accepts the old profile contract. That path remains only to avoid unrelated breakage during the staged cutover and is not the authoritative persisted-chat path.

## Provider authority separation

OpenAI-compatible BYOK providers receive the trusted context in a `system` message and conversation text in a `user` message.

Gemini BYOK and system Gemini receive the trusted context through `systemInstruction`, while conversation text stays in `contents` as user content.

This fixes the previous hierarchy in which a friend/persona description could be injected as lower-priority user text under a tutor-oriented system prompt.

## Files in this checkpoint

Core implementation:

```text
src/features/hanzihome/ai-conversation/ai-conversation-context.server.ts
src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.ts
src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.ts
src/features/hanzihome/ai-conversation/ai-conversation-turn.server.ts
src/features/hanzihome/ai-conversation/ai-conversation-system.server.ts
src/features/hanzihome/ai-conversation/ai-conversation-api.ts
src/app/api/ai/conversation/route.ts
src/services/ai.service.ts
```

Focused contract tests:

```text
src/features/hanzihome/ai-conversation/ai-conversation-context.server.test.ts
src/features/hanzihome/ai-conversation/ai-conversation-turn.server.test.ts
src/features/hanzihome/ai-conversation/ai-conversation-system.server.test.ts
src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.test.ts
src/features/hanzihome/ai-conversation/ai-conversation-api.test.ts
src/app/api/ai/conversation/route.test.ts
src/services/ai.service.test.ts
```

## What is intentionally not implemented

This checkpoint does not add:

- memory extraction, retrieval or lifecycle operations;
- vector or lexical retrieval;
- relationship-score evolution after turns;
- summary compaction/rebase;
- UI mode selector backed by persisted conversation mutation;
- character editor backed by persisted character mutation;
- Memory Manager;
- conversation-history redesign;
- Settings redesign;
- generated Supabase type refresh before the chosen database target has the migration.

## Current UI compatibility caveat

The current setup dialog still displays the old local persona/profile controls. Those controls are no longer the authority for persisted character identity or persisted conversation behavior.

This is deliberate for Phase 3A: changing backend ownership and redesigning the UI at the same time would make regressions harder to isolate.

Do not judge the final conversation/settings UX from this checkpoint. Phase 5 and Phase 6 own that redesign. A smaller Phase 3B can first expose safe persisted mode/preference mutation before the visual redesign.

## Tests added or changed

The code now has focused tests intended to disprove these failure modes:

- recent user prompt injection being copied into system-data blocks;
- changing conversation mode changing stable character identity;
- relationship labels having a second writable owner;
- persisted route accepting legacy client profile data;
- client transport serializing local profile data;
- persisted turn bypassing the trusted context builder;
- BYOK system context being placed in user text;
- Gemini system context being concatenated into user content;
- system and personal runtime paths receiving different authority contracts.

These tests are committed but have not been executed by the implementation agent in the current tool environment. They must not be reported as passing until run locally/CI.

## Suggested local code verification

Run the smallest relevant gates first:

```bash
npm run source:check
npm run typecheck
npm run test:run -- \
  src/app/api/ai/conversation/route.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-api.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-context.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-turn.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-system.server.test.ts \
  src/services/ai.service.test.ts
npm run lint
npm run format:check
```

If those pass, run the repository gate required before merge:

```bash
npm run check
```

## Suggested integration verification after migration is on your chosen target

1. Sign in and send one persisted turn.
2. Inspect the network request for `action: "message"`.
3. Confirm the request contains no `messages` transcript and no `profile` object.
4. Reload and confirm transcript persistence still works from Phase 2.
5. Confirm the generated response behaves as the persisted `小林` character rather than whichever legacy local persona/display name happens to be stored in the browser.
6. If no `ai_conversation_preferences` row exists, expected learner level for provider context is `intermediate`.
7. Insert or update a test preference through your chosen safe DB/test process and confirm the next turn uses that persisted learner level.
8. If a relationship row exists for the same character, confirm tone may reflect the derived relationship band without exposing a raw numeric score to the normal UI.
9. Retry the same `clientMessageId`; the Phase 2 idempotency behavior must remain intact.

## Residual risk

- No migration has been executed by this implementation agent, so PostgREST behavior against the new tables remains integration-unverified here.
- Generated Supabase types remain intentionally unchanged until the migration exists on the selected schema target.
- The existing local profile UI is temporarily semantically stale for persisted conversations.
- Conversation modes are server-owned but there is not yet a user-facing persisted mutation path for switching them.
- Relationship state is read-only in this checkpoint; evolution belongs to a later post-turn lifecycle.
- Summary is read if present, but compaction/rebase is not yet implemented.

## Next proposed checkpoint

`Phase 3B — Persisted conversation preferences/mode mutation` should be the next small flow before long-term memory.

Its purpose is not a visual redesign. It should provide an authenticated server-owned mutation contract for:

```text
conversation mode
correction style
reply mode
learner level
```

and make the current UI use those persisted values with the smallest compatible presentation change. After that flow is accepted, Phase 4 can add long-term memory without depending on browser-owned learning preferences.
