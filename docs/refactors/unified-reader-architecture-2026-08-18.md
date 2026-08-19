# Unified Reader Architecture — 2026-08-18

Branch: `refactor/unified-reader-2026-08-18`

## Goal

Consolidate every Chinese reading experience into one source-agnostic reader system. Textbook lessons, Reader DB documents, HSK passages, Daily Reading, articles, user-authored text and conversation excerpts must share the same reading runtime and reading surface instead of reproducing playback, typography, selection, preferences and responsive behavior per feature.

The Hanzi Studio reading workspace remains the visual/interaction reference. Existing `chines-app` primitives, state ownership, data contracts, scroll ownership and responsive rules remain authoritative.

## Current contract gap

The original implementation had two reader engines with overlapping responsibility:

- `ReaderDocumentStudy` owned the Reader DB document experience and contained playback, pinyin, translation, selection, study tools, outline and study modules.
- `LessonTextInlineEditor` separately owned lesson reading playback, loop, auto-advance, focus and keyboard behavior while lesson text rendering used a different visual composition.

The refactor removes that split. Reader DB resources and textbook text now normalize into the same internal document model and use the same runtime/surface; source-specific editing and persistence remain outside the generic reader.

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

Contextual pinyin remains clickable/keyboard-reachable wherever the canonical Reader surface renders analyzed Hanzi. The compact review surface shows the resolved phrase/glyph, current pinyin, confidence, contextual meaning and per-character reading alternatives. A manual confirmation is authoritative for that sentence instance and must update the displayed reading after persistence.

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

## Migration order and status

### Phase 0 — contract document — complete

This file keeps the refactor scoped and records invariants before and after mutation.

### Phase A — internal model and source adapters — complete

The universal document model has deterministic adapters for current `ReaderDocumentResource`, textbook text, plain Chinese text, article-like paragraph input and conversation turns, with adapter tests.

### Phase B — extract reader runtime ownership — complete

Playback, active position and runtime controls are owned by the scoped Reader runtime. Persisted Reader feature state, annotations and pronunciation overrides live in dedicated hooks rather than the reading component.

### Phase C — canonical `ReaderSurface` — complete

The continuous document surface now owns one command bar, responsive tools, outline, learner typography, focus, selection and contextual pronunciation interactions.

### Phase D — migrate current Reader consumers — complete

HSK, Daily Reading, core/reinforcement/mock/personal/humanities Reader sources use `ReaderDocumentResource -> ReaderDocumentModel -> ReaderSurface`. HSK/Reader-owned workspaces retain capability-driven study tabs; Daily keeps its own outer study tabs.

### Phase E — migrate textbook lesson reading — complete

Textbook Bài khóa text sections use the same Reader surface/runtime while lesson editing paths remain lesson-owned.

### Phase F — generic-source proof — complete

Article, plain-text and conversation fixtures prove future paste/chat integrations require only an adapter/composition and do not need a fake Reader DB record.

### Phase G — cleanup — complete in source

- duplicate lesson playback/keyboard code removed;
- duplicate Reader monolith playback/selection/study rendering removed;
- superseded Reader session navigation/playback state removed;
- `ReaderSurface` split into command bar, document content, outline and pinyin-review components;
- selection and pronunciation-review mutations have separate owners;
- segment rows are memoized and subscribe to segment-scoped playback/active state;
- pronunciation analysis is cached per paragraph signature so one override does not recompute unrelated paragraphs.

Rendered product verification and the final repository check remain external verification gates before merge; they are not treated as completed merely because source cleanup is complete.

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

The source refactor is complete when:

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
