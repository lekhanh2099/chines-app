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
| Compact preference inside a menu  | `DropdownMenuCheckboxItem`              | Keeps checkbox-menu semantics                  |
| Supplementary hint                | `Tooltip`                               | Never hide required information in a tooltip   |
| Single-value selection            | `src/components/ui/select.tsx`          | Composable primitive                           |
| String option-array selection     | `OptionSelect`                          | Typed convenience adapter over `Select`        |
| Radio selection                   | `RadioGroup`                            | Typed string-valued exclusive choice           |
| Boolean setting                   | `Switch`                                | Use label and description outside the control  |
| Independent boolean selection     | `Checkbox`                              | Checkbox semantics                             |
| Interactive compact filter/action | `Chip`                                  | Optional `pressed` exposes `aria-pressed`      |
| Static status/category            | `Badge`                                 | Not clickable; do not use for ordinary counts  |
| Application text hierarchy        | `Typography`                            | Do not replace HanziHome study typography      |
| Avatar/profile image              | `Avatar`                                | Always include fallback initials               |
| Decorative icon tile              | `IconTile`                              | Owns tile tone, radius and icon size            |
| Visual section/card               | `Card`                                  | Typed surface, padding and interactive state    |
| Divider                           | `Separator`                             | Avoid repeated border-div recipes              |
| Compact exclusive options         | `SegmentedControl`                      | Small single-choice set, exposes `aria-pressed`|
| Content tabs                      | local `Tabs` contract                   | Use only when content-panel semantics are real |
| Empty/no-result state             | `EmptyState`                            | Initial, empty and error remain distinct       |
| Page heading                      | `PageHeader`                            | Typed density; no descendant restyling         |
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
CommandDialog
ResponsiveOverlay
```

### Feature

Owns product labels, data, business rules, query/form/store integration and
callbacks.

Feature code MUST NOT reproduce primitive or pattern anatomy.

A feature may own a repeated product-specific composition only when the
composition has a stable domain meaning. Example:
`LibraryCrudActionsMenu` owns the course/book/lesson edit-action grammar; it
does not replace `DropdownMenu` itself.

## 4. `className` ownership

Allowed at canonical-component call sites:

- parent-imposed width/max-width;
- grid/flex placement;
- responsive visibility;
- parent-owned scroll constraints;
- external spacing owned by the parent;
- `sr-only` and equivalent accessibility utilities.

Forbidden at canonical-component call sites:

- color/tone;
- border appearance;
- radius;
- internal padding/density;
- typography;
- shadow;
- hover/focus/active recipes;
- overlay z-index;
- primitive-owned icon sizing;
- descendant selectors that reach into component anatomy, such as
  `[&_h1]:...` or `[&_p]:...`.

A repeated valid variation becomes a semantic typed variant. A one-off pixel
value does not automatically justify a new variant.

`scripts/check-ui-standards.mjs` enforces this for canonical visual contracts,
including Button, form controls, Card, Badge, SelectTrigger, PageHeader,
SegmentedControl and IconTile. Do not add a baseline to hide violations.

## 4.1 App-page and scroll ownership

`PageContainer` owns the normal application-page frame. Its direct content is
fluid (`w-full min-w-0`) with responsive gutters; it MUST NOT center or apply a
page-level `max-width`.

The authenticated App Shell owns the available viewport and normal page scroll.
Feature pages MUST NOT subtract guessed Header or mobile-navigation heights
with `calc(100dvh - ...)`. A contained workspace that needs internal scrolling
inherits `h-full min-h-0` from the shell and assigns overflow only to the actual
pane that scrolls.

Reading measure, review cards and dialogs may constrain their own content when
that improves comprehension or the task. Those constraints stay inside the
feature surface; they must not shrink the application page or create empty side
gutters on desktop.

## 5. Interaction density

Density is a cross-component contract, not a component-local nickname.

```text
Touch / standalone action : 44px minimum (`Button sm/default`, default Input/Select)
Toolbar / command bar      : 36px (`toolbar`, `icon-toolbar`, compact Input, sm Select)
Menu row                   : 40px (`menu`)
Inline text action         : content-sized (`inline`)
```

Controls sharing one row MUST use the same density family. Do not pair a 36px
Select with a 44px Button inside a compact toolbar.

## 6. Button

Stable variants express meaning. Stable sizes express interaction density.

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

Legacy aliases may remain while consumers are migrated, but new feature code
must choose the semantic family above.

Rules:

- non-submit buttons default to `type="button"`;
- submit buttons set `type="submit"`;
- command bars use `toolbar` for labeled actions and `icon-toolbar` for icon-only controls;
- contextual navigation buttons use `navigation` while inactive and `active` while selected;
- icon-only buttons require an accessible label;
- toggle buttons expose state with `aria-pressed` or use Switch;
- destructive menu actions use the destructive DropdownMenu tone or `menuDestructive` where a Button row is appropriate;
- loading actions remain disabled and visibly pending.

## 7. Card and surface hierarchy

`Card` owns radius, border, surface, padding and interactive hover/focus state.

Stable variants include:

```text
default
section
subtle
elevated
interactive
```

`interactive` may be composed with `asChild` for a Link when the complete card
is one navigation target.

Do not write:

```tsx
<Card className="rounded-xl border bg-bg-card p-4 hover:bg-bg-elevated" />
```

Use typed `variant` and `padding` instead.

Avoid card-in-card-in-card hierarchy. Prefer:

```text
major surface Card
  section heading
  Separator / whitespace
  terminal interactive cards or rows
