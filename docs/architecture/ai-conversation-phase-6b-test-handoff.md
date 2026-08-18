# AI Conversation Phase 6B — Settings IA + Memory Manager Handoff

Status: source checkpoint complete; runtime/UI verification pending
Branch: `feat/persistent-social-memory-ai-redesign`
Depends on: Phase 6A account-preference + memory-manager BFF contract

## Scope completed

Phase 6B adds the user-facing owner for persistent conversation defaults and long-term memory controls without changing database schema, RLS, retrieval scoring, or conversation persistence semantics.

The AI settings tab now starts with the persistent conversation surface instead of model/provider controls:

```text
Conversation & memory
  Overview
  Conversation defaults
  Memory & relationship
    account memory toggle
    relationship summary
    Memory Manager
```

The existing lookup/model/provider/usage/prompt settings remain below this new surface and are intentionally left for Phase 6C cleanup.

## State ownership

```text
/settings?section=ai
  -> AiConversationSettingsSection
      -> TanStack Query: settings overview
      -> TanStack Mutation: account defaults
      -> local transient state: Memory Manager open
      -> AiConversationMemoryManagerDialog
          -> local transient state: filter/action view
          -> lazy TanStack Query: active memories only while manager is opened
          -> TanStack Mutation: edit / resolve / forget
```

Persisted settings and memory lists are never copied into React state for rendering. Account defaults are optimistically updated in the Query cache and rolled back on mutation failure.

## Conversation defaults

The following account defaults are now directly editable:

- default conversation mode;
- learner level;
- default correction style;
- default reply mode;
- account long-term-memory enabled state.

These settings affect newly created conversations. Existing conversation-specific settings remain authoritative for already-created threads.

## Memory Manager

Memory data remains lazy and is not fetched with the initial AI settings overview.

Filters:

```text
All
Global
With current character
Open loops
```

Rows expose only learner-facing fields:

- natural-language memory content;
- semantic kind;
- global/current-character scope;
- last-updated date.

They do not expose:

- importance;
- confidence;
- memory key;
- reinforcement count;
- embedding/model/version;
- raw familiarity score.

Actions:

```text
Edit
Mark done   (open_loop only)
Forget      (confirmation required)
```

Edit remains inside the single Memory Manager modal task and sends only the edited content. The Phase 6A server owner clears stale embedding metadata after a successful edit.

Forget switches the same modal task into an explicit destructive-confirmation state. It does not silently delete from a menu click.

## Relationship presentation

The UI derives only the established semantic relationship band:

```text
new
familiar
friends
close
```

The raw familiarity score is not displayed.

## i18n

A dedicated `AiConversationSettings` namespace was added for all supported application locales:

```text
messages/vi/ai-conversation-settings.json
messages/en/ai-conversation-settings.json
messages/zh-CN/ai-conversation-settings.json
```

`src/i18n/messages.test.ts` now also locks the Memory Manager interpolation/message contract.

## Files added / changed

```text
src/features/settings/AiConversationSettingsSection.tsx
src/features/settings/AiConversationMemoryManagerDialog.tsx
src/features/settings/SettingsPageContent.tsx
src/i18n/messages.ts
src/i18n/messages.test.ts
messages/vi/ai-conversation-settings.json
messages/en/ai-conversation-settings.json
messages/zh-CN/ai-conversation-settings.json
```

No Supabase migration or RLS file is part of Phase 6B.

## Targeted verification for the developer

```bash
npm run source:check
npm run ui:check
npm run typecheck

npm run test:run -- \
  src/features/settings/ai-conversation-settings-persistence.server.test.ts \
  src/features/settings/ai-conversation-settings.client.test.ts \
  src/app/api/settings/ai-conversation/route.test.ts \
  src/i18n/messages.test.ts

npm run lint
npm run format:check
```

## Manual acceptance

Open `/settings?section=ai` and verify:

1. Conversation & memory is the first AI settings surface.
2. Change each conversation default, refresh, and confirm it persists.
3. Toggle account long-term memory, refresh, and confirm it persists.
4. Open Memory Manager; memory network request should occur only after opening it.
5. Verify All / Global / With current character / Open loops filters.
6. Edit a memory and confirm the displayed content updates.
7. Mark an open loop done and confirm it disappears from the active list.
8. Choose Forget and confirm no deletion occurs until the destructive confirmation is accepted.
9. Confirm memory rows never expose scores, raw keys, vectors, or embedding metadata.
10. Confirm Vietnamese, English, and Simplified Chinese settings do not render raw i18n keys.

Responsive/UI matrix when available:

```text
1440 x 900
~820 x 1180
~390 x 844
light + dark
keyboard + touch
loading + empty + error + many-memory states
```

## Residual / next slice

Phase 6C remains intentionally open:

- move API-key education fully into Add Key dialog;
- remove permanent API-key tutorial/stat dashboard from the settings page;
- compact operational API-key rows;
- omit token fields entirely when usage telemetry is absent;
- move prompt editors under Advanced while preserving current save/reset/dirty behavior.

Do not expand Phase 6C into new DB schema, usage billing persistence, or new memory semantics.
