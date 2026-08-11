---
name: frontend-ui-system
description: Design, implement, refactor, audit, or review UI and UX in chines-app. Use for information architecture, user flow, component reuse, design system, Button, Dialog, Select, Popover, DropdownMenu, Tooltip, Chip, Badge, Typography, Avatar, IconTile, Switch, Sheet, Tabs, SegmentedControl, Card, PageHeader, Input, form controls, command/search, settings, navigation, toolbar, responsive layout, iPad/mobile, Tailwind classes, tokens, accessibility, keyboard, focus, loading, empty, error, hover, or visual consistency.
compatibility: chines-app local shadcn-style components; Tailwind CSS 4; Radix and Base UI wrappers; TanStack Query/Form/Store
metadata:
  author: chines-app
  version: "3.0"
---

# Frontend UI System

## 1. Required context

Read:

```bash
cat AGENTS.md
cat docs/ui/component-contracts.md
cat docs/ui/component-inventory.md
cat docs/ui/ui-verification.md
cat docs/architecture/frontend-structure.md
cat docs/agent/skill-authoring.md
git status --short
```

Read local source for every primitive, pattern and feature composition being
considered. Local source overrides generic examples.

When shadcn is involved:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff
```

## 2. Start from the user goal, not the existing screen

A UI refactor is allowed to change information architecture and flow when the
current flow creates duplication, hidden state, unnecessary steps or weak task
orientation. Preserving old JSX is not a product requirement.

Before coding, write:

```text
User goal:
Current entry point:
Current friction:
Primary action:
Information hierarchy:
Flow/state transitions:
Loading / empty / error / disabled states:
Responsive and touch behavior:
Keyboard/focus behavior:
Data/state owner:
Business/data invariants that must not change:
```

Then decide whether to preserve, simplify, merge, move or remove a step.

Do not change a flow because it merely looks cleaner. The new flow must reduce
friction, improve orientation, expose state more clearly or remove duplicated
navigation/action anatomy.

## 3. State ownership before component ownership

Use the TanStack ecosystem and router according to ownership:

```text
server/cache state       -> TanStack Query
form/validation state    -> TanStack Form
cross-feature client UI  -> scoped TanStack Store
shareable navigation     -> route/search params
local transient UI       -> local React state
derived value            -> compute from authoritative inputs
```

MUST NOT:

- mirror Query data into local state without an explicit editable-draft contract;
- mirror derived route/form/store values into `useState`;
- use `useEffect` to repair pure derivation;
- create update loops by synchronizing two owners bidirectionally;
- use timeouts, random keys or force renders as state repair;
- hide loading/error/empty behind one fallback value.

Effects are for external synchronization, subscriptions, browser APIs or
imperative integrations. Every state-writing effect must have a stable guard
that makes repeated execution idempotent.

## 4. Inventory before JSX

Report:

```text
Need:
Existing primitive:
Existing pattern:
Existing feature composition:
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

Do not create a second Button, Card, PageHeader, IconTile, Dialog, Select,
DropdownMenu, Tooltip, Chip, Typography, Switch or SegmentedControl visual
language inside a feature.

## 5. Primitive boundary and `className`

Feature code MUST NOT import Base UI or Radix primitives directly.

Shared primitives own:

- internal tokens and typography;
- border/radius/background/shadow;
- interaction anatomy;
- hover/focus/active/disabled/invalid behavior;
- variants and density;
- overlay stack;
- internal icon sizing.

Feature code owns labels, data, callbacks, business conditions, parent layout,
responsive placement and external spacing.

A canonical component call site may use `className` only for parent-owned
layout. It MUST NOT visually repair the component.

Forbidden examples:

```tsx
<Card className="rounded-xl border bg-bg-card p-4" />
<SelectTrigger className="h-10 bg-bg-card text-sm" />
<PageHeader className="[&_h1]:text-2xl" />
```

When a valid variation repeats, extend the semantic owner with a typed prop or
variant. Do not add one-off pixel variants.

`scripts/check-ui-standards.mjs` is the executable guard. Never add a baseline
or broad exception to make a migration pass.

## 6. Component choice

Use the canonical matrix and inventory.

Special rules:

