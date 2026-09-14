# UI Component Contracts

This is the canonical UI/UX contract for `chines-app`.

Local source code is the source of truth. Generic shadcn, Radix, Base UI and
framework examples are reference material only and MUST NOT override customized
local components or product interaction contracts.

## 1. Selection matrix

| Need                          | Canonical contract                      | Notes                                   |
| ----------------------------- | --------------------------------------- | --------------------------------------- |
| Text action / CTA             | `Button`                                | semantic variant + density              |
| Icon-only action              | `Button` icon size + optional `Tooltip` | always keep an accessible name          |
| Modal task                    | `Dialog`                                | typed size, placement, scroll ownership |
| Destructive confirmation      | confirmation Dialog pattern             | explicit consequence + pending state    |
| Side or bottom panel          | `Sheet`                                 | responsive panel contract               |
| Non-modal contextual content  | shared Popover wrapper                  | not an action menu                      |
| Action/function list          | `DropdownMenu`                          | keyboard/menu semantics                 |
| Compact preference in a menu  | `DropdownMenuCheckboxItem`              | checkbox-menu semantics                 |
| Supplementary hint            | `Tooltip`                               | never required information              |
| Single-value selection        | `Select`                                | local Radix wrapper                     |
| String option-array selection | `OptionSelect`                          | typed convenience adapter               |
| Radio selection               | `RadioGroup`                            | exclusive choice                        |
| Boolean setting               | `Switch`                                | label/description outside control       |
| Independent boolean selection | `Checkbox`                              | checkbox semantics                      |
| Interactive compact token     | `Chip`                                  | filter/removable/pressed token          |
| Static status/category        | `Badge`                                 | not clickable; ordinary counts are text |
| Application text hierarchy    | `Typography`                            | not Hanzi learner text                  |
| Avatar/profile image          | `Avatar`                                | fallback initials required              |
| Decorative icon tile          | `IconTile`                              | owns tile tone/radius/icon size         |
| Visual section/card           | `Card`                                  | typed surface/padding/interaction       |
| Divider                       | `Separator`                             | semantic separation                     |
| Compact exclusive options     | `SegmentedControl`                      | pressed single-choice group             |
| Content tabs                  | local `Tabs`                            | only real tab/panel semantics           |
| Empty/no-result state         | `EmptyState`                            | empty is not error                      |
| Page heading                  | `PageHeader`                            | typed density; no descendant repair     |
| Search command surface        | current HanziHome search bridge         | shell owns open/query state only        |

See `docs/ui/component-inventory.md` for implementation status.

## 2. Canonical source paths

```text
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/checkbox.tsx
src/components/ui/chip.tsx
src/components/ui/dialog.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/icon-tile.tsx
src/components/ui/input.tsx
src/components/ui/option-select.tsx
src/components/ui/page-header.tsx
src/components/ui/radio-group.tsx
src/components/ui/select.tsx
src/components/ui/separator.tsx
src/components/ui/sheet.tsx
src/components/ui/switch.tsx
src/components/ui/tabs.tsx
src/components/ui/tooltip.tsx
src/components/ui/typography.tsx
src/components/ui/base-popover.tsx
src/components/ui/segmented-control.tsx

src/components/patterns/empty-state.tsx
```

Learner typography remains feature/domain owned:

```text
src/features/hanzihome/components/lesson-overview/hanzi-typography.tsx
src/components/patterns/learner-text.tsx
```

## 3. Primitive, pattern, feature and shell ownership

### Primitive

Owns element/primitive anatomy, semantics, focus, disabled/invalid behavior,
tokens, variants, density, internal icon sizing and overlay stacking.

### Pattern

Owns repeated cross-feature interaction composition.

Examples:

```text
EmptyState
future CommandDialog
future ResponsiveOverlay
```

### Feature

Owns product labels, domain data, business conditions, query/form behavior,
feature-specific navigation and contextual UI.

Feature code MUST NOT reproduce primitive anatomy.

