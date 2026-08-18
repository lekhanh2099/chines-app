# AI Conversation Phase 5 — Conversation Workspace Redesign Handoff

Status: implementation complete in source; user-run code and rendered verification pending
Branch: `feat/persistent-social-memory-ai-redesign`
Plan: `docs/architecture/ai-conversation-phase-5-plan.md`

## 1. Scope completed

Phase 5 changes the AI Conversation route from an infrastructure-first control surface into a contained conversation workspace.

Implemented flow:

```text
open /conversation
  -> ensure/load persisted conversation
  -> canonicalize active conversation in ?conversation=<uuid>
  -> show stable character + semantic relationship + mode
  -> continue persisted transcript

new conversation
  -> server creates a new owned conversation
  -> same V1 default stable character
  -> client switches query key + URL
  -> transcript starts empty

history
  -> open one modal Sheet
  -> load bounded active-conversation metadata only
  -> select one conversation
  -> server loads that owned transcript
  -> switch query key + URL

memory control
  -> update current ai_conversations.memory_policy
  -> "Không dùng bộ nhớ" means no long-term-memory read/write
  -> transcript is still persisted

archive
  -> confirmation Dialog
  -> PATCH archived_at on owned conversation
  -> no hard delete
  -> if current conversation was archived, server selects/creates another active conversation
```

## 2. User-facing hierarchy

The workspace now follows:

```text
character + relationship + conversation mode
conversation transcript
composer
secondary runtime / settings controls
```

The previous permanent large runtime/model selector row is removed from the primary hierarchy. Runtime health and runtime selection remain available through a compact menu.

## 3. Persistent owners used

```text
active conversation id        -> URL search param `conversation`
active session/transcript      -> TanStack Query keyed by conversation id
conversation history           -> TanStack Query, loaded only when history Sheet opens
character presentation         -> persisted session
relationship score             -> persisted relationship state
relationship label             -> derived, never independently persisted
conversation mode              -> ai_conversations.mode
long-term-memory behavior      -> ai_conversations.memory_policy
runtime selection              -> existing browser runtime-key preference
settings draft                 -> TanStack Form
message draft/retry id         -> transient local client state
Sheet/Dialog/Menu open state   -> transient local client state
```

No authoritative transcript, character profile, relationship value or conversation behavior is mirrored into local client state.

## 4. Relationship presentation

The workspace receives the compact persisted relationship state and derives only a semantic band:

```text
< 0.20  -> new
< 0.50  -> familiar
< 0.80  -> friends
>= 0.80 -> close
```

The UI renders locale-specific labels such as `Mới quen`, `Quen nhau`, `Bạn bè`, `Thân thiết`.

Raw familiarity numbers are not exposed.

The same derivation helper is reused by the trusted provider-context builder so UI and prompt behavior do not invent separate relationship thresholds.

## 5. Conversation history

History is a right-side `Sheet`, not a permanent third rail.

The list is bounded and metadata-only. It does not preload every transcript.

Each active row shows:

- title or a stable fallback label;
- conversation mode;
- no-memory state when disabled;
- last activity / creation time;
- archive action.

The history Sheet deliberately avoids opening a second dropdown overlay. Archive is a direct sibling action that closes the Sheet before opening the confirmation Dialog, preserving the touch one-overlay model.

## 6. New conversation

New conversation creation is backend-owned. The browser does not submit a character profile or transcript.

V1 still has one default user-owned stable character (`小林`), so a new conversation keeps that character identity while starting a new transcript and applying the persisted conversation defaults.

## 7. Memory semantics

Phase 5 exposes only the semantics already implemented by Phase 4:

```text
Use long-term memory  -> memory_policy = inherit
Do not use memory     -> memory_policy = disabled
```

The UI explicitly says `Không dùng bộ nhớ` / equivalent locale copy.

It does **not** call this `Temporary Chat`, because the transcript remains persisted. True temporary/no-history retention is still out of scope.

## 8. Archive vs permanent delete

Phase 5 implements archive only.

Reason: hard-deleting a conversation cascades transcript/evidence rows, while canonical memories can have evidence from more than one conversation. Correct hard deletion therefore needs one server-side transactional policy for evidence removal and unsupported-memory recomputation/forgetting.

The workspace does not implement a multi-request browser deletion sequence that could leave memory provenance inconsistent.

Archive is recoverable at the data level (`archived_at`) and is clearly described as not permanently deleting content.

Archived-history restore UI is deferred.

## 9. Runtime hierarchy

Runtime controls remain functional but secondary:

- compact status trigger;
- current provider health;
- automatic or specific personal key selection;
- recheck action;
- link to AI/API-key Settings.

The trigger is compact on precise-pointer desktop and grows to the existing coarse-pointer touch minimum through the shared Button contract.

## 10. Layout / scrolling

The conversation route and workspace now inherit the App Shell height:

```text
AppScrollViewport
  route h-full min-h-0
    workspace h-full min-h-0
      header
      message pane flex-1 min-h-0 overflow-y-auto
      status/error
      composer
```

Removed from the final workspace contract:

```text
min-h-96
max-h-[62dvh]
manual viewport subtraction
```

The message transcript is the intentional nested scrolling workspace; the composer stays outside that message scroller.

