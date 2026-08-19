# Mobile reader responsive-system remediation — 2026-08-12

Branch: `fix/mobile-reader-responsive-system`

## Trigger

Two authenticated mobile captures exposed the same architectural problem from different surfaces: desktop interaction density had been compressed into a phone viewport instead of switching to a phone-specific interaction model.

The HanziHome lesson capture showed:

- reader quick settings using desktop lateral DropdownMenu submenus on a phone;
- parent and child panels visible together with the child pushed off-screen;
- bottom navigation still visually competing behind contextual settings;
- lesson toolbar controls fighting for horizontal room;
- Select poppers with weak viewport collision behavior;
- cross-device Hanzi font fallback inconsistency.

The Notes capture then showed the wider shell/read-surface consequences:

- Header exposed route select, save status, note actions, search, Settings and profile at once;
- bottom navigation repeated icon + label for five permanent destinations and consumed excessive vertical room;
- title/breadcrumb visuals used desktop card chrome even though phone width was the scarce resource;
- phone note actions used a long floating Popover rather than a touch task surface;
- imported Lexical inline `font-size` could preserve desktop-sized text on a phone;
- preformatted code used desktop `white-space: pre`, creating horizontal document pressure;
- the note document retained nested desktop frame/padding on the narrowest viewport.

## Interaction contract

### HanziHome reader settings

```text
phone / iPad / constrained workspace (< xl)
  -> one modal bottom Sheet
  -> touch-sized font, size, reveal and visibility controls
  -> Sheet owns focus, backdrop, scroll and safe-area
  -> bottom navigation is below the modal layer and cannot compete with the task

wide desktop (>= xl)
  -> compact DropdownMenu
  -> shallow nested submenus remain available for pointer/keyboard use
```

The breakpoint follows the lesson workspace itself: the app already keeps module selection in compact form below `xl`, so reader settings do not switch to desktop submenu behavior earlier than the rest of the workspace.

### Phone shell

```text
Header
  -> route/title context owns flexible width
  -> high-value contextual action
  -> search
  -> profile
  -> low-frequency Settings moves to Thêm on xs phones

Bottom navigation
  -> icon-only quick destinations
  -> 44px standalone hit targets
  -> accessible names + aria-current remain
  -> safe-area padding only; no label-height reservation
```

The visible artwork and the hit target are intentionally different sizes. For example the phone profile uses a smaller avatar inside a 44px Button instead of displaying a 44px avatar simply to satisfy touch geometry.

### Notes on phone

```text
read mode
  -> document-first width
  -> responsive reading rhythm
  -> imported inline font-size normalized for presentation only
  -> long teaching code wraps
  -> wide tables own their horizontal scroll

edit mode
  -> persisted Lexical formatting remains authoritative
  -> responsive read normalization does not mutate note data

actions
  -> one modal bottom Sheet with touch-sized rows
  -> destructive delete still routes through confirmation
```

This is responsive behavior, not pixel repositioning of the old desktop composition.

## Files and owners

### `HanziHomeReadingSettingsTrigger.tsx`

Owns the responsive choice between touch Sheet and desktop DropdownMenu. It reuses the same learning-state owner and exported reader option contracts; it does not create a second settings store.

The old standalone Dropdown-only quick-settings button was removed so future consumers cannot bypass the responsive entrypoint accidentally.

### `Sheet`

Added a typed `height="tall"` bottom-sheet layout. Feature code no longer repairs Sheet max-height with a competing arbitrary class.

### `Select` and `AppHeaderBreadcrumb`

Shared Select content is viewport constrained. Breadcrumb/select targets stay 44px on phones but return to compact toolbar geometry on wider layouts. Phone breadcrumb chrome is visually flattened so the hit region does not need to look like a large boxed desktop control.

### `Header`, `Sidebar`, `ProfileSettingsMenu`

The phone Header uses lower visual chrome while preserving standalone touch targets. Global quick Settings is hidden only at the xs phone breakpoint and remains reachable through the `Thêm` navigation Sheet.

The bottom quick-navigation bar is icon-only. Destination names remain as accessible labels, and active routes continue to use `aria-current`.

The visible profile avatar is smaller than its Button hit region, separating visual density from touch ergonomics.

### `NoteEditorPanel`

Phone note actions now open one modal Sheet. Successful autosave no longer permanently occupies a phone Header slot; saving and error status remain observable. Metadata and delete keep their existing controlled Dialog semantics.

The phone editor frame removes redundant outer padding so the document can use the width that is actually available.

### `Editor` + `responsive-system.css`

`Editor` exposes read-only presentation state through `data-read-only`. The responsive system uses that state to normalize imported inline font size only while reading on a phone. The Lexical JSON is not rewritten and edit mode still exposes stored formatting.

The same phone contract tightens heading/paragraph rhythm, wraps long code snippets, and contains genuinely wide tables locally.

### `HanziHomeDeveloperTools`

The toolbar trigger becomes icon-only below `sm`, retaining its accessible name. The view-mode choice is flattened into the tools menu instead of opening another lateral submenu for only two choices.

### Hanzi font fallback

`kaiti` continues to prefer native `Kaiti SC` / `KaiTi` when the platform provides it. When those fonts are absent, it falls back to the already-delivered `Ma Shan Zheng` web-font variable before the generic Noto Serif fallback. Reader content and font preview use the same `getHanziFontFamily` owner.

This improves cross-platform consistency but is not a claim that Ma Shan Zheng is metrically or stylistically identical to a native Kai font. Exact cross-platform Kai appearance still requires shipping an explicit approved Kai font asset.

## Regression protection

- `LessonReadingSettings.test.tsx` locks the Kaiti fallback ordering.
- `HanziHomeReadingSettingsTrigger.test.tsx` locks the Sheet branch through tablet layouts, complete touch controls, full-settings route and separate wide-desktop menu branch.
- `docs/ui/ui-verification.md` includes explicit phone shell and Notes read-mode checks.
- UI skill is v3.14 with phone shell density, touch-target/artwork separation and mobile rich-text reading rules.

## Verification requirements

The branch must pass the full `npm run check` gate before merge: lint, source/UI/API checks, typecheck, unit tests, Prettier, production audit and production build.

Full authenticated phone/iPad interaction render is also required before merge because build success cannot prove touch geometry or visual rhythm. Render approximately 390×844 and 820×1180 and verify:

- phone bottom nav is icon-only, all five destinations remain reachable and active state is obvious;
- every phone nav/Header action has a usable touch region without oversized visible chrome;
- Settings is reachable through `Thêm` when the xs Header Gear is hidden;
- long note titles truncate without pushing search/profile off-screen;
- successful autosave does not reserve a permanent phone Header slot; saving/error remain visible;
- note actions use one bottom Sheet and the shell behind it is non-interactive;
- read-only imported font sizes follow the mobile rhythm and return to stored formatting in edit mode;
- code does not widen the note document and wide tables scroll only inside their own region;
- opening HanziHome reader settings produces one modal Sheet only;
- no font/size child panel appears beside the Sheet;
- bottom navigation is covered and non-interactive while reader settings are open;
- module Select remains inside viewport edges;
- selected reader font preview matches learner Hanzi rendering on the same device;
- Sheet footers clear device safe area.