- DropdownMenu is the action-menu primitive.
- Repeated edit/reorder/delete icon clusters should normally become one action menu.
- A styled Popover is not a Menu.
- Tooltip contains supplementary information only.
- Badge is static status/category; ordinary counts are usually Typography.
- Chip is interactive.
- IconTile owns decorative icon-container visuals.
- Toggle Buttons require exposed state; full settings booleans use Switch.
- SegmentedControl is a compact pressed single-choice group.
- Tabs are only for real tab/panel semantics; never hand-build partial tab ARIA.
- A keyboard search surface is a composite, not Input + Dialog alone.
- EmptyState owns empty/no-result presentation; errors remain separate.
- Form adapters compose shared UI and must not create a parallel control system.
- Do not create alias-only wrappers around existing primitives.

Application headings and paragraphs use Typography. HanziHome learner content
uses the feature-owned learner typography. Learner typography must not become a
generic badge, pill, icon tile or surface wrapper.

## 7. Interaction density

Use one density family per control row:

```text
standalone/touch : 44px minimum
toolbar/command  : 36px
menu             : 40px
inline text      : content-sized
```

A compact Select next to a Button uses Select `sm` + Button `toolbar`. Do not
pair 36px and 44px controls in the same command row unless the hierarchy
explicitly requires it.

## 8. Surface and information hierarchy

Do not equate hierarchy with more cards.

Avoid:

```text
Card
  Card
    Card
      control
```

Prefer one major surface with whitespace/Separator between conceptual levels,
then terminal interactive cards/rows only where the user acts.

Use Badge for state/category, not every numeric fact.

Global navigation and page content have different jobs:

- Sidebar owns the app sitemap;
- Home focuses on continuation and attention, not duplicate route cards;
- contextual module navigation stays inside the owning feature;
- the active global route must remain visible in its expanded Sidebar group.

## 9. Page and shell ownership

Normal pages use PageContainer.

The App Shell owns viewport height and normal route scrolling. Feature pages do
not subtract guessed Header/mobile-nav heights with `calc(100dvh - ...)`.
Contained workspaces inherit `h-full min-h-0` and assign overflow to the actual
pane.

PageHeader owns title/description hierarchy and supports typed density. Do not
reach into its descendants with CSS selectors.

## 10. Settings and contextual controls

Header Gear always contains global preferences. Feature-specific quick settings
appear only when the feature context is active.

For HanziHome:

- Theme / lookup / Focus are global quick preferences;
- reader font/size/reveal/visibility appear only in a lesson workspace;
- reader font choices show a real font preview;
- `/settings?section=reading` remains the complete settings hub;
- Avatar owns identity/provider/logout only.

## 11. Destructive actions

A destructive user-facing action must have one of:

- explicit confirmation with consequence and pending state; or
- a clearly recoverable Undo flow.

If the backend operation is soft-delete/archive, copy should describe the
recoverable behavior accurately. Do not silently archive from an always-visible
red button.

## 12. Accessibility

Use primitive-native semantics.

Verify:

- button vs link;
- Switch/Checkbox/pressed state;
- menu trigger/items and destructive tone;
- dialog title, focus, Escape and return focus;
- Select semantics;
- segmented single-choice announcement;
- visible focus;
- keyboard operation;
- touch target size;
- `aria-current` for active route navigation;
- no hidden active route in collapsed navigation groups.

Do not add ARIA to compensate for the wrong interaction model.

## 13. Visual system

Preserve semantic tokens and shared surface grammar.

Do not add feature-local hard-coded color, arbitrary gradient/shadow, overlay
z-index, duplicated active palette, legacy glass/hero recipes or raw primitive
visual recipes.

Classify visual recipes as:

```text
primitive-owned
token-owned
brand/system recipe
stable feature composition
legitimate local exception
ad-hoc debt
```

## 14. Verification

Follow `docs/ui/ui-verification.md`.

A visual claim requires rendering. Use the smallest tier that can falsify it:

- Fast: affected state/viewport.
- Subsystem: affected desktop/iPad/mobile + keyboard/state variants.
- Full: shared primitives or multi-surface changes + repository gate.

For app-code completion run:

```bash
npm run check
```

If the environment cannot execute the full gate or render the requested
viewports, state that explicitly. Never translate source inspection into a false
claim that the UI was visually verified.

## 15. Handoff

Report:

```text
User-flow change:
State owners:
Component contracts used/extended:
Precedent used:
Meaningful consumers:
Removed duplicated recipes:
Feature-local compositions:
Rendered routes:
Viewports:
Keyboard flows:
Loading/empty/error/destructive states:
Checks:
Known unverified states:
Residual UX/accessibility/architecture risk:
```
