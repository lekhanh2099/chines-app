---
name: frontend-ui-system
description: Design, implement, refactor, audit, or review UI and UX in chines-app. Use for information architecture, user flow, component reuse, design system, controls, settings, navigation, responsive layout, iPad/mobile, accessibility, typography, tokens, states, theme/color ownership, or visual consistency.
compatibility: chines-app local shadcn-style components; Tailwind CSS 4; Radix and Base UI wrappers; TanStack Query/Form/Store
metadata:
  author: chines-app
  version: "3.14"
---

# Frontend UI System

## 1. Required context

Read only the relevant local contracts:

```bash
cat AGENTS.md
cat docs/ui/component-contracts.md
cat docs/ui/component-inventory.md
cat docs/ui/ui-verification.md
cat docs/architecture/frontend-structure.md
```

For theme, color, appearance mode or palette work, also read
[`docs/ui/theme-contract.md`](../../../docs/ui/theme-contract.md).

Read the local primitive/pattern source before changing or recreating it. Local source overrides generic examples.

For shadcn changes, inspect current source and use CLI dry-run/diff before overwriting anything.

## 1A. Hanzi Studio Editorial Study Workspace binding

For the Hanzi Studio consolidation, the visual reference is pinned to
`lekhanh2099/hanzi-studio@0568e6cd15d868ac968dfe03533d99429a4e9fcf`. Apply the source
`hanzi-frontend-quality` skill, `docs/STYLE_GUIDE.md`, `docs/engineering/UI_SYSTEM.md`, and
`src/styles/theme.css` through chines-app owners rather than copying source primitives wholesale.

Non-negotiable visual rules:

- canonical learning content > immediate study action/current position > support/meta/settings;
- Editorial Study Workspace, not analytics/dashboard card grids;
- pale cool canvas + near-paper work surface in light mode; deep navy layers in dark mode;
- primary is reserved for current action/location/selection/progress; accent supports audio/secondary state;
- no decorative gradients, raw feature palette utilities, feature-local theme recipes, pixel font sizes, or `w-fit`/`h-fit`/`fit-content` layout patches;
- authoritative theme colors use numeric OKLCH + decimal alpha, never HSL percentage channels or percentage `color-mix` recipes;
- normal hierarchy is border/spacing/typography first; avoid card-inside-card and hairline soup;
- hover must not move/scale the interactive hit target;
- finite required choices wrap/grid instead of relying on sideways discovery;
- keep the chines-app primitive/state/data boundaries authoritative.

When the source and target component APIs differ, preserve the source behavior/visual hierarchy by extending the existing chines-app semantic owner. Do not introduce a second component dialect.

## 2. Start from the user goal

A UI refactor may change information architecture or flow when the old flow creates duplicated navigation, hidden state, unnecessary steps, weak orientation or interaction clutter.

Before coding, resolve:

```text
User goal:
Current friction:
Primary action:
Information hierarchy:
Flow/state transitions:
Loading / empty / error / disabled states:
Responsive + touch behavior:
Keyboard/focus behavior:
Data/state owner:
Business/data invariants:
```

Do not preserve old JSX merely because it already exists. Do not change flow merely because another layout looks cleaner.

## 3. State ownership

Use one authoritative owner:

```text
server/cache state       -> TanStack Query
form state               -> TanStack Form
cross-feature client UI  -> scoped TanStack Store
shareable navigation     -> route/search params
local transient UI       -> React local state
derived value            -> compute directly
```

Do not mirror Query/Form/Store/route values into local state. Do not use `useEffect` for pure derivation. Every state-writing effect must represent a real browser/subscription/imperative/external-system bridge and be idempotent.

Internal TypeScript unions/discriminated unions are valid when they model local compile-time state. Use Zod for runtime/external/persisted boundaries, not merely to avoid a union. `unknown` is valid at a true untrusted/library boundary when narrowed before domain/UI use. Follow the root `AGENTS.md` type contract.

## 4. Shared shell boundary

`src/components/layout/**` owns global chrome only and must not import feature implementation code.

Feature-specific context enters shell through a generic owner-safe slot/store. HanziHome catalog/search/reader behavior stays in HanziHome; Header renders only generic shell state.

## 5. Inventory before JSX

Classify every reusable UI need:

```text
Need:
Existing primitive:
Existing pattern:
Existing feature composition:
Current consumers:
Missing contract:
Decision: use | extend | create | justified local exception
```

Do not create a second Button, Card, PageHeader, IconTile, Dialog, Select, DropdownMenu, Tooltip, Chip, Typography, Switch, Tabs or SegmentedControl visual language inside a feature.

## 6. Primitive ownership

Feature code does not import Radix/Base primitives directly unless it is a documented integration adapter.

Shared primitives own:

