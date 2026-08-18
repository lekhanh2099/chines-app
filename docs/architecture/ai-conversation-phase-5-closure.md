# AI Conversation Phase 5 — Closure Checkpoint

Status: source fixes complete; user-run verification pending
Branch: `feat/persistent-social-memory-ai-redesign`

This checkpoint closes only the Phase 5 regressions reported after the workspace redesign. It does not start Phase 6 Settings / Memory Manager work and it does not change database schema, RLS, migrations, or production data.

## Reported regressions and root causes

### 1. Raw `AiConversation.*` labels in the rendered menu

The current branch locale catalogs already own the required semantic keys in `vi`, `en`, and `zh-CN`, including:

- `runtime.compactReady`;
- `memory.useLongTerm`;
- `history.archive`;
- `actions.setup`.

`src/i18n/messages.test.ts` also asserts the Phase 5 conversation contract. The screenshot showing raw keys and the old `Thiết lập nhân vật` copy therefore represents a stale local Next message bundle / checkout rather than a missing current-branch locale contract.

Verification requires pulling the branch and restarting the dev process; if the old bundle survives, remove `.next` before restarting.

### 2. Persistence readiness tests were nondeterministic

`loadLatestAiConversationSession()` intentionally performs independent persistence reads concurrently.

The two readiness tests used `mockResolvedValue(Response.json(...))`, which re-used one Fetch `Response` instance for every mocked call. A Fetch response body is single-consumption. One concurrent request could consume the body while the other fell through to the generic persistence-request error, making `Promise.all` reject nondeterministically with `AiConversationPersistenceRequestError` instead of `AiConversationPersistenceNotReadyError`.

The tests now return a fresh `Response` for every fetch invocation via `mockImplementation`. Production classification logic was not weakened or broadened to satisfy a broken test double.

### 3. Redundant/cancelled conversation fetches

The active conversation remains URL-owned and the transcript remains TanStack Query-owned.

The bootstrap flow already seeds the conversation-id query before canonicalizing the URL. Phase 5 now gives that seeded session a short stale window and disables focus-triggered session refetches, so the URL transition can reuse the authoritative session instead of immediately starting another request.

After a successful send, the server response already contains the persisted user and assistant messages. The client writes that authoritative result into the session cache and no longer immediately invalidates the same session query. History metadata is still invalidated because its last-activity ordering changed.

This removes the main avoidable source of background conversation requests that were being aborted when the user immediately navigated to Settings or another conversation.

A request explicitly aborted because the route itself is being left while a real fetch is still in flight remains valid cancellation behavior; Phase 5 does not disable AbortSignal ownership merely to hide DevTools status.

### 4. Messenger-style message hierarchy

`AiConversationMessageBubble` now makes the speaker geometry explicit:

```text
assistant avatar + left bubble
                         right user bubble
```

- user messages are right aligned with the primary conversation surface;
- assistant messages are left aligned with the character avatar and a neutral surface;
- opposite bottom corners are tightened to read as message bubbles rather than generic cards;
- mobile and desktop keep bounded readable widths;
- the typing state uses the same assistant bubble geometry instead of a generic AI/sparkle status row.

The transcript remains the only nested vertical scroll region in the contained conversation workspace.

## Files changed in this closure

- `src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.test.ts`
- `src/features/hanzihome/ai-conversation/AiConversationWorkspace.tsx`
- `src/features/hanzihome/ai-conversation/AiConversationMessageBubble.tsx`
- this handoff document

No migration file changed.

## Required verification

Targeted code checks:

```bash
npm run source:check
npm run ui:check
npm run typecheck
npm run test:run -- \
  src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-api.test.ts \
  src/app/api/ai/conversation/route.test.ts \
  src/i18n/messages.test.ts
npm run lint
npm run format:check
```

Rendered verification:

1. restart dev after pulling the branch; clear `.next` only if old message keys remain;
2. open `/vi/conversation` and confirm no raw `AiConversation.*` key is visible;
3. confirm assistant bubbles are left aligned with the character avatar and user bubbles are right aligned;
4. send several turns and confirm no immediate redundant session refetch is created after each successful response;
5. create a new conversation and switch history entries; each transcript must remain isolated;
6. open Settings from the runtime menu; an actually in-flight route request may abort, but there must not be repeated background conversation cancellations;
7. verify phone (~390×844), iPad portrait (~820×1180), desktop (~1440×900), keyboard focus, light and dark modes.

Phase 5 is ready to close only after these user-run checks are green.
