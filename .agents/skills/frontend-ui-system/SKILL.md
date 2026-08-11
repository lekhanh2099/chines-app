---
name: frontend-ui-system
description: Design, implement, refactor, audit, or review UI and UX in chines-app. Use for information architecture, user flow, component reuse, design system, Button, Dialog, Select, Popover, DropdownMenu, Tooltip, Chip, Badge, Typography, Avatar, IconTile, Switch, Sheet, Tabs, SegmentedControl, Card, PageHeader, Input, form controls, command/search, settings, navigation, toolbar, responsive layout, iPad/mobile, Tailwind classes, tokens, accessibility, keyboard, focus, loading, empty, error, hover, or visual consistency.
compatibility: chines-app local shadcn-style components; Tailwind CSS 4; Radix and Base UI wrappers; TanStack Query/Form/Store
metadata:
  author: chines-app
  version: "3.2"
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

## 2. Start from the user goal, not the old screen

A UI refactor MAY change information architecture and flow when the current
flow creates duplicated navigation, hidden state, unnecessary steps, weak task
orientation or interaction clutter. Preserving old JSX is not a product goal.

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

Do not change a flow only because it looks cleaner. The replacement must reduce
friction, improve orientation, expose state more clearly or remove duplicated
interaction anatomy.

## 3. State ownership — TanStack/router first

Use one authoritative owner:

```text
server/cache state       -> TanStack Query
form/validation state    -> TanStack Form
cross-feature client UI  -> scoped TanStack Store
shareable navigation     -> route/search params
local transient UI       -> local React state
derived value            -> compute from authoritative inputs
```

MUST NOT:

- mirror Query data into local state without an editable-draft contract;
- mirror Form/Store/route values into local state;
- use effects for pure derivation;
- synchronize two owners bidirectionally;
- repair stale state with timeouts, random keys or force renders;
- hide loading/error/empty behind one fallback value.

Every state-writing effect must represent a real ownership/external-system
bridge and be idempotent. Running it repeatedly with the same authoritative
input must not keep producing state changes.

For shared shell interaction state, store only the interaction contract. Example:
`globalSearchStore` owns `open/query`; HanziHome search results/course/lesson
data stay in feature Query state.

## 4. Shared shell boundary

`src/components/layout/**` owns global chrome only. Shared shell components MUST
NOT import feature implementation code.

Feature context is registered through a generic boundary:

```text
feature
 -> owner-safe shared store/slot
 -> Header renders slot
```

Current examples:

- `HanziHomeHeaderContextBridge` registers the lesson breadcrumb through
  `headerToolbarStore`;
- `HanziHomeGlobalSearchBridge` consumes `globalSearchStore` while keeping
  search data/result navigation inside the feature;
- HanziHome reader quick settings stay in the lesson workspace toolbar.

Do not move HanziHome catalog hooks, lesson routing, reader settings or search
result logic back into Header.

## 5. Inventory before JSX

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

Search locally when possible:

```bash
find src/components/ui -maxdepth 2 -type f | sort
find src/components/patterns -maxdepth 3 -type f 2>/dev/null | sort
rg -n 'from "@base-ui/react|from "radix-ui|from "@radix-ui/' src \
  --glob '!src/components/ui/**'
```

Do not create a second Button, Card, PageHeader, IconTile, Dialog, Select,
DropdownMenu, Tooltip, Chip, Typography, Switch or SegmentedControl visual
language inside a feature.

## 6. Primitive boundary and `className`

Feature code MUST NOT import Base UI or Radix primitives directly.

Shared primitives own:

- tokens and typography;
- border/radius/background/shadow;
- interaction anatomy;
- hover/focus/active/disabled/invalid behavior;
- variants and density;
- overlay stack;
- internal icon sizing.

Feature code owns labels, data, callbacks, business conditions, parent layout,
responsive placement and external spacing.

Canonical call-site `className` is layout-only. It MUST NOT visually repair the
component.

Forbidden:

```tsx
<Card className="rounded-xl border bg-bg-card p-4" />
<SelectTrigger className="h-10 bg-bg-card text-sm" />
<PageHeader className="[&_h1]:text-2xl" />
```

When valid variation repeats, extend the semantic owner with a typed API.
Do not add one-off pixel variants.

`scripts/check-ui-standards.mjs` is the executable guard. Never add a baseline
or broad exception to make a migration pass.

## 7. Component choice

Use the canonical matrix and inventory.

Rules:

- DropdownMenu is the action-menu primitive.
- A menu row that represents a category with multiple immediate choices uses
  `DropdownMenuSub` + `DropdownMenuSubTrigger` + `DropdownMenuSubContent`.