- colors/tokens;
- border/radius/background/shadow;
- internal padding/density;
- typography;
- hover/focus/active/disabled/invalid behavior;
- overlay stack;
- internal icon sizing.

Feature code owns labels, data, callbacks, business conditions, parent layout, responsive placement and external spacing.

Call-site `className` is layout-only. Do not repair primitive visuals from feature code.

Bad:

```tsx
<Card className="rounded-xl border bg-bg-card p-4" />
<SelectTrigger className="h-10 bg-bg-card text-sm" />
<PageHeader className="[&_h1]:text-2xl" />
```

When a variation repeats, extend the owner with a semantic typed API.

`scripts/check-ui-standards.mjs` is a CI/repository guard for these project-specific ownership rules. Do not add a broad baseline or exception just to make a migration pass.

## 7. Interaction composition

Use the correct semantic primitive:

- DropdownMenu = action menu.
- A category with immediate child choices = submenu on pointer/desktop layouts, not automatically on touch layouts.
- Direct command = menu item.
- Independent boolean = checkbox item/Switch depending surface.
- Repeated edit/reorder/delete icons = usually one overflow menu.
- Badge = static state/category, not generic numbers.
- Chip = interactive filter/toggle.
- IconTile = decorative icon container.
- SegmentedControl = compact single-choice pressed group.
- Tabs = actual tab/panel semantics with keyboard behavior.
- EmptyState = empty/no-result presentation, not errors.

Never nest interactive controls such as `button > button`. A click-anywhere card containing TTS/menu/buttons must use sibling interaction layers or a non-interactive Card with explicit actions.

## 8. Density

Use one density family per row:

```text
standalone/touch : 44px minimum
toolbar/command  : 36px
menu             : 40px
inline text      : content-sized
```

Do not mix 36px and 44px controls in the same command row without an intentional hierarchy reason.

Standalone settings choices remain touch-sized even when displayed in a grid.

A touch target and its visible artwork are separate contracts. A 44px interactive target may contain a smaller 28–32px avatar or icon. Do not enlarge the visible chrome merely to satisfy the hit area, and do not shrink the hit area merely to make a phone header look compact.

### Micro geometry and spacing

Treat border, radius, focus and spacing as system contracts rather than finishing details:

```text
controls / inputs / menu rows : rounded-lg
cards / panels / overlays     : rounded-xl
pill semantics                : rounded-full
checkbox                      : compact square radius owned by Checkbox
default structural border     : 1px border-border-default
form control border           : 1px border-input
focus                         : shared focus-ring owner, never feature-built ring utilities
```

Sibling/component rhythm is parent-owned. Prefer `grid/flex + gap` and container padding over `mt-*`, `mb-*`, `ml-*`, `mr-*`, `space-x-*` or `space-y-*` on children. Auto margin remains valid for alignment. Horizontal margin is acceptable only for genuine inline text separation where there is no parent layout box that can own a gap. Do not replace margin with meaningless padding merely to satisfy a checker.

Overlay elevation follows one shared layer ladder: modal backdrop `100`, modal content `101`, menu/select/popover/floating content `120`, tooltip `130`. Feature code never repairs z-index locally.

## 9. Surface hierarchy

Hierarchy is not “more cards”. Prefer:

```text
major surface
  -> whitespace / Separator
  -> terminal interactive rows/cards only where needed
```

Avoid card-inside-card-inside-card layouts. Use Badge for state/category, not every metadata count.

Home is a continuation/attention surface, not a duplicate sitemap. Sidebar owns global route discovery. Do not solve a sparse Home by adding route shortcuts or by stretching short cards to artificial heights. Use meaningful continuation/history/progress content, stack short activity surfaces when side-by-side placement creates a large dead zone, and keep opaque internal IDs out of learner-facing activity labels.

## 10. Shell, tablet and mobile

Normal pages use `PageContainer`. App Shell owns viewport height; feature pages do not subtract guessed header/nav sizes with hard-coded `calc(100dvh - ...)`.

Treat iPad portrait around 820px as a tablet workspace, not squeezed desktop. Persistent Sidebar starts at `lg`; below that, quick navigation plus a full-navigation Sheet must keep all global routes reachable.

Responsive layout decisions must account for persistent shell chrome. A breakpoint is viewport-based, not container-based: when the Sidebar appears at `lg`, the remaining content width is much smaller than the viewport width. Do not activate a multi-column feature grid at the same breakpoint unless each resulting column remains readable. For Home, portrait tablet and sidebar-constrained tablet layouts stay one-column; the main/attention split begins only when the content area is genuinely wide enough.

PageHeader and feature section headers must let titles, descriptions and actions wrap without starving text or creating horizontal overflow. Mobile list rows must protect the primary label with `min-w-0`; secondary badges/actions may move below the label instead of squeezing it.

