# UI theme surface hierarchy follow-up — 2026-08-12

## Trigger

Authenticated HanziHome learning workspace showed inconsistent theming: palette-tinted canvas,
neutral shell chrome, differently tinted Card surfaces, and study surfaces that still referenced
raw `--card`. Theme changes also animated every descendant, making nested blocks appear to
repaint independently.

## Design research

The pass was checked against current first-party design-system guidance:

- Material Design 3: use semantic surface/container roles for the majority of app backgrounds;
  reserve primary/secondary/tertiary container roles for emphasis and hierarchy.
- Microsoft Fluent 2: neutral background layers ground the interface; brand/shared colors are
  intentional accents rather than a replacement for surface hierarchy.
- Apple HIG: dynamic primary/secondary/tertiary background roles communicate hierarchy; semantic
  colors should keep their intended meaning and control backgrounds should not all be colored.

## Root cause

The app had multiple competing surface owners:

```text
page canvas          -> --canvas-background / --bg-primary
Card                 -> --theme-card-background
shell / liquid panel -> --bg-card
study content        -> raw --card
subtle regions       -> --muted / --bg-subtle
active items         -> local color-mix recipe
```

This made one palette look like several independent themes on the same screen.

## Changes

Created `src/app/surface-system.css` as the single semantic surface owner:

```text
surface-canvas
surface-subtle
surface-base
surface-raised
surface-hover
surface-selected
surface-selected-border
```

Existing aliases now resolve through that ladder. HanziHome study/exercise aliases use the same
surface roles instead of raw `--card`.

`theme-palettes.css` now owns palette identity only: canvas seed, primary/accent/ring, Sidebar
emphasis, and chart accent. It no longer owns Card/background aliases.

Card interactive hover now uses `bg-bg-card-hover` rather than jumping to the elevated/Popover
surface.

Theme animation no longer targets every nested element. Descendants switch immediately while major
structural surfaces cross-fade for 140ms; reduced-motion disables this transition.

## Intended visual result

```text
canvas tint
  -> subtle grouped region
  -> base Card/shell/study surface
  -> raised transient overlay
```

Selection uses palette color. Structural borders and ordinary text stay neutral. Semantic status
colors remain independent of the selected palette.

## Verification

`theme-contract.test.ts` now asserts the surface ladder, alias ownership, Card hover role, selected
surface role, and transition/reduced-motion behavior. Full repository CI is run on the branch after
this pass.