- Do not turn a normal desktop dropdown into a fake multi-page flow by replacing
  the root menu content and adding a manual “Back” row. Native submenus preserve
  orientation and keep sibling actions reachable.
- Submenu triggers should expose the current value when it materially helps
  scanning. Direct commands remain `DropdownMenuItem`; independent booleans use
  checkbox items instead of unnecessary submenus.
- Repeated edit/reorder/delete icon clusters normally become one action menu.
- Popover is not an action menu.
- Tooltip is supplementary only.
- Badge is static status/category; ordinary counts are usually Typography.
- Chip is interactive.
- IconTile owns decorative icon-container visuals.
- Direct boolean preferences use Switch on settings pages.
- SegmentedControl is a compact pressed single-choice group.
- Tabs are only for real tab/panel semantics; never hand-build partial tab ARIA.
- A keyboard search surface is a composite, not Input + Dialog alone.
- EmptyState owns empty/no-result presentation; errors remain separate.
- Form adapters compose shared UI and do not create a parallel control system.
- Do not create alias-only wrappers around existing primitives.

Application headings/paragraphs use Typography. HanziHome learner content uses
feature-owned learner typography. Learner typography must not become a generic
badge, pill, icon tile or surface wrapper.

## 8. Interaction density

Use one density family per control row:

```text
standalone/touch : 44px minimum
toolbar/command  : 36px
menu             : 40px
inline text      : content-sized
```

A compact Select next to a Button uses Select `sm` + Button `toolbar`.
Do not pair 36px and 44px controls in one command row without an explicit
hierarchy reason.

## 9. Surface and information hierarchy

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
- Home desktop composition uses available width for primary work plus an
  attention/progress rail when meaningful user state exists. Do not create a
  wide grid and then cap the primary child so a decorative empty middle column
  appears;
- do not fill Home with generic shortcuts merely to occupy space. Useful Home
  density comes from learning state, review attention, recent work and one
  contextual reminder;
- contextual module navigation stays inside the owning feature;
- the active global route remains visible in its expanded Sidebar group.

## 10. Page and shell ownership

Normal pages use PageContainer.

The App Shell owns viewport height and normal route scrolling. Feature pages do
not subtract guessed Header/mobile-nav heights with `calc(100dvh - ...)`.
Contained workspaces inherit `h-full min-h-0` and assign overflow to the actual
pane.

PageHeader owns title/description hierarchy and typed density. Do not reach into
its descendants with CSS selectors.

## 11. Settings and contextual controls

Header Gear is global only:

- Theme;
- route-scoped lookup;
- Focus mode;
- link to full Settings.

Feature-specific quick settings stay where their context exists.

For HanziHome:

- reader font/size/reveal/visibility live in the lesson workspace toolbar;
- grouped reader choices in the quick menu use real DropdownMenu submenus;
- reader font choices show a real Hanzi font preview;
- `/settings?section=reading` remains the complete reading-settings hub;
- full reading settings include a live content preview that demonstrates the
  selected font, size, reveal behavior, pinyin/meaning visibility and answer
  visibility. On wide screens the preview may sit beside controls; on narrow
  screens it follows controls in normal document flow;
- Avatar owns identity/provider/logout only.

## 12. Destructive actions

A destructive user-facing action requires one of:

- explicit confirmation with consequence and pending state; or
- a clearly recoverable Undo flow.

If backend behavior is soft-delete/archive, copy should describe recoverability.
Do not expose permanent red delete buttons across every editable row.

## 13. Accessibility

Use primitive-native semantics.

Verify:

- button vs link;
- Switch/Checkbox/pressed state;
- menu trigger/items and destructive tone;
- dialog title, focus, Escape and return focus;
- Select semantics;
- SegmentedControl selected state;
- visible focus;
- keyboard operation;
- touch target size;
- `aria-current` for active routes;
- active route is not hidden inside a collapsed navigation group.

Do not add ARIA to compensate for the wrong interaction model.

## 14. Visual system

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

Named Tailwind palette enforcement is not yet a complete machine-proven repo
contract. Do not claim it is clean without executable migration evidence.

## 15. Verification

Follow `docs/ui/ui-verification.md`.

A visual claim requires rendering. Use the smallest tier that can falsify it:

- Fast: affected state/viewport.
- Subsystem: affected desktop/iPad/mobile + keyboard/state variants.
- Full: shared primitives or multi-surface changes + repository gate.

For app-code completion run:

```bash
npm run check
```

If the environment cannot execute the full gate or render authenticated
viewports, state that explicitly. Never translate source inspection or a Vercel
build into a false claim that the full UI matrix passed.

## 16. Handoff

Report:

```text
User-flow change:
State owners:
Shell/feature boundary changes:
Component contracts used/extended:
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