```

A hierarchy level that only groups children usually does not need its own
background, radius and border.

## 8. PageHeader and IconTile

`PageHeader` owns the title/description hierarchy and supports typed density.
Callers provide title, description, optional eyebrow, meta and actions. They do
not restyle internal `h1` or `p` nodes through descendant selectors.

`IconTile` is the canonical decorative square/icon container. Typography and
learner-text components must not be used as generic visual wrappers for icon
tiles, status pills or badges.

## 9. Dialog

`DialogContent` supports:

```text
size: sm | md | lg | xl | command | editor
placement: center | top
scrollMode: body | content | none
surface: default | glass
```

Every dialog requires a title, managed focus, Escape behavior, focus
restoration and an explicit async state when applicable.

Destructive flows require either a confirmation dialog with the consequence and
pending state, or an explicit recoverable Undo contract. A button labeled
"Xóa" must not silently perform an unrecoverable operation.

## 10. DropdownMenu and Popover

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

Repeated edit/reorder/delete icon clusters are action menus, not toolbars. The
HanziHome library uses one overflow menu per course/book/lesson and keeps delete
confirmation separate from the menu primitive.

## 10.1 Settings information architecture

Global preferences have one Header entry point:

- Gear always exposes global Theme, lookup and Focus preferences;
- HanziHome reader controls appear in Gear only while an actual lesson
  workspace is active;
- reader font choices preview the selected Hanzi font rather than exposing only
  a font name;
- `/settings?section=reading` remains the full reader-settings hub;
- Avatar owns identity/provider context and logout only.

Use a labeled `Switch` for a full settings-page row. Use
`DropdownMenuCheckboxItem` for the equivalent compact Gear action.

Reader quick settings use the second-level DropdownMenu contract: the top-level
menu lists reader groups and selecting one replaces that menu content with its
radio or checkbox choices plus an explicit return item.

## 11. Navigation and page information architecture

The global Sidebar owns the application sitemap. Home MUST NOT recreate the
same sitemap as large navigation cards.

Home answers continuation questions:

```text
What was I learning?
What recent work should I continue?
What needs attention next?
```

The Sidebar groups routes as Học, Luyện, Năng lực and Cá nhân. When pathname
changes, the group containing the active route must be expanded so the current
location is never hidden inside a collapsed group. Users may keep other groups
open.

HanziHome module navigation is contextual, not a second global Sidebar.

## 12. SegmentedControl and Tabs

Use `SegmentedControl` for a compact exclusive option set such as view mode,
active pane or module selector when the interaction is a pressed single-choice
group. It owns the active/inactive Button grammar and exposes `aria-pressed`.
It supports typed surface and density; callers do not repair its background or
padding with `className`.

Use `Tabs` only when the interaction truly exposes content-panel tab semantics.
Do not hand-build `role="tab"` on Buttons without the complete tab keyboard and
panel relationship contract.

## 13. Chip and Badge

`Badge` is static status/category metadata. It owns pill anatomy and icon size.
Ordinary numeric facts such as "25 bài" or "2 quyển" normally render as subdued
Typography; do not turn every count into a Badge.

`Chip` is an interactive compact control. Use `pressed` only for selectable
chips so the component exposes `aria-pressed`.

## 14. Typography

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

Canonical application typography is mandatory. Route, layout and feature code
uses `Typography` for headings, paragraphs, captions, overlines and code-style
application text.

HanziHome Chinese text, pinyin, font selection and learner reading-size controls
use `HanziText`, `ReaderHanziText`, `AdaptiveStudyText`, `PinyinText`,
`TranslationText`, `StudyInstructionText` or `HanziFontPreview`. These owners
set language metadata and reader font/size.

Learner typography is for learner content. It must not become a generic wrapper
for borders, icon tiles, status pills or application metadata.

## 15. Avatar

Use Avatar with AvatarImage and AvatarFallback. Fallback initials are mandatory.
Provider identity is static metadata and uses Badge rather than a hand-built
Typography pill.

## 16. Select

Canonical UI value is normalized once, normally to string.

Form adapters own value conversion, validation, description/error association
and blur handling. Feature code owns options and business disabled conditions.

`SelectTrigger` supports a typed `breadcrumb` variant for Header lesson
selection. Header/layout code must not export a visual class recipe to repair the
Select primitive from the outside.

## 17. Search/command

A keyboard-selected search surface is a composite widget, not only Input inside
Dialog. It must define input/result relationship, selection, Arrow keys, Enter,
Escape, loading, initial state, empty state, error, direct actions, close control
and focus restoration.

## 18. Visual system

Global visual recipes have explicit ownership:

- `nova-shell-*` is opaque app chrome with a 1px divider only;
- `nova-page` is the neutral content canvas;
- `app-gradient-hero` and `app-glass-surface` are compatibility aliases only;
- `hanzihome-liquid-*` is limited to HanziHome workspace chrome;
- `app-brand-gradient` is identity and compact emphasis only.

Flat-surface grammar is shared across the app: controls use `rounded-lg`, while
cards, panels and overlays use `rounded-xl`; cards and shell surfaces rely on a
1px semantic border rather than decorative shadow. Feature and layout code must
not add `backdrop-blur`, legacy hero/glass recipes or large overlay shadows.

Feature code uses semantic tokens. Named/raw color recipes belong to tokens or
primitive owners, not feature JSX.

## 19. Developer API surface

Developer API documentation is a feature page, not a third-party Swagger
surface. It composes PageHeader, Card, Badge, Button, Separator and Typography;
endpoint details reuse native semantic `details` / `summary` disclosure.

Never render or copy a browser/Supabase user access token in the page.
Integration-key raw secrets are revealed once only by the key manager and are
not retained in client state after its Dialog closes.

## 20. shadcn workflow

Before add/update:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff
```

Read local source and consumers. STOP AND CONFIRM before overwrite, dependency
addition or breaking API migration.

## 21. Feature checklist

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

- no direct primitive-library import in feature code;
- no duplicated visual/control recipe;
- no canonical primitive repaired by visual `className`;
- no inaccessible custom interaction;
- no blank loading/initial state;
- no hard-coded shell-height subtraction;
- server state remains in TanStack Query;
- form state remains in TanStack Form;
- URL/shareable state remains in route/search params;
- desktop, iPad and mobile checked when visual behavior changed;
- component choice and residual risk documented in the handoff.