Use two columns only when both retain readable width and no horizontal overflow. Do not postpone useful layout unnecessarily, but do not use viewport breakpoints as a substitute for checking actual content width.

### Phone shell density

Phone chrome is not a scaled-down desktop toolbar. Prioritize orientation plus the next action and move low-frequency global controls into an existing full-navigation/settings surface.

For the authenticated phone shell:

- bottom quick navigation is icon-first; repeated destination labels may be visually hidden when every item keeps an accessible name and active `aria-current`;
- each bottom-nav item still owns a standalone 44px touch target;
- keep the bottom bar only as tall as its targets plus safe-area/padding rather than reserving desktop-like label height;
- Header route context gets the flexible width; global utilities must not starve the title/select;
- use ghost/icon chrome for routine phone utilities rather than outlining every 44px hit area;
- low-frequency Settings may live in the full-navigation `Thêm` Sheet on phones while remaining directly available at wider breakpoints;
- a saved/success indicator may disappear after success on phones, but saving and error states must remain observable;
- do not show title + multiple status pills + contextual menu + search + settings + profile simultaneously merely because each control exists on desktop.

### Touch overlay model

Do not carry desktop lateral-submenu geometry into phone or iPad touch workspaces. A submenu that opens beside its parent can render the parent and child as two competing panels, overflow the viewport, and leave shell navigation interactive behind the user's current task.

For contextual preference flows:

```text
pointer / wide desktop -> DropdownMenu + DropdownMenuSub when hierarchy is shallow
touch / narrow layout  -> one modal Sheet or Dialog surface with the child choices inside it
```

On touch layouts:

- keep exactly one active overlay surface for one settings task;
- do not leave a parent menu visible while a child choice panel opens beside it;
- the modal overlay owns focus, scroll, dismissal and safe-area handling;
- modal content must cover/disable the bottom navigation rather than compete with it;
- Select/Menu/Popover content must collision-constrain to the viewport;
- iPad portrait follows the touch interaction model even when there is room for a narrow desktop submenu.

A fake in-menu Back flow is not required when the choices fit in one Sheet. If a touch task truly needs multiple levels, keep navigation inside one modal surface rather than spawning lateral overlays.

### Mobile reading surfaces

Do not solve phone typography by globally shrinking every font. Diagnose the actual source first: inherited desktop spacing, persisted/imported inline font size, overly wide code/table content, or a reading measure that still assumes desktop.

For rich-text notes and other document-like reading surfaces:

- phone read-only presentation may normalize imported inline `font-size` to the mobile reading rhythm without mutating persisted content;
- edit mode preserves the stored formatting so responsive presentation is not a data migration;
- body copy remains comfortably readable; hierarchy is adjusted with relative heading scale and spacing rather than tiny text;
- long code/preformatted teaching snippets wrap on phone when horizontal preservation is not semantically required;
- genuinely tabular content gets a contained horizontal scroller rather than widening the whole document;
- remove redundant nested card/inset padding on narrow screens so the document uses available width;
- read-only actions that form a long command list use one modal Sheet with touch-sized rows instead of a small floating Popover.

## 11. Settings and contextual controls

Header Gear is global only: theme, route-scoped lookup, focus mode, link to full settings. On phones it may be reached through the full-navigation Settings entry when direct Header placement would crowd route context.

Feature-specific reader controls stay in the lesson workspace.

Reading settings should provide direct live preview of font, size, reveal behavior, pinyin, meaning and answers. On tablet/wide screens preview may sit beside controls; on narrow screens it follows in document flow.

Reader quick settings use the responsive overlay contract: phone/iPad use a single Sheet with touch-sized font/size/reveal/visibility controls; wide desktop may use DropdownMenu submenus. Do not expose the same lateral submenu interaction on touch simply because the desktop implementation already exists.

## 12. Chinese learner typography

The selected Hanzi reader font is the authoritative learner-font preference across authenticated learning surfaces unless a UI explicitly previews another font.

Use:

- pure Hanzi -> `HanziText`, `ReaderHanziText` or `LearnerHanziText`;
- mixed Vietnamese/Chinese -> `HanziAwareText` / `HanziInlineText`;
- pinyin -> `PinyinText`;
- preview-only font samples -> `HanziFontPreview`.

Do not force Songti/Xingkai/system font locally for normal learner content. Do not use a Traditional-Chinese-only web font as the fallback for Mainland `zh-CN` content.

System font names such as Kaiti are not cross-platform delivery. If exact appearance must match iOS/Android/desktop, ship an appropriate Simplified-Chinese font asset; otherwise provide a deterministic Simplified-Chinese-capable fallback from fonts already delivered by the app before falling back to generic serif/sans-serif.

