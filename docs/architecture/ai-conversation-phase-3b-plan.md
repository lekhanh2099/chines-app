# AI Conversation Phase 3B — Persisted Behavior Mutation Plan

Status: implementation complete in source; ready for user-run verification
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
5. Remove the current workspace dependency on the legacy local profile and delete the now-unreachable browser profile adapter. Keep the legacy profile schema/request path only for the non-persisted compatibility API until that route contract is retired separately.
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

`mode/correction/reply` and `learnerLevel` are separate persisted aggregates. Without introducing a new transactional RPC/schema change in this phase, the two writes are intentionally not presented as atomic. A failure remains observable and the client refetches authoritative server state instead of guessing or silently restoring browser state. The conversation ownership check happens before the learner preference write, so an unowned conversation id cannot mutate account preference as a side effect.

## Session flow

```text
load/ensure session
  -> latest owned conversation
  -> owned character presentation
  -> learner preference (fallback intermediate)
  -> persisted transcript
  -> workspace renders server-owned values
```

The workspace now uses `ensure-session` for its authoritative query so a first visit receives a stable persisted character/conversation rather than rendering a local placeholder owner.

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

The workspace character header and greeting use the persisted character/session snapshot. No full visual redesign is attempted here; the existing runtime selector and bounded chat-height styling remain until Phase 5.

## Implemented contracts

Persisted session response now owns:

```text
conversation
character { id, displayName, city, interests }
learnerLevel
messages
```

Persisted settings command:

```json
{
  "action": "update-settings",
  "conversationId": "uuid",
  "mode": "natural | speaking-practice | grammar-coach | hskk-practice",
  "correctionStyle": "light | balanced | strict",
  "replyMode": "adaptive | chinese | bilingual",
  "learnerLevel": "beginner | intermediate | advanced"
}
```

The request is strict and does not accept `profile`, `persona`, `displayName`, `memoryNotes`, or transcript data.

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

## Static regression coverage added

Focused tests now cover:

- persisted session character + learner-level contract;
- strict persisted settings schema and rejection of legacy persona data;
- settings client transport contains no browser profile/persona;
- route derives `userId` from authenticated server context;
- unowned conversation mutation maps to not-found;
- persistence PATCH is filtered by authenticated `user_id` and `conversation_id`;
- learner preference is not written when the owned conversation row is absent;
- persisted message transport remains transcript/profile-free.

These tests are committed but have not been executed by the implementation agent in the current connector-only environment. They must not be reported as passing until run locally or in CI.

## Verification target

Focused checks to run locally:

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

If those pass, run the repository gate before merge/release:

```bash
npm run check
```

Manual integration target:

1. Open the persisted conversation.
2. Open `Thiết lập hội thoại`.
3. Change mode, correction style, reply mode and learner level, then save.
4. Reload and confirm all four values remain.
5. Confirm `小林` / the current persisted character id remains unchanged after mode switches.
6. Send a turn and confirm behavior matches the persisted mode/settings.
7. If old `hanzihome.ai-conversation.profile` data still exists in browser storage from previous builds, change it manually and reload; persisted UI/provider behavior must not change.
8. Confirm transcript persistence and retry behavior from Phase 2 still work.
9. For an ownership test account, attempt the settings action with another user's conversation id; expected response is 404 `AI_CONVERSATION_NOT_FOUND`.

## UI verification boundary

Source follows the existing canonical Dialog/Form/Select/Button/Typography contracts, but no browser renderer is available to the implementation agent in this environment. Desktop/iPad/mobile visual states and keyboard interaction remain user/CI-browser verification, and no screenshot-level claim is made for this checkpoint.

## Stop gate

Phase 3B implementation stops here. Do not start Phase 4 long-term memory work until the user accepts this checkpoint.
