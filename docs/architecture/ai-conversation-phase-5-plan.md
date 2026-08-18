# AI Conversation Phase 5 — Conversation Workspace Redesign Plan

Status: active implementation guardrail
Branch: `feat/persistent-social-memory-ai-redesign`
Depends on: persisted conversation ownership (Phase 2), trusted context (Phase 3), memory-policy contract (Phase 4)

This document is the scope boundary for Phase 5. It exists so the workspace redesign does not expand into Settings/Memory Manager work or unreviewed database changes.

## 1. User goal

Make AI Conversation feel like an ongoing conversation with one stable character instead of an AI configuration panel.

Primary hierarchy:

```text
character + relationship
conversation
composer
secondary runtime / settings controls
```

Primary action: continue talking.

Secondary actions: open history, start a new conversation, change conversation behavior, choose/check runtime, disable long-term memory for this conversation, archive a conversation.

## 2. Current friction verified in source

- provider/model selection occupies a permanent high-priority row above the conversation;
- the message pane uses guessed sizing (`min-h-96` + `max-h-[62dvh]`) instead of inheriting the authenticated shell workspace height;
- no conversation history/navigation surface exists even though conversations are persisted;
- no explicit new-conversation action exists;
- relationship state exists server-side but is not presented in the session/workspace;
- `memory_policy` exists but there is no user-facing per-conversation no-memory control;
- archive ownership exists in `ai_conversations.archived_at` but has no workspace action;
- permanent deletion is not safe to add casually because long-term-memory evidence can span conversations.

## 3. Authoritative owners

```text
active conversation/session -> TanStack Query
conversation history         -> TanStack Query
character                    -> persisted session
relationship                 -> persisted session
conversation mode            -> ai_conversations.mode
memory behavior              -> ai_conversations.memory_policy
runtime choice               -> existing browser runtime-key preference
settings-dialog draft        -> TanStack Form
sheet/menu/dialog open state -> local React state
message draft/retry          -> existing local transient state
```

No server/query value may be mirrored into local state merely for rendering.

## 4. Data required above the fold

Required:

- active conversation;
- stable character presentation;
- relationship presentation;
- persisted transcript;
- learner level;
- runtime health/status.

Loaded after interaction:

- conversation-history list when the history Sheet is opened;
- API-key list/runtime chooser remains existing client-managed support data.

Must not load for the default chat surface:

- full long-term-memory list;
- memory provenance/evidence;
- archived conversation transcript;
- Settings prompt editors/usage dashboard data.

## 5. Phase 5 server/API scope

Use the existing schema. No migration/RLS/extension change in Phase 5.

Add authenticated server-owned contracts for:

```text
list active conversations
load one owned active conversation
create a new conversation for the default character
update one conversation memory policy
archive one owned conversation
```

History list is bounded and summary-only. It must not fetch every transcript.

Session response becomes additively capable of returning compact relationship state for the current character. The UI derives a semantic relationship label; raw familiarity numbers are never rendered.

### Permanent delete boundary

Do **not** implement hard delete in this phase.

Reason: deleting a conversation cascades message/evidence rows while canonical memories may have evidence from multiple conversations. Correct permanent deletion needs one transactional policy for evidence removal and unsupported memories. Adding a destructive multi-step browser/BFF sequence would violate the repository persistence contract.

Phase 5 exposes **Archive conversation** as the recoverable removal action. Permanent deletion remains a separately approved persistence task.

## 6. Memory / temporary semantics

Phase 5 may expose:

```text
Use memory       -> memory_policy = inherit
Do not use memory -> memory_policy = disabled
```

The UI label must describe this as **Do not use memory / Không dùng bộ nhớ**.

Do not call it Temporary Chat because transcript retention remains enabled. A true temporary/no-history mode is out of scope until retention/expiry/cleanup is implemented explicitly.

## 7. Conversation history UX

History is a modal `Sheet`, not a permanent third column, because the global Sidebar already owns global navigation.

History Sheet contains:

- New conversation command;
- bounded list of active conversations;
- current selection state;
- title/fallback label, mode and last activity metadata;
- archive action through a confirmation Dialog.

Selecting a conversation loads that persisted session and closes the Sheet.

No archived-history browser or restore flow in Phase 5; archive recovery can be surfaced later when the complete lifecycle is designed.

