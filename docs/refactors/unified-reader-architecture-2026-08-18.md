# Unified Reader Architecture — 2026-08-18

## Status

Implementation source is complete for the unified Reader migration and the follow-up pronunciation/performance pass. The branch still requires final local `npm run check` plus rendered desktop/iPad/mobile verification before merge.

## Product invariant

HanziHome has one Chinese reading experience. Textbook Bài khóa, Reader resources, HSK, Daily Reading, personal learning and future article/conversation/plain-text sources must compose the same Reader surface instead of re-implementing typography, playback, outline, pronunciation, selection or reading preferences.

Source-specific code may adapt data and add domain actions, but must not create a second reading engine.

## Canonical flow

```text
source data
  -> source adapter
  -> ReaderDocumentModel
  -> ReaderRuntimeProvider
  -> ReaderSurface
       -> ReaderCommandBar
       -> ReaderDocumentContent
       -> ReaderOutline
       -> Reader pronunciation review
       -> source-owned render hooks where required
```

`ReaderDocumentModel` is deliberately smaller than Reader resource persistence. It contains only the content and capabilities needed to render/read a document. Reader resource rows, textbook sections and future external content remain owned by their source modules.

## Source adapters

The unified engine currently has adapters for:

- Reader resources
- textbook lesson text
- article-like content
- plain text
- conversations/dialogue turns

Adapters normalize source metadata into `ReaderDocumentModel`; the generic surface must not branch on source-specific database fields.

## Runtime ownership

`ReaderRuntimeProvider` owns ephemeral reading state:

- active segment/index
- position source
- playback status/progress
- continuous TTS
- playback rate
- loop current segment
- auto advance
- focus mode
- completion callback

High-frequency playback progress is stored in the scoped Reader runtime store. Consumers subscribe with selectors so playback ticks do not re-render unrelated Reader modules.

The old Reader session playback/navigation fields are superseded. `reader-session.ts` now exists only for persistence/autosave helpers and feature-state utilities.

## Reader content ownership

`ReaderDocumentContent` renders the canonical continuous reading body and keeps segment rows memoized. Each row subscribes only to the runtime state it needs.

The generic content layer owns:

- learner Hanzi/Pinyin/translation typography
- continuous segment layout
- active-segment indication
- pronunciation click targets
- text selection capture
- playback character highlighting

Source modules may wrap sections/segments through render hooks but must preserve the canonical text content and interaction contract.

## Pronunciation contract

Contextual pinyin is a proposal, not an unquestioned answer.

Every contextual Hanzi glyph remains inspectable. The pronunciation review surface shows:

- the reviewed word/phrase
- current contextual reading
- confidence state
- Vietnamese meaning when available, with an explicit fallback when unavailable
- alternatives per Hanzi
- a manual confirmation action when the source has persistence ownership
- a full-analysis handoff to the vocabulary inspector

Polyphonic output without a manual override intentionally receives lower confidence. A saved sentence-instance override becomes the displayed lexical and spoken reading for that instance.

Reader-owned/Daily/Personal resources persist pronunciation through the existing pronunciation override API. Generic lesson/plain/article/conversation surfaces may inspect pronunciation and open full analysis without pretending that a confirmation was persisted.

Pronunciation analysis must remain paragraph-local: overrides are grouped by paragraph, dictionary inputs use stable signatures and unchanged paragraph analysis is reused so confirming one pronunciation does not recompute the whole document.

### Pronunciation popover UI contract

`BasePopoverPopup` intentionally does not accept ad-hoc `className` overrides. Feature surfaces must use a named popup variant so the primitive keeps ownership of background, border, shadow, viewport bounds and scrolling behavior.

The pronunciation review uses the shared `lookupWide` variant. Do not reintroduce a feature-level width `className`: because popup props are spread after primitive styling, an accidental runtime `className` would replace the canonical popup surface and can make the review panel appear transparent even if TypeScript also reports the prop as invalid.

