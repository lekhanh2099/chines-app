# UI Component Contracts

This is the canonical guide for choosing and composing UI in `chines-app`.

Local source code is the source of truth. Generic shadcn documentation helps
with concepts and upstream APIs but MUST NOT override customized local
components.

## 1. Selection matrix

| Need                               | Canonical contract                          | Notes                                                                                     |
| ---------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Text action / CTA                  | `Button`                                    | Use a semantic variant and size                                                           |
| Icon-only action                   | `Button` icon size                          | New code should not expand `IconButton` usage                                             |
| Modal task                         | `Dialog`                                    | Must have a title; use managed focus                                                      |
| Destructive confirmation           | Dialog confirmation pattern                 | Prefer a dedicated confirm pattern; do not use a generic modal without clear consequences |
| Side or bottom panel               | `Sheet`                                     | Side is a responsive behavior contract                                                    |
| Non-modal contextual content       | shared Popover wrapper                      | Feature code does not import Base UI directly                                             |
| List of commands/actions           | `ActionMenu` pattern                        | Missing contract: create before further hand-rolled menus                                 |
| Single-value selection             | `src/components/ui/select.tsx`              | Composable primitive                                                                      |
| Option-array convenience selection | target `OptionSelect` adapter               | `src/components/ui/select/index.tsx` is legacy and must not gain new consumers            |
| Form selection                     | canonical `FormSelect`                      | Must compose the shared Select system                                                     |
| Text input                         | `Input` or form field adapter               | Search/command input may use a dedicated composite                                        |
| Toggle setting                     | Switch or toggle Button with `aria-pressed` | Visual active state alone is insufficient                                                 |
| Checkbox state                     | `Checkbox`                                  | Use checkbox semantics                                                                    |
| Status/category label              | `Badge`                                     | Do not hand-build repeated pills                                                          |
| Visual section/card                | `Card`                                      | Use current local API, not assumed upstream Card anatomy                                  |
| Divider                            | `Separator`                                 | Avoid ad-hoc border divs for semantic separators                                          |
| Compact option set                 | `SegmentedControl`                          | Use for a small single-choice set                                                         |
| Content tabs                       | local `Tabs` contract                       | Current API is not standard shadcn Tabs                                                   |
| Global/feature search command      | target `CommandDialog` pattern              | Do not reproduce listbox keyboard logic per feature                                       |
| Avatar/profile image               | target `Avatar` primitive                   | Until added, keep raw avatar code isolated                                                |

## 2. Current source-of-truth paths

```text
src/components/ui/button.tsx
src/components/ui/dialog.tsx
src/components/ui/select.tsx
src/components/ui/sheet.tsx
src/components/ui/base-popover.tsx
src/components/ui/card.tsx
src/components/ui/badge.tsx
src/components/ui/input.tsx
src/components/ui/checkbox.tsx
src/components/ui/separator.tsx
src/components/ui/tabs.tsx
src/components/ui/segmented-control.tsx
```

Known parallel/legacy paths:

```text
src/components/ui/select/index.tsx
src/components/tanstack-form/field/SelectField.tsx
src/components/ui/icon-button.tsx
```

New feature work MUST NOT add consumers to a legacy path without an explicit
compatibility reason.

## 3. Primitive vs pattern vs feature

### Primitive

Owns:

- element/primitive anatomy;
- base semantics;
- focus/disabled/invalid behavior;
- tokens;
- variants;
- internal icon sizing;
- overlay stacking when applicable.

Examples: Button, DialogContent, SelectTrigger.

### Pattern

Owns repeated interaction composition.

Examples:

```text
ActionMenu
SettingsMenu
CommandDialog
ResponsiveOverlay
```

Patterns may compose multiple primitives. They do not own product data.

### Feature

Owns:

- product labels;
- business rules;
- query/form/store integration;
- feature-specific rendering;
- callbacks.

A feature SHOULD NOT recreate primitive or pattern anatomy.

## 4. `className` contract

Call-site classes are allowed for parent participation:

- width/max-width;
- flex/grid placement;
- responsive hide/show;
- parent-owned scroll size;
- `sr-only`;
- external spacing owned by the parent.

