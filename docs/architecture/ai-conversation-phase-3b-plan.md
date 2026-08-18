# AI Conversation Phase 3B — Persisted Behavior Mutation Plan

Status: active checkpoint
Branch: `feat/persistent-social-memory-ai-redesign`
Database schema change: none
Live Supabase mutation by implementation agent: none

## Goal

Finish ownership cutover for the current conversation behavior without expanding into long-term memory or the final conversation/settings redesign.

The authoritative owners in this checkpoint are:

```text
stable character identity      -> ai_characters
current conversation mode      -> ai_conversations.mode
current correction style       -> ai_conversations.correction_style
current reply mode              -> ai_conversations.reply_mode
learner level                   -> ai_conversation_preferences.learner_level
transcript                      -> ai_messages
runtime key choice              -> existing client runtime preference contract
```

The legacy browser profile must not override these persisted values.

## Small coherent scope

1. Extend the persisted session contract with the server-owned character presentation and learner level required by the current workspace.
2. Add an authenticated server action to update the current conversation mode/correction/reply behavior plus the user's learner-level preference.
3. Keep conversation mutation ownership-scoped by both authenticated `user_id` and `conversation_id`.
4. Rewire the current setup dialog to persisted values only.
5. Remove the current workspace dependency on the legacy local profile. Keep the legacy profile adapter only for the non-persisted compatibility API path until that path is retired separately.
6. Keep the current runtime/API-key surface intact. Do not redesign the full conversation workspace in this phase.

## Deliberate non-goals

- no new migration;
- no RLS/grant/schema change;
- no vector/PGroonga work;
- no memory extraction/retrieval;
- no relationship evolution;
- no summary compaction;
- no conversation-history/archive/delete UI;
- no character editor;
- no final Settings IA redesign;
- no provider/runtime redesign.

## Server flow

```text
setup save
  -> authenticated Next route
  -> validate conversationId + mode + correctionStyle + replyMode + learnerLevel
  -> PATCH owned ai_conversations row
  -> UPSERT authenticated user's ai_conversation_preferences learner_level
  -> return persisted settings snapshot
  -> client updates/refetches the session query
```

`mode/correction/reply` and `learnerLevel` are separate persisted aggregates. A failure must remain observable; the client refetches authoritative server state instead of guessing or silently restoring browser state.

## Session flow

```text
load session
  -> latest owned conversation
  -> owned character presentation
  -> learner preference (fallback intermediate)
  -> persisted transcript
  -> workspace renders server-owned values
```

New conversation creation keeps the existing product defaults unless a persisted user default row already supplies default mode/correction/reply values.

## UI boundary

The existing dialog remains a normal canonical `Dialog` with TanStack Form fields. In this phase it becomes a conversation-behavior dialog rather than a character/profile editor.

Fields in scope:

```text
conversation mode
learner level
correction style
reply mode
```

Legacy local-only fields (`persona`, `displayName`, `interests`, `characterNotes`, `memoryNotes`) are removed from this workspace dialog because they no longer own persisted/provider behavior.

The workspace character header and greeting use the persisted character/session snapshot. No full visual redesign is attempted here.

## Acceptance criteria

- switching mode persists after reload;
- switching mode does not change `characterId`;
- correction style persists after reload;
- reply mode persists after reload;
- learner level persists after reload;
- provider context on the next turn uses the updated persisted values;
- stale local profile data cannot override the persisted session UI or provider context;
- another user's conversation id cannot be mutated;
- failed persistence remains visible and the UI refetches authoritative state;
- Phase 2 transcript persistence and idempotent send behavior remain unchanged.

## Verification target

Focused checks to run locally after implementation:

```bash
npm run source:check
npm run typecheck
npm run test:run -- \
  src/app/api/ai/conversation/route.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-api.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-context.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-turn.server.test.ts
npm run lint
npm run format:check
```

Manual integration target after code checks:

1. Open the persisted conversation.
2. Change mode, correction style, reply mode and learner level.
3. Reload and confirm all four values remain.
4. Send a turn and confirm behavior matches the persisted mode/settings.
5. Confirm character identity remains unchanged.
6. Change legacy local profile storage manually and reload; persisted UI/provider behavior must not change.
7. Attempt the mutation with a conversation id owned by another user; it must be rejected.

## Stop gate

After this flow is implemented, report the exact files changed and stop. Do not start Phase 4 memory work until the user accepts this checkpoint.
