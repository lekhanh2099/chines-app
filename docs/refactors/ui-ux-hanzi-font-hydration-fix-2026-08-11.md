# Hanzi font consistency and review hydration fix — 2026-08-11

Branch: `refactor/ui-system-ux-architecture`

This pass responds to direct visual/runtime feedback from the vocab workspace and active-review surfaces.

## 1. Review hydration error

Observed runtime error:

```text
In HTML, <button> cannot be a descendant of <button>.
```

The unrevealed review card used `ActionCard` as a whole-card `<button>` while `VocabReviewFront` rendered `MandarinSpeakButton` inside it. That created invalid interactive nesting and a React hydration warning.

Remediation:

- the reveal target and TTS control are now sibling interactive layers;
- the full-card reveal button remains the background action target;
- visual review content is non-interactive except explicitly re-enabled independent controls such as TTS;
- the revealed state remains a normal Card with its own explicit actions;
- added `StudyReviewCard.test.tsx` to guard sibling button structure and Hanzi typography presence.

## 2. Reader-font ownership

The selected reader font previously affected lesson reader content but several other Hanzi surfaces bypassed it.

Root causes included:

- `VocabList` constructing a synthetic display mode with `hanziFont: "system"`;
- vocab detail forcing a separate Xingkai-style preview through `PopularFontPreview`;
- radical surfaces forcing Songti through `HanziFontPreview`;
- review/grammar examples rendering Chinese through generic instruction Typography;
- generic `font-hanzi` consumers having no live bridge from the saved reader preference;
- the global vocab inspector maintaining a separate local font selector.

Remediation:

- added `HanziTypographyPreferenceBridge` at the authenticated app composition boundary;
- the bridge reads the existing authoritative `hanzihome / learning-state` TanStack Query cache and maps `lessonTextDisplayMode.hanziFont` onto the shared `--font-hanzi` CSS variable;
- tagged `lang="zh-CN"` content inherits the same font preference by default;
- `HanziText`, `LearnerHanziText` and existing `font-hanzi` consumers therefore update with the saved setting;
- `HanziAwareText` and `HanziInlineText` were added for mixed Vietnamese/Chinese strings so only Han-script segments receive the reader font;
- Markdown inline rendering now applies the same Han-script segmentation;
- removed content-time forced Songti/Xingkai overrides from vocab and radical screens;
- removed the inspector-local Hanzi font selector so inspector content follows the same global learner preference;
- `HanziFontPreview` remains only for actual font-selection previews.

## 3. Updated consumers

The pass covers the visual paths involved in the screenshots and adjacent shared learner surfaces:

- vocab picker chips;
- vocab detail hero and writing-character selectors;
- active vocab review prompt/example;
- grammar review prompt;
- review detail Chinese examples through the shared learner typography contract;
- structured grammar titles, core lines, formulas, examples and notes;
- grammar Markdown inline content;
- radical browse/detail glyphs, variants and related components;
- global vocabulary inspector words, characters, examples and relation lists;
- generic authenticated `lang="zh-CN"` and `font-hanzi` consumers.

Hanzi Writer is intentionally excluded from font substitution. Its displayed stroke glyph is generated from stroke-vector data rather than a CSS font; font settings apply only to textual fallback/UI labels around it.

## 4. Cross-platform font note

The previous Kaiti portability limitation still applies: devices that do not ship a local Kaiti face fall back to the bundled Simplified-Chinese-capable Noto Serif stack. This pass makes all learner text use the same selected/fallback contract; it does not ship a licensed exact Kaiti web-font asset.

## 5. Agent contract

Updated `.agents/skills/frontend-ui-system/SKILL.md` to v3.4:

- selected Hanzi reader font is authoritative across authenticated learner surfaces;
- pure Hanzi uses Hanzi learner primitives;
- mixed-language strings use Hanzi-aware segmentation;
- `HanziFontPreview` is preview-only;
- local feature font selectors must not silently diverge from the global preference;
- whole-card actions must not wrap independent interactive descendants.

## 6. Verification status

The source paths responsible for the reported hydration error and visible font mismatch were changed directly. A browser refresh on the user's authenticated local environment remains the visual proof for the exact chosen font face and device-specific fallback rendering.
