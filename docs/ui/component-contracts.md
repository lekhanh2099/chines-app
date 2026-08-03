# UI Component Contracts

This is the canonical guide for choosing and composing UI in `chines-app`.

Local source code is the source of truth. Generic shadcn, Radix and Base UI
documentation helps with concepts and upstream APIs but MUST NOT override
customized local components.

## 1. Selection matrix

| Need                              | Canonical contract                      | Notes                                          |
| --------------------------------- | --------------------------------------- | ---------------------------------------------- |
| Text action / CTA                 | `Button`                                | Use semantic variant and interaction density   |
| Icon-only action                  | `Button` icon size + optional `Tooltip` | Always retain an accessible name               |
| Modal task                        | `Dialog`                                | Choose typed size, placement and scroll mode   |
| Destructive confirmation          | confirmation Dialog pattern             | Consequence and pending state must be explicit |
| Side or bottom panel              | `Sheet`                                 | Side is a responsive behavior contract         |
| Non-modal contextual content      | shared Popover wrapper                  | Not an action menu                             |
| Action/function list              | `DropdownMenu`                          | Full keyboard/menu semantics                   |
| Supplementary hint                | `Tooltip`                               | Never hide required information in a tooltip   |
| Single-value selection            | `src/components/ui/select.tsx`          | Composable primitive                           |
| String option-array selection     | `OptionSelect`                          | Typed convenience adapter over `Select`        |
| Radio selection                   | `RadioGroup`                            | Typed string-valued exclusive choice           |
| Boolean setting                   | `Switch`                                | Use label and description outside the control  |
| Independent boolean selection     | `Checkbox`                              | Checkbox semantics                             |
| Interactive compact filter/action | `Chip`                                  | Optional `pressed` exposes `aria-pressed`      |
| Static status/category            | `Badge`                                 | Not clickable                                  |
| Application text hierarchy        | `Typography`                            | Do not replace HanziHome study typography      |
| Avatar/profile image              | `Avatar`                                | Always include fallback initials               |
| Visual section/card               | `Card`                                  | Use the current local API                      |
| Divider                           | `Separator`                             | Avoid repeated border-div recipes              |
| Compact exclusive options         | `SegmentedControl`                      | Small single-choice set                        |
| Content tabs                      | local `Tabs` contract                   | Not standard shadcn Tabs                       |
| Empty/no-result state             | `EmptyState`                            | Initial, empty and error remain distinct       |
| Search command surface            | target `CommandDialog`                  | Deferred until Global Search migration         |

See `docs/ui/component-inventory.md` for implementation status and migration
priority.

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
src/components/ui/input.tsx
src/components/ui/option-select.tsx
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

Feature-owned learner typography:

```text
src/features/hanzihome/components/lesson-overview/hanzi-typography.tsx
src/components/patterns/learner-text.tsx
```

## 3. Primitive, pattern and feature ownership

### Primitive

Owns element/primitive anatomy, semantics, focus, disabled/invalid behavior,
tokens, variants, internal icon sizing and overlay stacking.

### Pattern

Owns repeated cross-feature interaction composition.

Examples:

```text
EmptyState
SettingsMenu
CommandDialog
ResponsiveOverlay
```

### Feature

Owns product labels, data, business rules, query/form/store integration and
callbacks.

Feature code MUST NOT reproduce primitive or pattern anatomy.

## 4. `className` ownership

Allowed at call sites:

- parent-imposed width/max-width;
- grid/flex placement;
- responsive visibility;
- parent-owned scroll constraints;
- external spacing owned by the parent;
- `sr-only` and equivalent accessibility utilities.

Forbidden at call sites:

- color/tone;
- border appearance;
- radius;
- internal padding/density;
- typography;
- shadow;
- hover/focus/active recipes;
- overlay z-index;
- primitive-owned icon sizing.

A repeated valid variation becomes a semantic typed variant. A one-off pixel
value does not automatically justify a new variant.

## 5. Button

Stable variants express meaning. Stable sizes express interaction density.

