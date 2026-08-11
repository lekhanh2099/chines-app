# UI Component Contracts

This is the canonical UI/UX contract for `chines-app`.

Local source code is the source of truth. Generic shadcn, Radix, Base UI and
framework examples are reference material only and MUST NOT override customized
local components or product interaction contracts.

## 1. Selection matrix

| Need                              | Canonical contract                      | Notes |
| --------------------------------- | --------------------------------------- | ----- |
| Text action / CTA                 | `Button`                                | semantic variant + density |
| Icon-only action                  | `Button` icon size + optional `Tooltip` | always keep an accessible name |
| Modal task                        | `Dialog`                                | typed size, placement, scroll ownership |
| Destructive confirmation          | confirmation Dialog pattern             | explicit consequence + pending state |
| Side or bottom panel              | `Sheet`                                 | responsive panel contract |
| Non-modal contextual content      | shared Popover wrapper                  | not an action menu |
| Action/function list              | `DropdownMenu`                          | keyboard/menu semantics |
| Compact preference in a menu      | `DropdownMenuCheckboxItem`              | checkbox-menu semantics |
| Supplementary hint                | `Tooltip`                               | never required information |
| Single-value selection            | `Select`                                | local Radix wrapper |
| String option-array selection     | `OptionSelect`                          | typed convenience adapter |
| Radio selection                   | `RadioGroup`                            | exclusive choice |
| Boolean setting                   | `Switch`                                | label/description outside control |
| Independent boolean selection     | `Checkbox`                              | checkbox semantics |
| Interactive compact token         | `Chip`                                  | filter/removable/pressed token |
| Static status/category            | `Badge`                                 | not clickable; ordinary counts are text |
| Application text hierarchy        | `Typography`                            | not Hanzi learner text |
| Avatar/profile image              | `Avatar`                                | fallback initials required |
| Decorative icon tile              | `IconTile`                              | owns tile tone/radius/icon size |
| Visual section/card               | `Card`                                  | typed surface/padding/interaction |
| Divider                           | `Separator`                             | semantic separation |
| Compact exclusive options         | `SegmentedControl`                      | pressed single-choice group |
| Content tabs                      | local `Tabs`                            | only real tab/panel semantics |
| Empty/no-result state             | `EmptyState`                            | empty is not error |
| Page heading                      | `PageHeader`                            | typed density; no descendant repair |
| Search command surface            | current HanziHome search bridge         | shell owns open/query state only |

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

Use one authoritative owner:

```text
URL/shareable navigation     -> route/search params
server/cache state           -> TanStack Query
form/validation/dirty state  -> TanStack Form
cross-feature client UI      -> scoped TanStack Store
transient local interaction  -> local React state
pure derivation              -> compute from authoritative inputs
```

Do not mirror Query, Form, Store or route state into local React state without a
real draft/bridge contract.

Every state-writing effect must synchronize an external/ownership boundary and
must be idempotent. Running it again with the same authoritative input must not
continue producing state changes.

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
`HanziText`, `ReaderHanziText`, `AdaptiveStudyText`, `PinyinText`,
`TranslationText`, `StudyInstructionText` or `HanziFontPreview`.

## 11. Dialog and destructive actions

Every dialog requires a title, managed focus, Escape behavior, focus return and
an explicit async state when applicable.

A destructive user-facing action requires either:

- confirmation with consequence + pending state; or
- an explicit recoverable Undo contract.

If the backend is soft-delete/archive, copy must say the content is recoverable.
A permanent red delete cluster is not the default editing UI.

## 12. DropdownMenu and Popover

DropdownMenu is the action/function list contract and owns managed focus,
arrow-key navigation, typeahead, disabled/destructive states, submenus and focus
return.

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

## 15. SegmentedControl and Tabs

Use SegmentedControl for compact pressed single-choice sets such as view mode,
active pane or module selection. It owns active/inactive Button grammar and
`aria-pressed`.

Use Tabs only for true tab/panel semantics. Do not hand-build partial
`role="tab"` implementations without complete keyboard and panel relationships.

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
- `app-gradient-hero` and `app-glass-surface` are compatibility aliases only;
- `hanzihome-liquid-*` is limited to HanziHome workspace chrome;
- `app-brand-gradient` is compact identity/emphasis only.

Controls use `rounded-lg`; cards/panels/overlays use `rounded-xl`. Semantic 1px
borders establish most hierarchy. Overlay elevation belongs to overlay
primitives.

Feature code uses semantic tokens and must not introduce raw palette/gradient
recipes to solve local visual problems.

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

Before JSX:

```text
User goal:
Primary action:
Information hierarchy:
States:
State owner:
Existing primitive:
Existing pattern:
Missing contract:
Responsive behavior:
Keyboard behavior:
Risk:
```

After implementation:

- no feature implementation import inside shared shell components;
- no direct primitive-library import in features;
- no duplicated visual/control recipe;
- no canonical primitive repaired by visual `className`;
- no inaccessible custom interaction;
- no blank loading/initial state;
- no hard-coded shell-height subtraction;
- server state stays in TanStack Query;
- form state stays in TanStack Form;
- cross-feature client interaction stays in scoped TanStack Store;
- URL/shareable state stays in route/search params;
- desktop/iPad/mobile are actually rendered when visual behavior changes;
- component choice and residual risk are documented in handoff.
