---
name: frontend-ui-system
description: Design, implement, refactor, audit, or review UI and UX in chines-app. Use for information architecture, user flow, component reuse, design system, controls, settings, navigation, responsive layout, iPad/mobile, accessibility, typography, tokens, states, or visual consistency.
compatibility: chines-app local shadcn-style components; Tailwind CSS 4; Radix and Base UI wrappers; TanStack Query/Form/Store
metadata:
  author: chines-app
  version: "3.6"
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

Read the local primitive/pattern source before changing or recreating it. Local source overrides generic examples.

For shadcn changes, inspect current source and use CLI dry-run/diff before overwriting anything.

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
- A category with immediate child choices = real submenu.
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

## 9. Surface hierarchy

Hierarchy is not “more cards”. Prefer:

```text
major surface
  -> whitespace / Separator
  -> terminal interactive rows/cards only where needed
```

Avoid card-inside-card-inside-card layouts. Use Badge for state/category, not every metadata count.

Home is a continuation/attention surface, not a duplicate sitemap. Sidebar owns global route discovery.

## 10. Shell, tablet and mobile

Normal pages use `PageContainer`. App Shell owns viewport height; feature pages do not subtract guessed header/nav sizes with hard-coded `calc(100dvh - ...)`.

Treat iPad portrait around 820px as a tablet workspace, not squeezed desktop. Persistent Sidebar starts at `lg`; below that, quick navigation plus a full-navigation Sheet must keep all global routes reachable.

Use two columns from `md` when both retain readable width and no horizontal overflow. Do not postpone every useful layout until `xl` if it creates empty tablet space.

PageHeader owns title/description hierarchy. Actions must wrap/shrink without starving the title or overflowing the viewport.

## 11. Settings and contextual controls

Header Gear is global only: theme, route-scoped lookup, focus mode, link to full settings.

Feature-specific reader controls stay in the lesson workspace.

Reading settings should provide direct live preview of font, size, reveal behavior, pinyin, meaning and answers. On tablet/wide screens preview may sit beside controls; on narrow screens it follows in document flow.

Use real DropdownMenu submenus for grouped quick choices instead of replacing the whole menu with a fake “Back” flow.

## 12. Chinese learner typography

The selected Hanzi reader font is the authoritative learner-font preference across authenticated learning surfaces unless a UI explicitly previews another font.

Use:

- pure Hanzi -> `HanziText`, `ReaderHanziText` or `LearnerHanziText`;
- mixed Vietnamese/Chinese -> `HanziAwareText` / `HanziInlineText`;
- pinyin -> `PinyinText`;
- preview-only font samples -> `HanziFontPreview`.

Do not force Songti/Xingkai/system font locally for normal learner content. Do not use a Traditional-Chinese-only web font as the fallback for Mainland `zh-CN` content.

System font names such as Kaiti are not cross-platform delivery. If exact appearance must match iOS/Android/desktop, ship an appropriate Simplified-Chinese font asset; otherwise provide a deterministic Simplified-Chinese-capable fallback.

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
- `aria-current` for active route;
- active route stays discoverable in navigation;
- tablet/mobile has a path to every global route.

Do not add ARIA to compensate for the wrong interaction model.

## 15. Visual system

Preserve semantic tokens and shared surface grammar. Do not add feature-local hard-coded colors, arbitrary gradients/shadows, overlay z-index, duplicate active palettes or legacy glass recipes.

Classify recipes as:

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