## 8. Conversation workspace UX

### Header

Show:

- avatar;
- character name;
- semantic relationship label (`Mới quen / Quen nhau / Bạn bè / Thân thiết`);
- current conversation mode;
- compact history/new-conversation/actions controls.

Do not show raw familiarity scores.

### Runtime

Remove the permanent large runtime Select row.

Represent runtime as compact secondary status. Runtime selection/check/manage-key actions live behind one compact menu/control.

### Message pane

The route and workspace inherit shell height with `h-full min-h-0`.

The message pane is the explicit nested scrolling workspace:

```text
workspace shell (no route-level guessed height)
  header
  message pane -> min-h-0 flex-1 overflow-y-auto
  error/status
  composer
```

No `calc(100dvh - ...)`, `min-h-96`, or `max-h-[62dvh]`.

### Composer

Composer remains visible at the bottom of the contained workspace. Preserve Cmd/Ctrl+Enter, retry idempotency, disabled/runtime-error states and accessible send label.

## 9. Responsive / touch behavior

Required target viewports:

```text
Desktop 1440 × 900
iPad portrait ~820 × 1180
Mobile ~390 × 844
```

- history is one modal Sheet on desktop/tablet/mobile;
- no permanent extra rail on iPad/mobile;
- header actions may become icon-only with accessible names when width is constrained;
- 44px standalone touch targets on phone/tablet;
- no horizontal overflow;
- message bubbles keep readable measure;
- composer remains usable above mobile navigation/safe area through inherited shell ownership.

## 10. Existing primitives / patterns

Use:

- `Avatar`
- `Badge`
- `Button`
- `Card`
- `Dialog`
- `DropdownMenu`
- `Sheet`
- `Textarea`
- `Typography`
- existing TanStack Form adapter

Do not create alternate primitives or import Radix/Base directly from the feature.

## 11. Intentional non-goals

Phase 5 does not implement:

- Memory Manager/edit/forget UI;
- global memory toggle/settings IA;
- character editor/template system;
- permanent conversation deletion;
- archived-history recovery UI;
- true temporary/no-history retention;
- usage telemetry redesign;
- API-key Settings redesign;
- prompt-editor redesign;
- database migrations/RLS/extension changes;
- unrelated HanziHome navigation/shell refactors.

Those belong to Phase 6 or a separately confirmed persistence task.

## 12. Acceptance criteria

### Persistence/navigation

- reload keeps active persisted transcript;
- open history lists only the authenticated user's active conversations;
- create conversation starts a new empty thread while keeping the same stable character;
- selecting history switches transcript without client-supplied authoritative history;
- archive requires confirmation, archives only the owned conversation and moves to another/new conversation;
- switching conversation does not leak transcript state between query keys.

### Relationship/mode/memory

- relationship label is derived from persisted relationship score and never shows the raw score;
- changing mode still does not change character identity;
- `Không dùng bộ nhớ` persists through reload;
- disabling memory does not claim transcript is temporary/deleted.

### Runtime / layout

- provider/model is secondary, not a permanent dominant row;
- runtime selection and health recheck remain available;
- message workspace uses inherited shell height and one bounded message scroller;
- no guessed viewport subtraction or `max-h-[62dvh]` remains.

### States/accessibility

- loading, empty, error, sending and archive-pending states are explicit;
- history/menu/dialog keyboard behavior is primitive-owned;
- icon-only controls have accessible names;
- no nested interactive controls;
- no horizontal overflow at target viewports.

## 13. Verification ladder

Targeted source/tests:

```text
conversation session/history schemas
persistence ownership/list/create/archive/memory-policy tests
route action tests
client transport tests
i18n key parity
```

Then:

```bash
npm run source:check
npm run typecheck
npm run lint
npm run format:check
```

Before Phase 5 is called visually complete, render/interact with:

```text
1440 × 900
820 × 1180
390 × 844
```

and verify default/loading/empty/error/long conversation/history/archive/dialog/runtime-menu/dark-mode states.

If the implementation environment cannot render the app, report those states as unverified instead of claiming visual completion.

## 14. Stop gate

Stop after the conversation workspace + history/new/archive/no-memory/runtime-secondary flow is implemented and report the checkpoint.

Do not begin Phase 6 Settings/Memory Manager work until the user reviews this Phase 5 handoff.
