# UI Component Inventory

Status date: 2026-08-11

This inventory records canonical UI contracts, stable feature compositions and
known future migrations. Local source and `docs/ui/component-contracts.md`
override generic shadcn or vendor guidance.

## Canonical primitives

| Contract         | Source                                    | Status | Intended use |
| ---------------- | ----------------------------------------- | ------ | ------------ |
| Button           | `src/components/ui/button.tsx`            | canonical | commands, CTAs, icon actions, navigation rows |
| Dialog           | `src/components/ui/dialog.tsx`            | canonical | modal tasks |
| DropdownMenu     | `src/components/ui/dropdown-menu.tsx`     | canonical | action/checkbox/radio menus |
| Tooltip          | `src/components/ui/tooltip.tsx`           | canonical | supplementary hints |
| Select           | `src/components/ui/select.tsx`            | canonical | single-value selection; breadcrumb variant |
| OptionSelect     | `src/components/ui/option-select.tsx`     | canonical adapter | string option arrays |
| RadioGroup       | `src/components/ui/radio-group.tsx`       | canonical | exclusive selection |
| Switch           | `src/components/ui/switch.tsx`            | canonical | boolean settings |
| Chip             | `src/components/ui/chip.tsx`              | canonical | interactive compact token |
| Badge            | `src/components/ui/badge.tsx`             | canonical | static status/category |
| Typography       | `src/components/ui/typography.tsx`        | canonical | application text hierarchy |
| Avatar           | `src/components/ui/avatar.tsx`            | canonical | profile image/fallback |
| IconTile         | `src/components/ui/icon-tile.tsx`         | canonical | decorative icon tile |
| Sheet            | `src/components/ui/sheet.tsx`             | canonical | responsive side/bottom panels |
| Popover          | `src/components/ui/base-popover.tsx`      | canonical | contextual non-menu content |
| Card             | `src/components/ui/card.tsx`              | canonical | section/subtle/interactive surfaces |
| Input            | `src/components/ui/input.tsx`             | canonical | text input + density |
| Textarea         | `src/components/ui/textarea.tsx`          | canonical | multiline input |
| Checkbox         | `src/components/ui/checkbox.tsx`          | canonical | independent boolean selection |
| Separator        | `src/components/ui/separator.tsx`         | canonical | semantic separation |
| PageHeader       | `src/components/ui/page-header.tsx`       | canonical | page heading/description/meta/actions |
| Tabs             | `src/components/ui/tabs.tsx`              | canonical local contract | real content-panel tabs |
| SegmentedControl | `src/components/ui/segmented-control.tsx` | canonical | compact pressed single-choice set |

## Canonical patterns

| Pattern           | Source                                    | Status |
| ----------------- | ----------------------------------------- | ------ |
| EmptyState        | `src/components/patterns/empty-state.tsx` | canonical |
| CommandDialog     | target                                    | deferred until global-search product migration |
| ResponsiveOverlay | target                                    | deferred until repeated contract is proven |

## Stable feature-owned compositions

These are product/domain compositions, not replacement primitives.

| Composition | Owner | Contract |
| ----------- | ----- | -------- |
| Library CRUD actions | `src/features/hanzihome/components/library/LibraryCrudActionsMenu.tsx` | one overflow menu per course/book/lesson + confirmation delete |
| HanziHome workspace bar | `src/features/hanzihome/components/layout/WorkspaceToolbar.tsx` | feature chrome; children remain canonical controls |
| HanziHome reader quick menu | `src/features/hanzihome/HanziHomeReadingSettingsSection.tsx` | lesson-toolbar-only font/size/reveal/visibility preferences |
| HanziHome Header context bridge | `src/features/hanzihome/components/layout/HanziHomeHeaderContextBridge.tsx` | owner-safe lesson breadcrumb registration into shared Header slot |
| HanziHome search bridge | `src/features/hanzihome/search/HanziHomeGlobalSearchBridge.tsx` | feature data/results/navigation over shared open/query interaction state |

Do not promote these to `src/components/ui` unless the same semantic contract is
proven outside the feature.

## Shared shell interaction stores

| Store | Scope |
| ----- | ----- |
| `header-toolbar-store.ts` | ReactNode slot registration for route/feature Header context; owner-safe cleanup |
| `global-search-store.ts` | search open/query interaction state only; no search result/domain data |
| `focus-mode-store.ts` | cross-route focus preference |
| `dictionary-lookup-store.ts` | route-scoped lookup preference |

Shared stores must not become a back door for copying TanStack Query/server data
into global client state.

## Current information architecture

- Sidebar owns the global route map: Học, Luyện, Năng lực and Cá nhân.
- Home is a continuation dashboard, not a second sitemap.
- Sidebar route changes guarantee the active route group is expanded.
- Shared Header owns global search command state, global Gear preferences,
  profile, and a generic context slot only.
- Shared Header does not import HanziHome implementation code.
- Gear contains global Theme / lookup / Focus preferences only.
- Reader quick settings live in the HanziHome lesson workspace toolbar.
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

Input, Select and Button consumers sharing a row use the same density family.

## Design-system enforcement

`scripts/check-ui-standards.mjs` rejects:

- direct Radix/Base imports outside the UI boundary;
- raw application controls and application heading/paragraph typography;
- visual `className` repair on canonical visual components;
- component-anatomy descendant selectors;
- arbitrary feature z-index;
- arbitrary raw color/gradient escape hatches;
- legacy glass/hero/large-elevation feature escape hatches.

The guard has no baseline. Fix debt at the semantic owner instead of allowlisting
new consumers.

The current guard does not yet prove all named Tailwind palette utilities are
absent. That expansion requires a repo-wide executable migration and must not be
claimed from code-search inference alone.

## Deliberately deferred

The following remain candidates, not approved primitives:

- Alert/callout;
- Skeleton standardization;
- feature-neutral command/listbox composite;
- generic SettingsMenu row anatomy;
- form field system consolidation;
- generic CRUD ActionMenu alias.

DropdownMenu is already the action-menu primitive. Do not create an alias-only
wrapper.

## Migration priorities after this refactor

1. Replace the current HanziHome-backed global search product with a
   feature-neutral command/search data contract only if multiple search domains
   actually require it. Keep Header feature-neutral during that migration.
2. Audit remaining `title`-only icon hints and migrate to Tooltip where the hint
   adds value beyond the accessible name.
3. Standardize skeleton anatomy only after repeated cross-feature structure is
   proven.
4. Expand named-palette enforcement only together with a full repo migration and
   executable `npm run check` evidence.

## Visual system

The app uses neutral opaque surfaces. Controls are `rounded-lg`;
cards/panels/overlays are `rounded-xl`; semantic 1px borders establish most
surface hierarchy. Card is flat by default. Overlay elevation remains inside
primitive owners.

`app-gradient-hero` and `app-glass-surface` are compatibility aliases only.
Feature code must not add new consumers.

## Learner typography distinction

General application text belongs to Typography.

Chinese lesson text, pinyin, reading-size preferences and Hanzi font selection
use the feature components in
`src/features/hanzihome/components/lesson-overview/hanzi-typography.tsx`.
Generic Chinese text outside HanziHome uses
`src/components/patterns/learner-text.tsx`.

Learner typography must not be used as an icon tile, badge, status pill or
generic surface wrapper.
