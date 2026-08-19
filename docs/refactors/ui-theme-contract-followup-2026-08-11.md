# UI theme contract follow-up — 2026-08-11

Branch: `refactor/ui-system-ux-architecture`

## Trigger

The Settings appearance screen showed the selected Plum palette tinting the
whole application canvas. The same pass was also used to close the remaining
machine-reported UI primitive ownership violations from the deep refactor.

## Root cause

Appearance had two concepts mixed together:

```text
light/dark surface mode
accent/color palette
```

A color palette should communicate emphasis and selection. It should not replace
the neutral reading canvas, Card, Popover/Dialog or border hierarchy.

## Theme architecture

Added `src/components/layout/theme-contract.ts` as the runtime owner for:

```text
mode    -> system | light | dark
palette -> editorial | jade | warm | plum | mono | tea
```

`ThemeProvider` now persists mode and palette separately and resolves system mode
with `prefers-color-scheme` through `useSyncExternalStore`.

`src/app/theme-palettes.css` is loaded after the neutral light/dark token layer.
Palette selectors override only:

- primary emphasis;
- accent emphasis;
- focus ring;
- selected/active Sidebar/navigation color;
- brand-oriented chart accent.

They do not override canvas, Card, Popover, Dialog, elevated/subtle background or
border tokens.

Success, warning, danger, info and semantic purple remain independent from the
selected palette.

## New palette

Added `Trà xanh` / `tea`, a desaturated tea-green accent intended for long study
sessions. Like every palette it has separate light and dark values and does not
turn the page background green.

## Settings UX

Added a focused `AppearanceSettingsSection`:

- direct System / Light / Dark choice;
- six touch-sized palette choices with swatches and selected-state check;
- explanatory copy that makes accent-vs-surface ownership explicit;
- one flatter `Hành vi học tập` surface rather than a card per boolean setting.

## Remaining design-system violations closed in this pass

The pass normalized reported visual ownership violations in:

- Dictionary learning sections;
- HanziHome workspace loading;
- lesson overview and empty lesson text state;
- lesson-note access;
- flashcard detail and active review panel;
- Mandarin TTS controls;
- global search command dialog;
- HTML Artifact Select triggers.

These consumers now use primitive variants/props for owned visual behavior and
reserve call-site `className` for layout.

## Regression guards

Added `theme-contract.test.ts` to verify:

- every palette has metadata;
- `tea` is part of the runtime schema;
- every palette defines both light and dark selectors;
- palette CSS cannot take ownership of neutral canvas/surface/border tokens;
- palette CSS continues to define the intended interactive emphasis tokens.

Updated `frontend-ui-system` to v3.7 and added
`docs/ui/theme-contract.md` as the canonical theme/color ownership reference.

## Verification status

During this pass CI provided evidence that `lint`, `source:check`, `ui:check`
and `api:check` passed together after the visual migrations. A later typecheck
then exposed an older test fixture that did not include the new Header toolbar
`ownerId`; the fixture was updated to the actual store state.

The final branch head must still complete the full repository gate after the
documentation/test updates before this log should be interpreted as a release
readiness claim.

Visual source intent is clear from the token contract, but authenticated browser
rendering of every palette across Settings plus a content-heavy learning surface
remains a separate runtime verification step.
