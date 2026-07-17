---
name: frontend-ui-system
description: Design, implement, refactor, audit, or review UI and UX in chines-app. Use when a task mentions component reuse, design system, Button, Dialog, Select, Popover, Dropdown, Menu, Sheet, Tabs, Card, Badge, Input, form control, command palette, global search, settings menu, toolbar, responsive layout, iPad, mobile, Tailwind classes, tokens, accessibility, keyboard, focus, loading, empty, error, hover, or visual consistency.
compatibility: chines-app local shadcn-style components; Tailwind CSS 4; Radix and Base UI wrappers
metadata:
  author: chines-app
  version: "2.0"
---

# Frontend UI System

## 1. Required context

Read:

```bash
cat AGENTS.md
cat docs/ui/component-contracts.md
cat docs/ui/ui-verification.md
git status --short
```

Read the local source for every primitive or pattern being considered.

When shadcn is involved:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
```

Local source overrides generic examples.

## 2. Inventory before JSX

For the requested interaction, report:

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

Do not create a second Button/Dialog/Select/Menu visual language inside a
feature.

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

Feature code owns:

- product labels;
- data;
- callbacks;
- business conditions;
- parent layout participation.

Follow the `className` contract in `docs/ui/component-contracts.md`.

## 4. Component choice

Use the canonical matrix.

Special rules:

- A styled Popover is not automatically an action Menu.
- Toggle Buttons require exposed state.
- A keyboard search surface is a composite widget, not just Input + Dialog.
- Form adapters compose shared UI; they do not create a parallel design system.
- Existing legacy paths must not gain new consumers without justification.

## 5. shadcn changes

Before add/update:

```bash
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff
```

Then inspect consumers and local customization.

STOP AND CONFIRM before:

- overwrite;
- breaking local API;
- dependency addition;
- Base/Radix migration;
- global preset/token application.

## 6. UX contract

Before coding, define:

- user goal;
- primary action;
- hierarchy;
- loading;
- initial/empty;
- error;
- disabled;
- long content;
- keyboard;
- touch;
- responsive behavior;
- focus return.

Do not ship a blank initial panel when a useful instruction, recent item,
navigation action or compact empty state is required.

## 7. Accessibility

Use primitive-native semantics when available.

Verify:

- button vs link;
- toggle state;
- menu trigger and menu items;
- dialog title/focus/Escape;
- select/combobox semantics;
- visible focus;
- keyboard operation;
- touch target size.

Do not add ARIA to compensate for an incorrect interaction model. Fix the model
or use the correct primitive.

## 8. Visual system

Preserve repository brand roles:

- semantic tokens;
- shared active state;
- shared gradient/glass recipes;
- shared overlay stacking.

Do not add feature-local:

- hard-coded hex;
- arbitrary gradient;
- arbitrary shadow;
- overlay z-index;
- duplicated active palette;
- raw component recipe.

Classify an existing visual recipe before deleting it:

```text
primitive-owned
token-owned
brand/system recipe
legitimate local exception
ad-hoc debt
```

## 9. Verification

Follow `docs/ui/ui-verification.md`.

A visual claim requires rendering.

At minimum verify applicable:

- desktop;
- iPad portrait;
- mobile;
- keyboard;
- loading/empty/error;
- dark mode;
- console.

Then run:

```bash
npm run check
```

## 10. Handoff

Report:

```text
Component contract used:
New/extended contract:
Feature-local exceptions:
Rendered routes:
Viewports:
Keyboard flows:
States:
Checks:
Residual UX/accessibility risk:
```
