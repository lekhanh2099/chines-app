# UI Component Inventory

Status date: 2026-07-17

This inventory records canonical UI contracts, legacy paths and missing patterns.
It is a routing document for contributors and agents, not a mandate to migrate
the entire repository in one pass.

## Canonical primitives

| Contract         | Source                                    | Status                      | Intended use                                                |
| ---------------- | ----------------------------------------- | --------------------------- | ----------------------------------------------------------- |
| Button           | `src/components/ui/button.tsx`            | canonical                   | commands, CTAs, icon actions, menu action styling           |
| Dialog           | `src/components/ui/dialog.tsx`            | canonical                   | modal tasks with typed size, placement and scroll ownership |
| DropdownMenu     | `src/components/ui/dropdown-menu.tsx`     | canonical                   | action menus, checkbox/radio menu items and submenus        |
| Tooltip          | `src/components/ui/tooltip.tsx`           | canonical                   | supplementary mouse/keyboard hints only                     |
| Select           | `src/components/ui/select.tsx`            | canonical primitive         | single-value selection                                      |
| Switch           | `src/components/ui/switch.tsx`            | canonical                   | boolean settings                                            |
| Chip             | `src/components/ui/chip.tsx`              | canonical interactive token | filters, removable actions and compact selectable controls  |
| Badge            | `src/components/ui/badge.tsx`             | canonical static token      | status/category labels                                      |
| Typography       | `src/components/ui/typography.tsx`        | canonical application text  | page/section/body/label/caption hierarchy                   |
| Avatar           | `src/components/ui/avatar.tsx`            | canonical                   | profile image and fallback initials                         |
| Sheet            | `src/components/ui/sheet.tsx`             | canonical existing          | side/bottom responsive panels                               |
| Popover          | `src/components/ui/base-popover.tsx`      | canonical existing          | contextual non-menu content                                 |
| Card             | `src/components/ui/card.tsx`              | canonical existing          | visual section surfaces                                     |
| Input            | `src/components/ui/input.tsx`             | canonical existing          | text input                                                  |
| Checkbox         | `src/components/ui/checkbox.tsx`          | canonical existing          | independent boolean selection                               |
| Separator        | `src/components/ui/separator.tsx`         | canonical existing          | semantic visual separation                                  |
| Tabs             | `src/components/ui/tabs.tsx`              | local custom contract       | content switching                                           |
| SegmentedControl | `src/components/ui/segmented-control.tsx` | canonical existing          | small exclusive option sets                                 |

## Canonical patterns

| Pattern           | Source                                    | Status                                  |
| ----------------- | ----------------------------------------- | --------------------------------------- |
| EmptyState        | `src/components/patterns/empty-state.tsx` | canonical                               |
| SettingsMenu      | target                                    | deferred until Profile migration        |
| CommandDialog     | target                                    | deferred until Global Search migration  |
| ResponsiveOverlay | target                                    | defer until repeated contract is proven |

`DropdownMenu` now owns the complete action-menu primitive contract. Do not add
an alias-only `ActionMenu` wrapper. Create a semantic `ActionMenu` pattern only
when two or more consumers require the same richer product anatomy beyond the
DropdownMenu primitive.

## Legacy or parallel contracts

New consumers must not be added without a compatibility reason:

```text
src/components/ui/select/index.tsx
src/components/tanstack-form/field/SelectField.tsx
src/components/ui/icon-button.tsx
```

## Deliberately deferred

The following remain candidates, not approved primitives:

- Alert/callout;
- Skeleton standardization;
- Command/listbox composite;
- OptionSelect adapter consolidation;
- SettingsMenu row anatomy;
- form field system consolidation.

Add them only after consumer inventory proves repeated semantics.

## Migration priority

1. Profile settings menu:
   - Avatar;
   - Badge;
   - Switch;
   - DropdownMenu or SettingsMenu pattern.
2. HanziHome tools:
   - DropdownMenu item/radio contracts.
3. Global Search:
   - typed Dialog variants;
   - EmptyState;
   - later CommandDialog composite.
4. Select consolidation.
5. Tooltip migration for icon-only controls currently relying on `title`.
6. Typography adoption by repeated shell/page patterns, not Chinese study text.

## Important distinction

General application typography belongs to `Typography`.

Chinese lesson text, pinyin, reading-size preferences and Hanzi font selection
remain owned by HanziHome-specific typography helpers. Do not flatten those
learning semantics into the generic Typography component.
