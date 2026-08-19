# Unified Reader Architecture — 2026-08-18

Branch: `refactor/unified-reader-2026-08-18`

## Goal

Consolidate every Chinese reading experience into one source-agnostic reader system. Textbook lessons, Reader DB documents, HSK passages, Daily Reading, articles, user-authored text and conversation excerpts must share the same reading runtime and reading surface instead of reproducing playback, typography, selection, preferences and responsive behavior per feature.

The Hanzi Studio reading workspace remains the visual/interaction reference. Existing `chines-app` primitives, state ownership, data contracts, scroll ownership and responsive rules remain authoritative.

## Current contract gap

There are currently two reader implementations with overlapping responsibility:

- `ReaderDocumentStudy` owns the Reader DB document experience and already contains playback, pinyin, translation, selection, study tools, outline and study modules.
- `LessonTextInlineEditor` separately owns lesson reading playback, loop, auto-advance, focus and keyboard behavior while lesson text rendering uses a different visual composition.

This duplication makes UI/function behavior drift and prevents future sources such as temporary text or conversation content from entering the reader without pretending to be a persisted Reader DB document.

## Target dependency flow

```text
source data
  -> source adapter
  -> ReaderDocumentModel
  -> reader runtime
  -> ReaderSurface
  -> optional study modules
```

`ReaderSurface` must not know whether a document came from Supabase Reader tables, a lesson schema, an article, clipboard text or chat. Source-specific editing/persistence stays outside the reader model.

## Architecture invariants

1. `ReaderDocumentModel` is an internal TypeScript view model, not a database schema.
2. Zod stays at actual runtime trust boundaries; the reader view model does not add a second validation layer for already-normalized internal data.
3. Source adapters normalize ordering and optional content once.
4. Content capabilities are derived from available content, not hard-coded tabs.
5. Playback/position/selection/preferences each have one authoritative owner.
6. The document is rendered continuously; active segment is a position/playback state, not the only segment mounted.
7. Reader typography uses the existing learner typography owners.
8. Reading preferences are shared across all reading sources through the existing HanziHome learning-settings owner rather than source-local preference state.
9. Desktop may use contextual menus; phone and iPad touch use one modal Sheet for reader tools.
10. `AppScrollViewport` remains the route-level scroll owner.
11. Lesson editing remains lesson-owned and is exposed to the reader as an optional extension, never embedded in the universal document model.
12. No database, RLS, auth or public API migration is required for this refactor.
13. Generated/contextual pinyin is evidence, not truth: polyphonic output must expose review affordances, confidence and alternatives; persisted Reader sources may store sentence-instance confirmation overrides.
14. Saving one pronunciation override must not recompute unrelated paragraphs; pronunciation analysis is cached per segment and Reader rows subscribe only to their own active/playback state.
15. Study tabs and the Reader command bar remain visible while scrolling long reading content; nested surfaces use explicit sticky offsets rather than duplicating toolbars.

## Universal document model

The model represents reading semantics only:

```text
ReaderDocumentModel
  id
  language
  source
  title / titlePinyin / titleVi
  sections[]
  segments[]
  metadata[]
  capabilities[]

ReaderSegment
  id
  kind
  sectionId?
  zh
  pinyin?
  vi?
  role?
  speaker?
  speechText?
```

A stable selection anchor is expressed separately as:

```text
documentId + segmentId + startOffset + endOffset
```

This works for textbook blocks, articles and dialogue turns without leaking source-specific paths into reader UI.

## Reader surface anatomy

Wide desktop:

```text
Reader command bar
  -> previous / playback / next / speed / study tools

Reading document                         Context rail
  -> all segments remain mounted         -> outline/current position
  -> active segment is emphasized        -> useful source metadata
  -> pinyin/translation follow prefs
```

Phone/iPad:

```text
Reading document
compact command bar
reader tools -> one bottom Sheet
outline -> Sheet when needed
```

The command bar exposes high-frequency playback actions. Loop, auto-advance, shadowing, focus, pinyin, translation and layout controls use progressive disclosure under Reader Tools.

## Pinyin review contract

Contextual pinyin remains clickable/keyboard-reachable wherever the canonical Reader surface renders analyzed Hanzi. The compact review surface shows the resolved phrase/glyph, current pinyin, confidence, optional contextual meaning and per-character reading alternatives. A manual confirmation is authoritative for that sentence instance and must update the displayed reading after persistence.