New semantic sizes:

```text
touch
compact
toolbar
menu
icon-toolbar
icon-round
inline
```

Rules:

- non-submit buttons default to `type="button"`;
- submit buttons set `type="submit"`;
- icon-only buttons require an accessible label;
- toggle buttons expose state with `aria-pressed` or use Switch;
- destructive menu actions use `menuDestructive`;
- loading actions remain disabled and visibly pending.

## 6. Dialog

`DialogContent` supports:

```text
size: sm | md | lg | xl | command | editor
placement: center | top
scrollMode: body | content | none
surface: default | glass
```

Defaults preserve the previous centered `max-w-2xl` contract.

Every dialog requires a title, managed focus, Escape behavior, focus
restoration and an explicit async state when applicable.

Do not encode placement, max width, scroll ownership and surface styling as a
large feature-level class string when a typed contract exists.

## 7. DropdownMenu and Popover

Use `DropdownMenu` for a list of actions/functions. It owns:

- trigger state;
- managed focus;
- arrow-key navigation;
- typeahead;
- checkbox/radio items;
- submenus;
- disabled/destructive states;
- close and focus return.

Use Popover for contextual interactive content that is not an application menu.

Do not set `role="menu"` on arbitrary Popover children.

## 8. Tooltip

Tooltip is supplementary only.

Use it for dense icon actions where the trigger already has a clear accessible
name. Do not put required instructions, errors, descriptions or touch-critical
information only inside Tooltip.

For an info icon whose purpose is to reveal content, use Popover instead.

`TooltipProvider` is installed at the root layout.

## 9. Chip and Badge

`Badge` is static metadata.

`Chip` is an interactive compact control. Use `pressed` only for selectable
chips so the component exposes `aria-pressed`.

Do not render a static status as a disabled Chip.

## 10. Typography

General shell/page hierarchy uses Typography variants:

```text
display
pageTitle
sectionTitle
cardTitle
body
bodySmall
label
caption
overline
code
```

Tone, weight, alignment and line clamp are typed separately.

Canonical application typography is mandatory, not opt-in. Route, layout and
feature code uses `Typography` for headings, paragraphs, captions, overlines
and code-style application text. It does not recreate those contracts with raw
`h1`–`h6` or `p` JSX.

`Typography` preserves semantic HTML through its `as` prop. Native structural
or semantic elements remain valid only when they do not recreate an application
typography recipe.

HanziHome Chinese text, pinyin, font selection and learner reading-size controls
use `HanziText`, `ReaderHanziText`, `AdaptiveStudyText`, `PinyinText`,
`TranslationText`, `StudyInstructionText` or `HanziFontPreview`. These owners
set language metadata and reader font/size. Call sites MUST NOT repair learner
text with `lang`, inline typography `style`, or font/size utility classes.

## 11. Avatar

Use Avatar with AvatarImage and AvatarFallback.

Fallback initials are mandatory because remote profile images can fail or
change hosts. Feature code should not repeat image-failure state solely to
recreate fallback behavior.

## 12. Switch

Use Switch for boolean settings such as lookup, theme preference or focus mode
when the interaction is a direct on/off state.

The visible row label and description remain outside the Switch. The control
needs an accessible label or labelled relationship.

## 13. Select

Canonical UI value is normalized once, normally to string.

Form adapters own value conversion, validation, description/error association
and blur handling. Feature code owns options and business disabled conditions.

## 14. Search/command

A keyboard-selected search surface is a composite widget, not only Input inside
Dialog.

It must define input/result relationship, selection, Arrow keys, Enter, Escape,
loading, initial state, empty state, error, direct actions, close control and
focus restoration.

## 15. shadcn workflow

Before add/update:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff
```

Read local source and consumers. STOP AND CONFIRM before overwrite, dependency
addition or breaking API migration.

## 16. Feature checklist

Before JSX:

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
- no duplicated control recipe;
- no inaccessible custom interaction;
- no blank loading/initial state;
- desktop, iPad and mobile checked;
- component choice documented in the handoff.
