---
name: frontend-ui-system
description: Design, implement, refactor, audit, or review UI and UX in chines-app. Use when a task mentions component reuse, design system, Button, Dialog, Select, Popover, DropdownMenu, Menu, Tooltip, Chip, Badge, Typography, Avatar, Switch, Sheet, Tabs, Card, Input, form control, command palette, global search, settings menu, toolbar, responsive layout, iPad, mobile, Tailwind classes, tokens, accessibility, keyboard, focus, loading, empty, error, hover, or visual consistency.
compatibility: chines-app local shadcn-style components; Tailwind CSS 4; Radix and Base UI wrappers
metadata:
  author: chines-app
  version: "2.1"
---

# Frontend UI System

## 1. Required context

Read:

```bash
cat AGENTS.md
cat docs/ui/component-contracts.md
cat docs/ui/component-inventory.md
cat docs/ui/ui-verification.md
cat docs/agent/skill-authoring.md
git status --short
```

Read local source for every primitive or pattern being considered.

When shadcn is involved:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
```

Local source overrides generic examples.

## 2. Inventory before JSX

Report:

```text
Need:
Existing primitive:
Existing pattern:
Current consumers:
Missing contract:
Decision: use | extend | create | justified local exception
```

Search:

```bash
find src/components/ui -maxdepth 2 -type f | sort
find src/components/patterns -maxdepth 3 -type f 2>/dev/null | sort
rg -n 'from "@base-ui/react|from "radix-ui|from "@radix-ui/' src \
  --glob '!src/components/ui/**'
```

Do not create a second Button, Dialog, Select, DropdownMenu, Tooltip, Chip,
Typography or Switch visual language inside a feature.

Canonical inventory components are active contracts. A component having no
current consumer is not permission to recreate its semantics locally. When the
need matches Typography, Avatar, Switch, Chip, EmptyState, or another canonical
contract, use that component and make it a real consumer.

## 3. Primitive boundary

Feature code MUST NOT import Base UI or Radix primitives directly.

Shared primitives own:

- internal tokens;
- interaction anatomy;
- focus;
- disabled/invalid behavior;
- variants;
- overlay stack;
- internal icon sizing.

Feature code owns labels, data, callbacks, business conditions and parent layout
participation.

Follow the `className` contract in `docs/ui/component-contracts.md`.

## 4. Component choice

Use the canonical matrix and inventory.

Special rules:

- DropdownMenu is the canonical action-menu primitive.
- A styled Popover is not automatically a Menu.
- Tooltip contains supplementary information only.
- Badge is static; Chip is interactive.
- Toggle Buttons require exposed state; direct booleans should use Switch.
- Typography is for app hierarchy, not HanziHome learner typography.
- A keyboard search surface is a composite, not Input + Dialog alone.
- Form adapters compose shared UI and must not create a parallel system.
- Legacy component paths gain no new consumers without justification.
- Do not create an alias-only pattern around an existing primitive.

Application `h1`–`h6` and `p` JSX is forbidden outside the Typography
implementation. Use `Typography` with the correct `as` element and semantic
variant. Native structural elements must not carry a parallel typography recipe.

Inside HanziHome, distinguish the contracts explicitly:

- app/page/panel hierarchy: Typography;
- Chinese learner text, pinyin, reading-size and study typography:
  `HanziText`, `ReaderHanziText`, `AdaptiveStudyText`, `PinyinText`,
  `TranslationText`, `StudyInstructionText`, or `HanziFontPreview`.

Typography and learner-text call sites use typed props for tone, weight, scale,
leading and tracking. Their `className` may contain parent-owned layout only;
font, text size, text color, line height and tracking utilities are forbidden.

## 5. Variant design

Add a variant only when it represents a stable semantic or interaction contract.

Good:

```text
toolbar density
menu density
destructive menu action
top-placed command dialog
static badge vs interactive chip
```

Bad:

```text
purpleButtonForPageA
width317
specialSmallOnlyHere
```

Before adding a variant, list current or planned meaningful consumers. Prefer
additive APIs until a dedicated migration task approves breaking cleanup.

## 6. shadcn changes

Before add/update:

```bash
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff
```

Then inspect consumers and local customization.

STOP AND CONFIRM before overwrite, breaking local API, dependency addition,
Base/Radix migration or global preset/token application.

## 7. UX contract

Before coding, define user goal, primary action, hierarchy, loading,
initial/empty, error, disabled, long-content, keyboard, touch, responsive and
focus-return behavior.

Do not ship a blank initial panel when instruction, recent content, navigation
or a compact EmptyState is required.

## 8. Accessibility

Use primitive-native semantics.

Verify:

- button vs link;
- Switch/Checkbox/toggle state;
- menu trigger and menu items;
- dialog title/focus/Escape;
- Select/combobox semantics;
- Tooltip is supplementary;
- visible focus;
- keyboard operation;
- touch target size.

Do not add ARIA to compensate for an incorrect interaction model.

## 9. Visual system

Preserve semantic tokens, active-state recipes, gradient/glass roles and shared
overlay stacking.

Do not add feature-local hard-coded color, arbitrary gradient/shadow, overlay
z-index, duplicated active palette or raw component recipe.

Classify visual recipes as:

```text
primitive-owned
token-owned
brand/system recipe
legitimate local exception
ad-hoc debt
```

## 10. Verification

Follow `docs/ui/ui-verification.md`.

A visual claim requires rendering. Logic-only work that does not make a visual
or interaction claim does not require the full viewport matrix.

Use:

- Fast: render the affected state/viewport for a local visual regression.
- Subsystem: verify affected desktop/iPad/mobile, keyboard and state variants.
- Full: verify shared primitive or multi-surface consumers plus the repository
  gate.

Verify only applicable desktop, iPad portrait, mobile, keyboard,
loading/empty/error, dark mode and console states; report what was not checked.

For the full path or app-code completion, run:

```bash
npm run check
```

## 11. Handoff

Report:

```text
Component contract used:
Precedent used:
Authoritative contract:
New/extended contract:
Meaningful consumers:
Feature-local exceptions:
Rendered routes:
Viewports:
Keyboard flows:
States:
Checks:
Residual UX/accessibility risk:
```
