# UI Component Inventory

Status date: 2026-08-11

This inventory records canonical UI contracts, feature-owned compositions and
missing patterns. Local source and `docs/ui/component-contracts.md` override
generic shadcn or vendor guidance.

## Canonical primitives

| Contract         | Source                                    | Status                      | Intended use                                                |
| ---------------- | ----------------------------------------- | --------------------------- | ----------------------------------------------------------- |
| Button           | `src/components/ui/button.tsx`            | canonical                   | commands, CTAs, icon actions and navigation rows            |
| Dialog           | `src/components/ui/dialog.tsx`            | canonical                   | modal tasks with typed size, placement and scroll ownership |
| DropdownMenu     | `src/components/ui/dropdown-menu.tsx`     | canonical                   | action menus, checkbox/radio items and submenus              |
| Tooltip          | `src/components/ui/tooltip.tsx`           | canonical                   | supplementary mouse/keyboard hints only                     |
| Select           | `src/components/ui/select.tsx`            | canonical                   | single-value selection; owns breadcrumb appearance          |
| OptionSelect     | `src/components/ui/option-select.tsx`     | canonical adapter           | string-valued option-array selection                        |
| RadioGroup       | `src/components/ui/radio-group.tsx`       | canonical                   | exclusive choice                                            |
| Switch           | `src/components/ui/switch.tsx`            | canonical                   | boolean settings                                            |
| Chip             | `src/components/ui/chip.tsx`              | canonical interactive token | filters and compact selectable actions                      |
| Badge            | `src/components/ui/badge.tsx`             | canonical static token      | status/category labels; owns optional icon sizing           |
| Typography       | `src/components/ui/typography.tsx`        | canonical application text  | page/section/body/label/caption hierarchy                   |
| Avatar           | `src/components/ui/avatar.tsx`            | canonical                   | profile image and fallback initials                         |
| IconTile         | `src/components/ui/icon-tile.tsx`         | canonical                   | decorative icon tile with typed tone and size               |
| Sheet            | `src/components/ui/sheet.tsx`             | canonical                   | side/bottom responsive panels                               |
| Popover          | `src/components/ui/base-popover.tsx`      | canonical                   | contextual non-menu content                                 |
| Card             | `src/components/ui/card.tsx`              | canonical                   | section, subtle and interactive surfaces; supports asChild  |
| Input            | `src/components/ui/input.tsx`             | canonical                   | text input with density and surface                         |
| Textarea         | `src/components/ui/textarea.tsx`          | canonical                   | multiline text input                                        |
| Checkbox         | `src/components/ui/checkbox.tsx`          | canonical                   | independent boolean selection                               |
| Separator        | `src/components/ui/separator.tsx`         | canonical                   | semantic visual separation                                  |
| PageHeader       | `src/components/ui/page-header.tsx`       | canonical                   | page heading, description, meta and actions                 |
| Tabs             | `src/components/ui/tabs.tsx`              | canonical local contract    | content-panel switching                                     |
| SegmentedControl | `src/components/ui/segmented-control.tsx` | canonical                   | compact exclusive choice; typed density/surface             |

## Canonical patterns

| Pattern           | Source                                    | Status                                  |
| ----------------- | ----------------------------------------- | --------------------------------------- |
| EmptyState        | `src/components/patterns/empty-state.tsx` | canonical                               |
| CommandDialog     | target                                    | deferred until Global Search migration  |
| ResponsiveOverlay | target                                    | defer until repeated contract is proven |

## Feature-owned compositions

These are product/domain compositions, not replacement primitives.

| Composition              | Owner                                                        | Contract |
| ------------------------ | ------------------------------------------------------------ | -------- |
| Library CRUD actions     | `features/hanzihome/components/library/LibraryCrudActionsMenu.tsx` | one overflow menu per course/book/lesson; confirm delete |
| HanziHome workspace bar  | `features/hanzihome/components/layout/WorkspaceToolbar.tsx`  | feature chrome only; children remain canonical controls |
| HanziHome reader menu    | `features/hanzihome/HanziHomeReadingSettingsSection.tsx`     | contextual lesson-only quick reader preferences |

Do not promote a feature composition to `src/components/ui` unless its semantic
contract is shared outside that feature.

## Current information architecture

- Sidebar owns the global route map: Học, Luyện, Năng lực and Cá nhân.
- Home is a continuation dashboard, not a second sitemap.
- Sidebar route changes guarantee the active route group is expanded.
- Header Gear always owns global Theme / lookup / Focus preferences.
- Reader settings appear in Gear only in a HanziHome lesson workspace.
- Avatar owns identity/provider context and logout only.
- `/settings` remains the complete preferences hub.
- HanziHome Library uses one major collection surface, separator-based course
  hierarchy and book cards as the terminal interactive level.

## Density system

```text
44px : standalone/touch controls
36px : toolbar and command controls
40px : menu rows
content-sized : inline text actions
```

Input, Select and Button consumers sharing a row must use the same density
family.

## Design-system enforcement

`scripts/check-ui-standards.mjs` rejects visual `className` repair on canonical
visual components, direct Radix/Base imports in features, raw application
controls, raw application typography, anatomy-descendant overrides, arbitrary
feature z-index and legacy glass/hero escape hatches.

The guard has no baseline. New debt must be fixed at the semantic owner rather
than allowlisted.

## Deliberately deferred

The following remain candidates, not approved primitives:

- Alert/callout;
- Skeleton standardization;
- Command/listbox composite;
- generic SettingsMenu row anatomy;
- form field system consolidation;
- generic CRUD ActionMenu alias.

`DropdownMenu` is already the action-menu primitive. Do not add an alias-only
wrapper. A richer cross-feature pattern requires at least two stable consumers
with the same product anatomy.

## Migration priorities after this refactor

1. Global Search: replace the current HanziHome-owned command surface with a
   feature-neutral command/search boundary when its data contract is redesigned.
2. Continue shrinking Header knowledge of HanziHome business data without
   moving feature state into duplicated React state.
3. Tooltip migration for remaining icon-only controls that rely only on `title`.
4. Standardize skeletons only after repeated anatomy is proven.

## Visual system

The app uses neutral opaque surfaces. Controls are `rounded-lg`;
cards/panels/overlays are `rounded-xl`; semantic 1px borders establish most
surface hierarchy. `Card` is flat by default. Overlay elevation remains inside
primitive owners.

`app-gradient-hero` and `app-glass-surface` are compatibility aliases only.
Feature code must not add new consumers.

## Learner typography distinction

General application text belongs to `Typography`.

Chinese lesson text, pinyin, reading-size preferences and Hanzi font selection
use the feature components in
`src/features/hanzihome/components/lesson-overview/hanzi-typography.tsx`.
Generic Chinese text outside HanziHome uses
`src/components/patterns/learner-text.tsx`.

Learner typography must not be used as an icon tile, badge, status pill or
generic surface wrapper.