Call-site classes are forbidden for primitive internals:

- colors;
- border tone;
- radius;
- internal padding;
- typography;
- shadows;
- hover/focus/active recipes;
- z-index;
- primitive-owned icon dimensions.

Example:

```tsx
// Allowed: the parent page owns available width.
<SelectContent className="max-w-[calc(100vw-2rem)]" />

// Not allowed: consumer creates a second Select visual language.
<SelectTrigger className="rounded-2xl bg-purple-50 px-5 text-lg shadow-xl" />
```

If a prohibited variation is a repeated valid need, add a semantic typed
variant to the primitive.

## 5. Button contract

Use Button variants to express action meaning, not arbitrary palettes.

Required semantics:

- submit buttons explicitly use `type="submit"`;
- non-submit buttons use `type="button"`;
- icon-only buttons have an accessible label;
- toggle buttons expose state through `aria-pressed` or a dedicated control;
- loading buttons are disabled and expose visible progress;
- destructive actions use the destructive contract.

Target semantic sizes to add when implementation work begins:

```text
touch
toolbar
compact
menu
iconToolbar
iconRound
```

Do not add a size solely for one pixel value. Add it for a repeated interaction
density.

## 6. Dialog contract

Every Dialog requires:

- accessible title;
- purpose-specific description when useful;
- managed initial focus;
- Escape behavior;
- focus restoration;
- a close action unless the operation must block it;
- explicit loading/error behavior for async tasks.

Target reusable DialogContent variants:

```text
size: sm | md | lg | xl | command | editor
placement: center | top
scrollMode: body | content | none
closePlacement: content | header | none
```

A consumer may select a contract. It SHOULD NOT reimplement placement, close
button, scroll ownership and surface styling as a long utility string.

## 7. Popover and menu contract

Use generic Popover for contextual interactive content that is not an
application-style action menu.

A popup with `role="menu"` MUST use a complete menu interaction contract:

- menu button trigger;
- expanded state;
- menu items;
- radio/checkbox item state when needed;
- keyboard navigation;
- close-on-select behavior;
- disabled behavior;
- destructive tone;
- focus return.

Do not attach `role="menu"` to arbitrary children.

Target shared pattern:

```text
ActionMenu
ActionMenuTrigger
ActionMenuContent
ActionMenuSection
ActionMenuLabel
ActionMenuSeparator
ActionMenuItem
ActionMenuRadioItem
ActionMenuCheckboxItem
```

## 8. Select contract

Canonical IDs are strings at the UI Select boundary. Normalize once.

Do not maintain both an option object and scalar value as independent state.

Form adapters own:

- field value conversion;
- validation state;
- description/error association;
- blur handling.

Feature code owns:

- options;
- disabled conditions;
- business labels.

The Select primitive owns:

- trigger;
- content;
- item;
- focus;
- keyboard;
- overlay stack;
- visual contract.

## 9. Search/command contract

Search with keyboard-selected results is a composite widget, not merely an
Input inside a Dialog.

A reusable command surface must define:

- input semantics;
- results relationship;
- selected item;
- ArrowUp/ArrowDown;
- Enter;
- Escape;
- loading;
- initial state;
- empty state;
- error;
- direct actions;
- close control;
- footer help;
- focus restoration.

Do not place interactive buttons inside a listbox option. Separate command
actions and result options into a coherent composite contract.

## 10. shadcn workflow

Before adding/updating a component:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff
```

Then:

1. Read the local component.
2. Search all consumers.
3. Compare local API with upstream API.
4. Decide additive merge vs breaking migration.
5. STOP AND CONFIRM before overwrite or breaking change.

Never assume standard upstream Card, Tabs, Sheet, Dialog or Select anatomy
matches this repository.

## 11. Feature implementation checklist

Before writing JSX:

```text
User goal:
Primary action:
Information hierarchy:
States:
Existing primitive:
Existing pattern:
Missing contract:
Responsive behavior:
Keyboard behavior:
Risk:
```

After implementation:

- no direct primitive-library import in feature code;
- no new duplicated control recipe;
- no inaccessible custom interaction;
- no blank loading/initial state;
- desktop, iPad and mobile checked;
- final component choice documented in the handoff.