## 11. Responsive/touch intent encoded in source

Target verification viewports remain:

```text
1440 × 900
820 × 1180
390 × 844
```

Source-level behavior now includes:

- one modal Sheet for history at all widths;
- 44px icon actions for new/history/more/archive/send;
- runtime compact trigger becomes touch-sized on coarse pointers;
- no permanent conversation rail;
- wrapping header actions;
- bounded message bubbles and one message scroller;
- no page-root max-width constraint;
- no raw palette or arbitrary viewport-height workaround introduced.

Rendered verification is still required before claiming the UI is visually complete.

## 12. Files introduced or materially changed in Phase 5

```text
docs/architecture/ai-conversation-phase-5-plan.md
docs/architecture/ai-conversation-phase-5-test-handoff.md

src/app/[locale]/(app)/conversation/page.tsx
src/app/api/ai/conversation/route.ts
src/app/api/ai/conversation/route.test.ts

src/features/hanzihome/ai-conversation/AiConversationWorkspace.tsx
src/features/hanzihome/ai-conversation/AiConversationHistorySheet.tsx
src/features/hanzihome/ai-conversation/AiConversationRuntimeMenu.tsx
src/features/hanzihome/ai-conversation/ai-conversation-api.ts
src/features/hanzihome/ai-conversation/ai-conversation-api.test.ts
src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.ts
src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.test.ts
src/features/hanzihome/ai-conversation/ai-conversation-relationship.ts
src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.ts
src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.test.ts
src/features/hanzihome/ai-conversation/ai-conversation-context.server.ts

messages/vi/ai-conversation.json
messages/en/ai-conversation.json
messages/zh-CN/ai-conversation.json
src/i18n/messages.test.ts
```

## 13. Database boundary

Phase 5 adds **no migration, RLS change, extension or live DB mutation**.

It uses columns already present in the core persistence schema:

```text
ai_conversations.archived_at
ai_conversations.memory_policy
ai_conversations.title
ai_conversations.last_message_at
ai_relationship_states.familiarity_score
ai_conversation_preferences.memory_enabled
```

No Supabase write/test was performed by the implementation agent for this phase.

## 14. Targeted code verification

Run:

```bash
npm run source:check
npm run ui:check
npm run typecheck

npm run test:run -- \
  src/app/api/ai/conversation/route.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-api.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-session.schemas.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-persistence.server.test.ts \
  src/features/hanzihome/ai-conversation/ai-conversation-context.server.test.ts \
  src/i18n/messages.test.ts

npm run lint
npm run format:check
```

If the targeted gate is green, run the repository gate before merge:

```bash
npm run check
```

The implementation agent has **not** run these commands in the repository dependency environment, so this handoff does not claim they pass.

## 15. Manual rendered verification

### Default route

Open `/vi/conversation`.

Expected:

- route canonicalizes to `?conversation=<uuid>`;
- character header is primary;
- no permanent large runtime select row;
- relationship + mode are visible as compact semantic badges;
- message pane owns scrolling;
- composer remains visible below it.

### New conversation

- click New conversation;
- URL id changes;
- stable character remains `小林` in V1;
- new transcript shows the greeting/empty state;
- previous thread remains available in History.

### History

- open History;
- only active conversations appear;
- select an older conversation;
- URL and transcript switch together;
- no transcript from the previous query key flashes/leaks into the selected thread.

### No-memory

- More -> disable `Dùng bộ nhớ dài hạn`;
- `Không dùng bộ nhớ` badge appears;
- reload;
- transcript remains persisted;
- no-memory state remains disabled.

This is intentionally **not** temporary/no-history mode.

### Archive

- archive a non-current conversation from History;
- confirmation must appear after the Sheet closes;
- confirmed row disappears from active History;
- current transcript is unchanged.

Then archive the current conversation:

- confirmation required;
- after success, the app switches to another active conversation or creates a new one;
- no hard-delete wording is shown.

### Runtime

- compact runtime trigger shows checking/ready/unavailable state;
- open it and switch Automatic/specific key;
- recheck remains available;
- Manage API keys still navigates to AI Settings.

### Viewports / interaction

Repeat the main flow at:

```text
1440 × 900
820 × 1180
390 × 844
```

Also verify:

- light + dark mode;
- long transcript;
- keyboard focus order;
- Escape closes Sheet/Dialog/Menu;
- Cmd/Ctrl+Enter sends;
- no horizontal overflow;
- no console `MISSING_MESSAGE` / formatting errors;
- no failed conversation/history requests.

## 16. Known residuals intentionally deferred

- permanent conversation deletion + evidence-aware memory cleanup;
- archived-history restore UI;
- true temporary/no-history retention;
- Memory Manager and user-editable remembered facts;
- global memory setting UX;
- character editor/template model;
- automatic semantic conversation-title generation (blank titles use a localized fallback in Phase 5);
- AI Settings IA/API-key/usage/prompt redesign.

These are not silently implemented in Phase 5.

## 17. Next proposed phase

After this checkpoint passes user review and rendered verification:

```text
Phase 6 — AI Settings IA + Memory Manager
```

Do not start Phase 6 until Phase 5 is reviewed.