For ephemeral/plain/lesson sources without a pronunciation persistence port, the same surface remains inspectable and links to full analysis, but does not pretend a local choice has been persisted.

## Capability model

Core reading is always available when at least one Chinese segment exists. Optional study modules appear only when the normalized document supports them:

- pinyin
- translation
- vocabulary
- exercises
- analysis
- summary

Interaction capabilities such as TTS, annotations and editing belong to runtime integrations, not content data.

## Migration order

### Phase 0 — contract document

This file. Keep the refactor scoped and record invariants before mutation.

### Phase A — internal model and source adapters

Add the universal document model and deterministic adapters for:

- current `ReaderDocumentResource`;
- plain Chinese text;
- article-like paragraph input;
- conversation turns.

Add unit tests proving ordering, optional content and capabilities.

### Phase B — extract reader runtime ownership

Split playback, active position, selection and persistence orchestration out of `ReaderDocumentStudy` while preserving its current behavior.

### Phase C — canonical `ReaderSurface`

Implement the continuous-document reading layout using the current Hanzi Studio workspace as the visual baseline:

- all segments mounted;
- one command bar;
- one responsive tools surface;
- active-position outline;
- existing learner typography;
- shared reading preferences;
- focus mode;
- selection actions.

### Phase D — migrate current Reader consumers

HSK, Daily Reading, core/reinforcement/mock/personal/humanities Reader sources use the same surface through `ReaderDocumentResource -> ReaderDocumentModel`.

### Phase E — migrate textbook lesson reading

Add a lesson adapter and replace the lesson-local reading runtime with the shared reader runtime/surface. Keep lesson editing and lesson section ownership in the lesson feature.

### Phase F — generic-source proof

Keep deterministic fixtures for article, plain text and conversation input so future paste/chat integrations require an adapter/composition only, not another reader implementation.

### Phase G — cleanup

Only after all consumers migrate:

- remove duplicate lesson playback/keyboard code;
- remove duplicate reader preference state;
- remove obsolete reading renderer/CSS;
- remove the superseded Reader session playback/navigation state after the scoped runtime owns it;
- split the Reader surface into command bar, document content, outline and interaction modules so high-frequency state does not invalidate the whole document;
- keep compatibility wrappers only where they still provide a stable public composition.

## Performance rules

- High-frequency TTS progress must not force the whole long document and outline to re-render.
- Pronunciation analysis is segment-cached; one changed override re-analyzes that segment while unchanged segment analysis objects remain referentially stable.
- Reader document/segment/outline components subscribe to the smallest scoped TanStack Store state needed for their render.
- Pronunciation dictionary and overrides are grouped/signatured once per document update rather than re-filtered inside every segment render.
- Do not virtualize normal reading documents preemptively because selection, browser find, annotations and accessibility benefit from stable DOM text.
- Profile before introducing virtualization for genuinely huge conversation histories.

## Verification

Use the repository UI verification contract.

Minimum viewports:

- 390 x 844 phone;
- 820 x 1180 iPad portrait;
- 1440 x 900 desktop.

Relevant states:

- default;
- playing / paused;
- focus mode;
- pinyin off/on;
- translation off/on;
- reader tools open;
- pronunciation review open / confirmed / reset;
- text selection;
- long paragraph and long document;
- sticky tabs + toolbar during long scroll;
- loading / empty / error where owned by the wrapper;
- light/dark where theme-sensitive.

Repository checks for the completed multi-surface refactor:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run ui:check
npm run source:check
npm run check
```

Do not claim a rendered/UI state as verified when it was only source-inspected.

## Completion criteria

The refactor is complete only when:

1. equivalent Chinese segments render through the same reader typography/surface regardless of source;
2. font/size/pinyin/translation preferences have one owner;
3. playback/loop/auto-advance have one implementation;
4. selection/lookup/notes use one reader interaction path;
5. contextual pinyin exposes confidence/alternatives and manual confirmation updates the rendered reading for persisted Reader sources;
6. reader UI does not depend on Reader DB row shapes;
7. source adapters do not depend on reader UI;
8. temporary plain text or conversation can render without creating a fake Reader DB record;
9. optional modules disappear when their content does not exist;
10. HSK/Reader-owned study tabs and Daily outer tabs retain canonical sticky behavior with one shared Reader toolbar;
11. phone/iPad reader tools follow the modal Sheet contract;
12. long documents do not re-run all pronunciation analysis or re-render all segment rows for one playback/override update;
13. no database/auth/RLS migration was introduced solely to unify reading UI.
