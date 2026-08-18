# AI Conversation Phase 6 — Final Settings Closure

Status: source implementation complete; local runtime/full-gate verification pending
Branch: `feat/persistent-social-memory-ai-redesign`
Depends on: Phase 6A BFF contract + Phase 6B Settings/Memory Manager UI

## Final information architecture

The AI settings tab now follows the product hierarchy established in the feature plan:

```text
Conversation & memory
  Overview
  Conversation defaults
  Memory & relationship
  Memory Manager

Model & provider
  Detailed system model
  Quick system runtime
  Personal API keys

Usage

Advanced
  Lookup prompts
```

Conversation/memory controls remain first. Provider/runtime configuration is secondary and advanced prompt editors are collapsed by default.

## Phase 6C changes

### API key management

The permanent settings page no longer contains:

- the free-tier tutorial block;
- provider education cards;
- dashboard-style API-key statistics.

Education remains inside the Add API Key dialog, where it is needed for the setup task.

Configured keys now render as compact operational rows:

```text
label + provider + state + masked key + verified time
model selector
overflow actions
```

Overflow actions own move-up, pause/resume and delete. Delete still requires a confirmation Dialog.

### Usage

Usage renders only telemetry that actually exists.

Always available when tracked:

- successful request count;
- last-used time;
- runtime/provider/model rows.

Token fields are rendered only when normalized token telemetry is present. A runtime without token telemetry displays only its request count and never renders a dash placeholder as a fake token value.

Usage remains browser-local and is not presented as billing/cost telemetry.

### Advanced prompts

Lookup prompt editors are now inside a collapsed Advanced surface. Prompt dirty/synced state remains visible while collapsed.

Model and prompt persistence are intentionally separated at the UI command level even though the existing BFF stores the three values together:

- Save model sends the last persisted prompt values plus the model draft;
- Save prompts sends the prompt drafts plus the last persisted model;
- saving one section therefore does not silently commit a hidden draft from the other section.

The existing browser fallback behavior remains available if the remote prompt settings endpoint cannot be reached.

## i18n

A dedicated `AiLookupSettings` namespace was added for:

- model/provider section copy;
- model dirty/synced/reset/save states;
- API-key overflow accessible names;
- Advanced open/close copy.

Supported locales:

```text
vi
en
zh-CN
```

`AiUsage` also gained a request-only runtime message so token placeholders are unnecessary.

## Files changed in Phase 6C

```text
src/features/settings/SettingsPageContent.tsx
src/features/settings/AiConversationUsageSettings.tsx
src/components/settings/ApiKeyManagerSection.tsx
src/i18n/messages.ts
src/i18n/messages.test.ts
messages/vi/ai-lookup-settings.json
messages/en/ai-lookup-settings.json
messages/zh-CN/ai-lookup-settings.json
messages/vi/ai-usage.json
messages/en/ai-usage.json
messages/zh-CN/ai-usage.json
```

No Phase 6C database migration, RLS change, dependency change or production-data mutation exists.

## Final feature acceptance to run locally

Targeted checks first:

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

Then, because the feature spans persistence, API, memory retrieval, conversation UI and Settings IA, run the full repository gate before merge/release:

```bash
npm run check
```

## Manual final matrix

### Settings

1. `/settings?section=ai` opens with Conversation & memory first.
2. Account conversation defaults persist after refresh.
3. Account memory toggle persists after refresh.
4. Memory Manager loads memories only after it opens.
5. All / Global / With character / Open loops filters work.
6. Edit changes displayed memory content.
7. Mark done removes an active open loop.
8. Forget requires confirmation before deletion.
9. Model changes can be saved without committing hidden prompt drafts.
10. Prompt changes can be saved without committing a hidden model draft.
11. Advanced starts collapsed and preserves dirty/synced visibility.
12. API-key setup education appears in Add Key dialog, not permanently on the page.
13. Configured API keys use compact rows and overflow actions.
14. Usage with no token telemetry has no input/output/total-token fields and no dash token placeholders.
15. Usage with token telemetry renders real token fields.

### Conversation + memory regression

1. Existing conversation reload preserves transcript and per-thread settings.
2. New conversation inherits account defaults.
3. Memory-enabled conversation can recall relevant long-term memory.
4. No-memory conversation does not read/write long-term memory.
5. Explicit forget prevents later recall.
6. Character-specific memory does not leak outside its character scope.
7. Archive/history/new-conversation flows remain functional.

### Visual/interaction matrix

Render and interact at:

```text
1440 x 900
~820 x 1180
~390 x 844
light + dark
```

Verify keyboard/focus for:

- Tabs;
- Selects;
- Switch;
- API-key overflow menu;
- Add API Key dialog;
- Memory Manager dialog;
- edit/forget confirmation states;
- Advanced disclosure.

Also inspect console warnings/errors and failed/canceled network requests.

## Closure boundary

At this point there is no additional planned feature phase for persistent social-memory AI.

Remaining work is verification/fix-only:

```text
local targeted checks
-> manual responsive/state verification
-> npm run check
-> fix any regressions found
-> merge when explicitly approved
```

Do not add new memory semantics, schema, billing telemetry, character systems or unrelated settings work under the Phase 6 closure.