HanziWriter stroke glyphs are vector data and are not expected to follow CSS font selection.

## 13. Destructive actions

User-facing destructive actions require either explicit confirmation with consequence/pending state or a clearly recoverable Undo flow. If backend behavior is soft delete/archive, copy must describe recoverability accurately.

## 14. Accessibility

Verify:

- correct button/link semantics;
- no nested interactive controls;
- Switch/Checkbox/pressed state;
- menu trigger/items and destructive tone;
- Dialog title/focus/Escape/return focus;
- Select/Tabs/SegmentedControl keyboard behavior;
- visible focus;
- touch target size;
- visually hidden icon-only navigation retains an accessible name;
- `aria-current` for active route;
- active route stays discoverable in navigation;
- tablet/mobile has a path to every global route.

Do not add ARIA to compensate for the wrong interaction model.

## 15. Visual and theme system

Preserve semantic tokens and shared surface grammar. Do not add feature-local hard-coded colors, arbitrary gradients/shadows, overlay z-index, duplicate active palettes or legacy glass recipes.

Theme ownership is split deliberately:

```text
light/dark mode -> neutral foundations: raw card, popover, input, elevated surfaces,
                   generic control/shell surface, border hierarchy, base text hierarchy
accent palette  -> restrained outer-canvas tint, perceptible low-chroma base-surface tint,
                   primary, accent, focus ring, selected/active navigation,
                   brand-oriented chart emphasis
semantic state  -> success, warning, danger, info, semantic purple
```

All application surfaces resolve through the semantic ladder in `surface-system.css`:

```text
canvas -> subtle -> base -> raised
                  + hover / selected
```

`surface-base` must be visibly related to the canvas so Card/Header/Sidebar do not look like unrelated white islands, but remain lighter/calmer than the canvas. Hover and selected surface backgrounds derive from the palette's low-chroma `--accent`, not directly from high-chroma `--primary`. Reserve `--primary` for selected text/icons, selected borders, focus and primary actions.

A palette MUST NOT redefine the raw `--card` foundation, Popover/Dialog/input/border/text foundations, or semantic status colors. Every palette requires a light and dark definition and must preserve readable foreground contrast.

Active interaction text and icons use the selected palette emphasis. If `Typography` is nested inside an active Button/Menu item, the primitive owns the interaction state and nested text must inherit that active color rather than resetting to normal body text.

Add palettes only through `ThemePaletteSchema`, `THEME_PALETTE_META` and `theme-palettes.css`; do not add a feature-local theme store or palette class system.

Classify visual recipes as:

```text
primitive-owned
token-owned
brand/system recipe
stable feature composition
legitimate local exception
ad-hoc debt
```

## 16. Verification

Follow `docs/ui/ui-verification.md`.

A visual claim requires rendering. Use the smallest tier that can falsify it:

- Fast: affected state/viewport.
- Subsystem: affected desktop/iPad/mobile plus relevant keyboard/state variants.
- Full: shared primitive or multi-surface changes plus repository gate.

For theme work, render at least Settings and one content-heavy learning surface in both light and dark mode, and switch through every palette. Verify canvas, base/subtle/raised surface separation, hover/selected coherence, neutral semantic-state independence, selected/focus/primary text emphasis and contrast separately.

For Home, verify at minimum a narrow phone, iPad portrait, a sidebar-constrained tablet/landscape width, and desktop. Check section order, card width, long note/activity labels, bottom navigation clearance, absence of horizontal overflow, and whether the first viewport forms a coherent information hierarchy without an artificial dead zone.

For touch reader controls, verify a narrow phone and iPad portrait with the reader settings open. There must be only one modal settings surface, no lateral submenu/off-screen child panel, no interactive bottom navigation behind the modal, no horizontal overflow, visible selected font/size state, and safe-area clearance at the bottom. Verify the wide-desktop menu separately because it intentionally uses a different pointer interaction model.

For the phone shell and Notes reading view, verify title truncation, icon-only bottom navigation, 44px hit areas, full Settings reachability through `Thêm`, saving/error visibility, absence of a persistent success-status slot, code wrapping, table-contained overflow, normalized read-only imported font sizes and preservation of the original formatting after switching to edit mode.

`npm run check` is the full CI/release gate, not a mandatory pre-commit step for every small edit. There is no repository hook that should run the complete suite on each commit.

If authenticated rendering or a full gate cannot run, state exactly what remains unverified.

## 17. Handoff

Report only evidence-bearing items:

```text
User-flow change:
State owners:
Component contracts used/extended:
Meaningful consumers:
Rendered routes/viewports:
Keyboard/state verification:
Checks actually run:
Known unverified states:
Residual UX/accessibility/architecture risk:
```