Stable product-specific compositions MAY remain in a feature when their meaning
is domain-specific. Example: `LibraryCrudActionsMenu` represents the
course/book/lesson edit grammar; it does not replace DropdownMenu.

### Shell

`src/components/layout/**` owns global application chrome only. Shared shell
components MUST NOT import feature implementation code.

Feature-specific Header content is inverted through a shell boundary:

```text
feature
  -> owner-safe headerToolbarStore registration
  -> Header renders shared slot
```

Global search interaction state is similarly split:

```text
Header / Cmd+K
  -> globalSearchStore { open, query }
  -> feature search bridge owns query data/results/navigation
```

The shared store carries interaction state, not duplicated server/domain data.

## 4. State ownership

Follow the [generic state-ownership contract](../architecture/frontend-structure.md#4-state-ownership-matrix).
UI composition does not transfer ownership of query, form or navigation state.

## 5. `className` ownership

Allowed at canonical component call sites:

- parent-imposed width/max-width;
- grid/flex placement;
- responsive visibility;
- external spacing owned by the parent;
- parent-owned scroll constraints;
- `sr-only` and equivalent accessibility utilities.

Forbidden at canonical component call sites:

- color/tone;
- border appearance;
- radius;
- internal padding/density;
- typography;
- shadow;
- hover/focus/active recipes;
- overlay z-index;
- primitive-owned icon sizing;
- descendant selectors reaching into component anatomy, e.g. `[&_h1]:...`.

Repeated valid visual variation becomes a typed semantic API on the owner.
One-off pixels do not justify a variant.

`scripts/check-ui-standards.mjs` enforces this for canonical visual contracts,
including Button, form controls, Card, Badge, SelectTrigger, PageHeader,
SegmentedControl and IconTile. Do not add a baseline to hide violations.

### Micro geometry contract

```text
control / field / menu item       -> rounded-lg
card / panel / popover / dialog   -> rounded-xl
pill/status/filter semantics      -> rounded-full
checkbox                           -> owner-specific compact square radius
structural/card border             -> 1px border-border-default
form field border                  -> 1px border-input
semantic border                    -> success/warning/danger/info tokens only
focus-visible                      -> shared focus ring helper/primitive owner
```

Feature code does not introduce `rounded-2xl`, `rounded-3xl`, arbitrary radius,
`border-2+`, or ring recipes to make a component look more important. A stronger
hierarchy comes from spacing, typography and surface semantics rather than a new
radius dialect.

## 6. App page, viewport and scroll ownership

`PageContainer` owns the normal application page frame. Pages remain fluid and
use responsive gutters; they do not add page-level centered max-width shells.

The authenticated App Shell owns available viewport height and normal route
scrolling. Feature pages MUST NOT subtract guessed Header/mobile-navigation
heights with `calc(100dvh - ...)`.

Contained workspaces inherit:

```text
h-full min-h-0
```

and place overflow only on the pane that actually scrolls.

Reading measure, review cards and dialogs may constrain their own internal
content where comprehension requires it.

## 7. Interaction density

Density is shared across controls:

```text
Touch / standalone action : 44px minimum
Toolbar / command bar      : 36px
Menu row                   : 40px
Inline text action         : content-sized
```

Controls in the same command row use the same family. A compact Select next to a
Button uses Select `sm` + Button `toolbar`, not 36px next to 44px.

Component rhythm is also shared: parent layout owns sibling spacing through `gap`
and container padding. Fixed child margins and `space-x/space-y` are not the normal
composition primitive. `mx-auto`/`ml-auto`/`mr-auto` remain valid alignment tools;
small horizontal margin remains valid inside true inline text flow where a parent
layout gap cannot represent the typography.

Standalone settings choices keep touch-sized targets even inside a grid. A
44px target may contain a smaller 28–32px avatar/icon; do not enlarge visible
chrome or shrink the hit area merely to make a phone header compact. Do not
replace child margins with meaningless padding just to satisfy a checker.

## 8. Button

Preferred semantic sizes:

```text
touch
compact
toolbar
menu
icon-toolbar
icon-round
inline
```

Legacy aliases may remain while older consumers migrate but new code should not
expand that taxonomy.

Rules:

- non-submit buttons default to `type="button"`;
- submit buttons explicitly use `type="submit"`;
- command bars use `toolbar` / `icon-toolbar`;
- navigation rows use `navigation` / `active`;
- icon-only controls require accessible names;
- toggles expose `aria-pressed` or use Switch/Checkbox;
- loading actions remain disabled and visibly pending.

## 9. Card and surface hierarchy

Card owns radius, border, background, padding, elevation and interactive
hover/focus state.

Stable variants:

```text
default
section
subtle
elevated
interactive
```

`interactive` may use `asChild` when the entire card is one Link/action target.

Do not write feature recipes such as:

```tsx
<Card className="rounded-xl border bg-bg-card p-4 hover:bg-bg-elevated" />
```

Avoid card-in-card-in-card hierarchy. Prefer:

```text
major surface
  heading
  Separator / whitespace
  terminal interactive card or row
```

A grouping level does not automatically deserve its own border/background.

## 10. PageHeader, IconTile, Badge and Typography

`PageHeader` owns title/description hierarchy. Callers provide title,
description, optional eyebrow/meta/actions and typed density. They do not style
its internal headings through selectors.

`IconTile` owns decorative icon-container visuals. Typography/learner-text must
not be used as generic visual wrappers for icon tiles or status pills.

`Badge` is static status/category metadata. Ordinary facts like `25 bài`,
`2 quyển`, `695 từ` normally use subdued Typography instead of creating a field
of pills.

General application text uses `Typography`.

HanziHome Chinese text, pinyin, reading-size and learner typography use
`HanziText`, `ReaderHanziText`, `LearnerHanziText`, `AdaptiveStudyText`, `PinyinText`,
`TranslationText`, `StudyInstructionText` or `HanziFontPreview`.

The selected Hanzi reader font owns normal learner text across authenticated
learning surfaces. Use `HanziAwareText` / `HanziInlineText` for mixed
Vietnamese/Chinese text and `HanziFontPreview` for explicit font samples. Do not
force a different font locally or use a Traditional-Chinese-only fallback for
Mainland `zh-CN` content. System names such as Kaiti do not guarantee delivery
across platforms: exact matching requires an appropriate Simplified-Chinese
asset; otherwise use a Simplified-Chinese-capable font already delivered by
the app before generic serif/sans-serif. HanziWriter stroke glyphs are vector
data and do not follow CSS font selection.

## 11. Dialog and destructive actions

Every dialog requires a title, managed focus, Escape behavior, focus return and
an explicit async state when applicable.

Overlay elevation uses the shared ladder: modal backdrop `100`, modal content
`101`, menu/select/popover/floating content `120`, tooltip `130`. Feature code
does not repair z-index locally.

A destructive user-facing action requires either:

- confirmation with consequence + pending state; or
- an explicit recoverable Undo contract.

If the backend is soft-delete/archive, copy must say the content is recoverable.
A permanent red delete cluster is not the default editing UI.

## 12. DropdownMenu and Popover

DropdownMenu is the action/function list contract and owns managed focus,
arrow-key navigation, typeahead, disabled/destructive states, submenus and focus
return.

Never nest interactive controls such as `button > button`. A click-anywhere
card containing TTS/menu/buttons uses sibling interaction layers or a
non-interactive Card with explicit actions.

Popover is for non-menu contextual interactive content.

Repeated edit/reorder/delete icon clusters should become one overflow action
menu. HanziHome Library uses one menu per course/book/lesson and a separate
confirmation dialog for delete.

## 13. Settings information architecture

Global settings entry points are intentionally narrow:

- Header Gear contains only global Theme, route-scoped lookup and Focus mode,
  plus a link to the full Settings hub;
- Avatar contains identity/provider context and logout only;
- `/settings?section=app|reading|ai` remains the complete settings hub.

HanziHome reader settings are contextual learner controls, so their quick entry
lives in the lesson workspace toolbar, not in global Gear. The reader menu owns
font, size, reveal and visibility groups and links to full reading settings.
Font choices preview the actual Hanzi font.

Use Switch for full settings-page boolean rows. Use menu checkbox/radio items
inside compact menus.

Reading settings preview font, size, reveal behavior, pinyin, meaning and
answers live. On tablet/wide screens the preview may sit beside controls; on
narrow screens it follows in document flow.

### Touch overlays

Wide pointer layouts may use shallow DropdownMenu submenus. Phone and iPad
portrait preference flows use one modal Sheet/Dialog with the choices inside,
even when a desktop submenu would physically fit. The active modal owns focus,
scroll, dismissal and safe-area handling and disables/covers bottom navigation.
Do not leave a parent menu visible beside a child panel. Constrain floating
content to the viewport; if several levels are necessary, keep navigation in
the same modal rather than lateral overlays. A fake Back flow is unnecessary
when all choices fit in one surface.

## 14. Navigation and Home information architecture

The global Sidebar owns the application sitemap. Home MUST NOT recreate the
same sitemap as large navigation cards.

Home answers continuation questions:

```text
What was I learning?
What recent work should I continue?
What needs attention next?
```

Sidebar groups routes as Học, Luyện, Năng lực and Cá nhân. When pathname
changes, the group containing the active route must become expanded so the
current location is never hidden. User-opened unrelated groups may stay open.

HanziHome module navigation is contextual and remains inside the feature.

### Responsive shell and Home

Persistent Sidebar starts at `lg`; below it, quick navigation and a
full-navigation Sheet keep every global route reachable. iPad portrait around
820px is a tablet workspace. Breakpoints must account for the width consumed
by Sidebar: do not enable feature columns at the same breakpoint unless both
remain readable. Home stays one-column on portrait/Sidebar-constrained tablet
layouts; split main/attention content only when the content area is wide enough.

Page/section headers let text and actions wrap. Mobile rows protect their
primary label with `min-w-0`; secondary badges/actions can move below it.
Stack short Home activity surfaces when columns create a dead zone; do not
stretch cards to artificial heights or expose opaque activity IDs to learners.

Phone chrome prioritizes orientation and the next action. Bottom quick
navigation is icon-first with accessible names, active `aria-current`, 44px
targets and only necessary safe-area/padding height. Header route context gets
flexible width; routine utilities use ghost/icon chrome. Low-frequency Settings
may move to `Thêm` on phones while staying directly available at wider widths.
Avoid crowding title, status pills, contextual menu, search, settings and profile
into one phone row. A saved indicator may disappear after success, but saving
and error states remain observable.

### Mobile reading surfaces

Diagnose inherited desktop spacing, imported inline font sizes, wide code/tables
and reading measure before shrinking fonts. Phone read-only rich text may
normalize imported font sizes without modifying persisted content; edit mode
preserves the stored formatting. Keep body text readable and adjust relative
heading scale/spacing. Wrap long code when horizontal preservation has no
semantic purpose, contain table overflow, and remove redundant nested insets
on narrow screens. A long read-only action list uses a modal Sheet with
touch-sized rows rather than a small floating Popover.

## 15. SegmentedControl and Tabs

Use SegmentedControl for compact pressed single-choice sets such as view mode,
active pane or module selection. It owns active/inactive Button grammar and
`aria-pressed`.

Use Tabs only for true tab/panel semantics. Do not hand-build partial
`role="tab"` implementations without complete keyboard and panel relationships.

Finite required choices wrap or use a grid rather than relying on sideways
discovery.

## 16. Select

Select owns control appearance. Feature code owns options and business disabled
conditions.

`SelectTrigger variant="breadcrumb"` is the canonical compact Header lesson
selector appearance. Layout code must not export CSS recipes to restyle Select
from outside.

## 17. Search/command

A keyboard-selected search surface is a composite, not Input + Dialog alone.

Current architecture deliberately separates:

- `globalSearchStore`: open/query interaction state used by Header and Cmd/Ctrl+K;
- `HanziHomeGlobalSearchBridge`: current product search data, course/lesson
  context, result navigation and direct dictionary lookup;
- `GlobalSearchDialog`: feature search UI.

Do not move HanziHome catalog/query/navigation logic back into Header. A future
feature-neutral search product may replace the bridge only through an explicit
migration.

## 18. Visual system

Global visual recipes have explicit ownership:

- `nova-shell-*` is opaque global chrome;
- `nova-page` is the neutral content canvas;
- `app-gradient-hero` and `app-glass-surface` are compatibility aliases that resolve to ordinary semantic surfaces;
- `hanzihome-liquid-*` is limited to HanziHome workspace chrome;
- `app-brand-gradient` is a legacy class name that resolves to a solid semantic primary identity; decorative product gradients are prohibited.

Controls use `rounded-lg`; cards/panels/overlays use `rounded-xl`. Semantic 1px
borders establish most hierarchy. Overlay elevation belongs to overlay
primitives.

Feature code uses semantic tokens and must not introduce raw palette/gradient
recipes to solve local visual problems.

Product hierarchy, theme foundations and palette ownership follow
[`theme-contract.md`](theme-contract.md). Do not add motion solely for polish:
it must convey hierarchy, feedback, state change or spatial continuity, retain
a static/instant reduced-motion path and remain outside authoritative state.

## 19. shadcn workflow

Before add/update:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff
```

Read local source and consumers. STOP AND CONFIRM before overwrite, dependency
addition or breaking API migration.

## 20. Feature checklist

Before JSX, resolve the user goal, primary action, information hierarchy,
affected states and existing primitive/pattern/feature composition. Choose
use, extend, create or a justified local exception from source and consumers.
Do not create a second visual language for an existing control.

A user-authorized UX refactor may change flow when evidence shows duplicated
navigation, hidden state, unnecessary steps or weak orientation. Identify the
friction, transitions/owners and back/deep-link behavior first. Existing JSX
alone is not a preservation requirement; a nicer layout alone is not permission
to change flow or data semantics.

For broad visual redesign, start from `PRODUCT.md`, the rendered surface and
brand assets. State the learner/session context, existing visual language,
references/anti-references and whether the user authorized evolution or an
overhaul. Preserve routes/navigation labels, localized copy meaning, working
keyboard/focus/touch/contrast behavior, analytics names/element IDs, form field
names/order and public-page metadata/structured data/share contracts unless
explicitly in scope. Visual redesign does not authorize database, API,
authorization, persisted state or business-rule changes.

Interface copy and its rendered checks follow
[`i18n.md`](../architecture/i18n.md).

After implementation:

- no feature implementation import inside shared shell components;
- no direct primitive-library import in features;
- no duplicated visual/control recipe;
- no canonical primitive repaired by visual `className`;
- no inaccessible custom interaction;
- no blank loading/initial state;
- no hard-coded shell-height subtraction;
- state stays with its authoritative owner;
- rendered evidence follows the affected scope in `ui-verification.md`;
- component choice and residual risk are documented in handoff.

Preserve semantic buttons/links, explicit toggle/selection state, keyboard and
visible focus, loading/empty/error/disabled states, touch targets and Chinese
language/font metadata. Do not add ARIA to compensate for the wrong interaction
model. Errors do not use the empty/no-results presentation.

## App scroll ownership

`AppScrollViewport` owns the single route-level vertical scroll container inside the authenticated shell.
Global header/sidebar/bottom navigation stay outside it. Feature code that needs section or reader positioning
uses `getAppScrollContainer`, `scrollAppContentToTop`, or `scrollAppContentToElement` from the shared layout
owner. Do not target `window` or call native `scrollIntoView` for app route/section navigation. Nested bounded
scroll regions are allowed only when the component itself is explicitly a scrollable pane or rail.