Opening full analysis must close the pronunciation review first; do not stack both floating surfaces over the reading text.

## Reader tools

The shared command bar/Reader Tools own:

- previous/current/next playback
- read all
- stop/replay
- playback speed
- loop segment
- auto advance
- shadowing entry
- focus mode
- Pinyin visibility/presentation
- Vietnamese meaning visibility
- font
- text size
- line spacing
- content width
- outline entry on responsive layouts

Reading display preferences remain backed by HanziHome learning settings instead of a Reader-only preference store.

## Sticky navigation invariant

Long reading surfaces must preserve navigation while the user scrolls.

- Reader-owned/HSK workspace study tabs are sticky.
- Daily Reading keeps its own outer study tabs sticky.
- The shared Reader command bar is sticky below the owning tab strip using the appropriate nested offset.
- A source with no parent study tabs uses the page-level command-bar offset.

Do not add independent sticky implementations inside individual Reader sources.

## Textbook Bài khóa

Textbook Bài khóa now adapts lesson text into `ReaderDocumentModel` and renders through the shared Reader surface.

Lesson ownership remains outside the Reader engine:

- editable section cards
- lesson node paths
- edit controls
- lesson-specific sidebar/section navigation

This preserves the lesson authoring contract while eliminating the former duplicate lesson reader implementation.

## Reader resource workspace

`ReaderDocumentStudy` is now orchestration rather than the former monolith. Persistence/state, selection actions, pronunciation review and study modules are separate modules.

Reader resource workspaces may expose capability-driven study tabs such as overview, exercises, vocabulary, translation, dictation, analysis, summary and notes. These are workspace modules around the shared reading surface, not separate reading implementations.

HSK keeps the Reader study tabs. Daily Reading keeps its product-specific outer tabs and composes only the common Reader surface inside its reading tab.

## Performance invariants

Do not move high-frequency TTS state back into React context values consumed by the whole Reader tree.

Do not recompute contextual pronunciation for every paragraph when one override changes. Keep analysis cached by paragraph content/source-pinyin/dictionary/override signature.

Do not let passive scroll tracking overwrite the active segment during TTS playback.

Do not put source-specific database rows into generic Reader rendering components.

Prefer narrow runtime selectors, memoized segment rows and stable callbacks over broad provider-state subscriptions.

## Maintainability invariants

Avoid restoring large all-in-one Reader files. Responsibilities are intentionally split across:

- model/adapters
- runtime store/provider
- command bar/tools
- document content
- outline
- pronunciation review
- selection/pronunciation hooks
- persistence/study state
- study modules

A component exceeding its responsibility boundary should be split by behavior, not merely by line count.

## Verification gate

Before merge, run the repository-required checks and render the critical Reader flows at desktop, iPad/tablet and mobile widths.

At minimum verify:

1. Bài khóa uses the same typography/tools/playback behavior as Reader content while edit wrappers still work.
2. HSK exposes sticky study tabs plus a sticky Reader toolbar without overlap.
3. Daily Reading exposes sticky Daily tabs plus the same Reader toolbar without overlap.
4. Long Reader documents scroll continuously and outline navigation targets the correct nested scroll container.
5. Clicking any contextual pinyin/Hanzi opens pronunciation review; polyphonic content is not presented as automatically confirmed.
6. Saving a pronunciation override updates the displayed reading after refresh/invalidation.
7. Generic lesson/plain/article/conversation pronunciation review does not expose a fake persistence action.
8. Opening full analysis replaces rather than stacks over pronunciation review.
9. Pronunciation review keeps its elevated background/border/shadow and remains viewport-bounded on narrow screens.
10. Playback progress highlights the active character without visibly re-rendering unrelated rows.
11. Loop/auto-advance remain mutually exclusive and passive scroll does not steal playback position.
12. Reader settings persist through the shared learning-settings path.
