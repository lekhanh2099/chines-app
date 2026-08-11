# UI/UX visual follow-up — 2026-08-11

Branch: `refactor/ui-system-ux-architecture`

This follow-up closes issues found from direct visual review after the first system-refactor pass. It intentionally focuses on product UI/UX rather than CI status.

## Home dashboard

- Rebalanced the desktop Home layout into a primary work column plus a learning-attention rail.
- Removed the artificial max-width inside the continue-learning area that created a large unused middle region on wide screens.
- Kept Home task-oriented rather than rebuilding the sidebar as shortcut cards.
- Added a derived learning pulse from the existing authoritative learning state:
  - items currently learning or marked hard;
  - known items;
  - reviews completed today;
  - bookmarks;
  - tracked-item context.
- Kept the SRS entry contextual to the learning pulse instead of adding generic navigation tiles.
- Moved the contextual memory tip into the attention rail and kept recent notes in the primary work column.
- Updated the Home loading skeleton to match the new information architecture.

## Dropdown and submenu interaction

- Replaced the fake drill-in/back-stack behavior in reading quick settings with native `DropdownMenuSub` composition.
- Font, size, reveal mode and visibility are now explicit submenu categories with chevron affordances and immediate subactions.
- Font submenu keeps real Hanzi font previews.
- Replaced the manual view-mode page inside the lesson Tools menu with a native submenu.
- Direct one-step commands such as split-screen and editing actions remain direct menu items; only grouped choices become submenus.

## Full reading settings

- Reworked reading settings from several full-width boxed option groups into one control surface with separators and a dedicated preview surface.
- Font remains a visual choice grid.
- Font size and reveal mode use the canonical `SegmentedControl`.
- Pinyin, meaning and answer visibility use canonical `Switch` rows with explanatory copy.
- Added a live preview using the same reader typography and progressive-reveal behavior as lesson content.
- The preview demonstrates:
  - selected Hanzi font;
  - selected Hanzi size;
  - always-visible versus tap-to-reveal behavior;
  - Pinyin and Vietnamese meaning visibility;
  - exercise answer visibility.
- On wide screens the preview sits beside controls; on narrow screens it follows controls in document flow.

## Design-system guidance

Updated `.agents/skills/frontend-ui-system/SKILL.md` to v3.2 with explicit rules:

- grouped choices in a DropdownMenu use native submenus;
- do not simulate submenu navigation by replacing root content and adding a manual Back row;
- submenu triggers may expose current values;
- Home must use wide-screen space for meaningful learning state instead of decorative blank space or duplicate navigation;
- full reading settings require a live content preview.

## State ownership

No new mirrored state was introduced.

- Home pulse is derived from `useLearningState()` state and recent-note Query data.
- Reader settings continue to write only through `useLearningState().updateSettings`.
- Dropdown submenus rely on Radix menu state rather than feature-owned menu-page state.
