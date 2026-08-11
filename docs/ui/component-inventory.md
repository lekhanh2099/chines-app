# UI Component Inventory

Status date: 2026-07-29

This inventory records canonical UI contracts, legacy paths and missing patterns.
It is a routing document for contributors and agents, not a mandate to migrate
the entire repository in one pass.

This local inventory overrides generic shadcn or vendor component-selection
rules. A registry component is not a project contract until it is installed,
reviewed and recorded here.

## Canonical primitives

| Contract         | Source                                    | Status                      | Intended use                                                |
| ---------------- | ----------------------------------------- | --------------------------- | ----------------------------------------------------------- |
| Button           | `src/components/ui/button.tsx`            | canonical                   | commands, CTAs, icon actions, menu action styling           |
| Dialog           | `src/components/ui/dialog.tsx`            | canonical                   | modal tasks with typed size, placement and scroll ownership |
| DropdownMenu     | `src/components/ui/dropdown-menu.tsx`     | canonical                   | action menus, checkbox/radio menu items and submenus        |
| Tooltip          | `src/components/ui/tooltip.tsx`           | canonical                   | supplementary mouse/keyboard hints only                     |
| Select           | `src/components/ui/select.tsx`            | canonical primitive         | single-value selection                                      |
| OptionSelect     | `src/components/ui/option-select.tsx`     | canonical adapter           | string-valued option-array selection                        |
| RadioGroup       | `src/components/ui/radio-group.tsx`       | canonical                   | string-valued exclusive choice                              |
| Switch           | `src/components/ui/switch.tsx`            | canonical                   | boolean settings                                            |
| Chip             | `src/components/ui/chip.tsx`              | canonical interactive token | filters, removable actions and compact selectable controls  |
| Badge            | `src/components/ui/badge.tsx`             | canonical static token      | status/category labels                                      |
| Typography       | `src/components/ui/typography.tsx`        | canonical application text  | page/section/body/label/caption hierarchy                   |
| Avatar           | `src/components/ui/avatar.tsx`            | canonical                   | profile image and fallback initials                         |
| Sheet            | `src/components/ui/sheet.tsx`             | canonical existing          | side/bottom responsive panels                               |
| Popover          | `src/components/ui/base-popover.tsx`      | canonical existing          | contextual non-menu content                                 |
| Card             | `src/components/ui/card.tsx`              | canonical existing          | visual section surfaces                                     |
| Input            | `src/components/ui/input.tsx`             | canonical existing          | text input                                                  |
| Textarea         | `src/components/ui/textarea.tsx`          | canonical existing          | multiline text input                                        |
| Checkbox         | `src/components/ui/checkbox.tsx`          | canonical existing          | independent boolean selection                               |
| Separator        | `src/components/ui/separator.tsx`         | canonical existing          | semantic visual separation                                  |
| Tabs             | `src/components/ui/tabs.tsx`              | local custom contract       | content switching                                           |
| SegmentedControl | `src/components/ui/segmented-control.tsx` | canonical existing          | small exclusive option sets                                 |

## Canonical patterns

| Pattern           | Source                                    | Status                                  |
| ----------------- | ----------------------------------------- | --------------------------------------- |
| EmptyState        | `src/components/patterns/empty-state.tsx` | canonical                               |
| CommandDialog     | target                                    | deferred until Global Search migration  |
| ResponsiveOverlay | target                                    | defer until repeated contract is proven |

`DropdownMenu` now owns the complete action-menu primitive contract. Do not add
an alias-only `ActionMenu` wrapper. Create a semantic `ActionMenu` pattern only
when two or more consumers require the same richer product anatomy beyond the
DropdownMenu primitive.

Canonical inventory entries are active contracts. An entry with few or no
current consumers remains available for the next matching surface, but feature
code must not rebuild the same contract locally. Current adoption is enforced
for application typography outside HanziHome learner-rendering surfaces.

## Deliberately deferred

The following remain candidates, not approved primitives:

- Alert/callout;
- Skeleton standardization;
- Command/listbox composite;
- SettingsMenu row anatomy beyond the Header Gear and `/settings` hub;
- form field system consolidation.

Add them only after consumer inventory proves repeated semantics.

Generic guidance MUST NOT require `Alert`, `Empty`, standardized `Skeleton`,
`FieldGroup` or `ToggleGroup` while these contracts are deferred or replaced by
the canonical local components above.

## Migration priority

1. HanziHome tools:
   - DropdownMenu item/radio contracts.
2. Global Search:
   - typed Dialog variants;
   - EmptyState;
   - later CommandDialog composite.
3. Tooltip migration for icon-only controls currently relying on `title`.

## Settled settings IA

The Header Gear is a layout composition using `DropdownMenu` checkbox items
and separate HanziHome reader submenus for font, size, reveal and visibility.
Avatar remains a profile/logout Popover. The grouped settings hub uses local
`Tabs` plus labeled `Switch` rows. Do not create a generic `SettingsMenu`
wrapper until a second stable consumer proves richer shared anatomy.

The global Sidebar is also layout-owned: it groups existing route Links under
Học, Luyện, Năng lực and Cá nhân, initially opens the active route group, and
lets users toggle every group from its header. This is not a reusable navigation
primitive, and the Header Gear remains the sole global Settings entry point.

The visual system uses neutral opaque surfaces: controls are `rounded-lg`,
cards/panels/overlays are `rounded-xl`, and a semantic 1px border establishes
surface hierarchy. `Card` is flat by default; only explicit `elevated` and
primitive-owned overlays use small elevation. `app-gradient-hero` and
`app-glass-surface` are compatibility aliases only, not options for new feature
surface code.

The developer API page is feature-owned. It composes `PageHeader`, `Card`,
`Badge`, `Button`, `Separator` and `Typography`; static commands render inside
a `Card` with `Typography` code semantics. Endpoint details use native semantic
`details` / `summary`, not a generic Accordion or Swagger dependency. Do not
introduce a generic Swagger or code-block dependency unless a second product
surface proves that contract. Its API registry owns the public-v1 endpoint
list, operation-level request/response examples and current-app inventory;
integration-key management remains feature-local and must never surface a
Supabase browser access token.

## Important distinction

General application typography belongs to `Typography`.

Chinese lesson text, pinyin, reading-size preferences and Hanzi font selection
use the feature components in
`src/features/hanzihome/components/lesson-overview/hanzi-typography.tsx`.
Generic Chinese text outside HanziHome uses
`src/components/patterns/learner-text.tsx`.
