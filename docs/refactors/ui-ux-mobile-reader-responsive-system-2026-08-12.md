# Mobile reader responsive-system remediation — 2026-08-12

Branch: `fix/mobile-reader-responsive-system`

## Trigger

Authenticated mobile HanziHome reader exposed several defects at once:

- reader quick settings used desktop lateral DropdownMenu submenus on a phone;
- the parent menu and font submenu could remain visible together, sending the child panel off-screen;
- bottom navigation remained visually present behind the contextual menu;
- lesson toolbar controls competed for narrow horizontal space;
- Select poppers were not consistently viewport-constrained and the lesson module selector explicitly disabled collision handling;
- the default `kaiti` preference depended on OS-installed Kai fonts and otherwise fell straight to a generic serif-looking CJK fallback.

## Interaction contract

The reader now has two deliberate interaction models rather than one desktop pattern squeezed into every viewport:

```text
phone / iPad / narrow touch workspace (< lg)
  -> one modal bottom Sheet
  -> touch-sized font, size, reveal and visibility controls
  -> Sheet owns focus, backdrop, scroll and safe-area
  -> bottom navigation is below the modal layer and cannot compete with the task

wide desktop (>= lg)
  -> compact DropdownMenu
  -> shallow nested submenus remain available for pointer/keyboard use
```

This is a responsive behavior change, not a CSS repositioning of the old submenu.

## Files and owners

### `HanziHomeReadingSettingsTrigger.tsx`

New feature composition that owns the responsive choice between touch Sheet and desktop DropdownMenu. It reuses the same learning-state owner and the exported reader option contracts; it does not create a second settings store.

### `Sheet`

Added a typed `height="tall"` bottom-sheet layout. Feature code no longer repairs Sheet max-height with a competing arbitrary class.

### `Select`

Shared Select content now has a viewport max width. The lesson module Select restores collision handling with explicit padding instead of `avoidCollisions={false}`.

### `HanziHomeDeveloperTools`

The toolbar trigger becomes icon-only below `sm`, retaining its accessible name. This keeps the 36px command row from being starved by the low-priority text label.

### Hanzi font fallback

`kaiti` continues to prefer native `Kaiti SC` / `KaiTi` when the platform provides it. When those fonts are absent, it now falls back to the already-delivered `Ma Shan Zheng` web-font variable before the generic Noto Serif fallback. The reader and font preview both use the same `getHanziFontFamily` owner.

This improves cross-platform consistency but is not a claim that Ma Shan Zheng is metrically or stylistically identical to a native Kai font. Exact cross-platform Kai appearance still requires shipping an explicit approved Kai font asset.

## Regression protection

- `LessonReadingSettings.test.tsx` locks the Kaiti fallback ordering.
- `HanziHomeReadingSettingsTrigger.test.tsx` locks the responsive Sheet branch, complete touch controls, full-settings route and separate desktop menu branch.
- UI skill updated to v3.13 with the touch-overlay contract.

## Verification status

- Vercel build/status on branch commit `a4fcfdae15a7a04be2afac82d2eb4adce82e4912`: success.
- Full authenticated phone/iPad interaction render was not available to the agent environment at this checkpoint.
- Before merge, render the actual lesson workspace at approximately 390×844 and 820×1180 and verify:
  - opening reader settings produces one modal Sheet only;
  - no font/size child panel appears beside the Sheet;
  - bottom navigation is covered and non-interactive while Sheet is open;
  - module Select remains inside viewport edges;
  - toolbar remains one coherent command row;
  - selected reader font preview matches learner Hanzi rendering on the same device;
  - Sheet footer clears device safe area.
