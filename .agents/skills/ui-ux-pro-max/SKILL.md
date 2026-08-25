---
name: ui-ux-pro-max
description: Secondary UI/UX audit intelligence for chines-app, adapted from nextlevelbuilder/ui-ux-pro-max-skill. Use for broad UI audits, accessibility, touch interaction, responsive layout, typography/color, forms, navigation, motion and runtime UX quality after loading the local frontend-ui-system contract.
metadata:
  author: chines-app
  compatibility: chines-app; Next.js App Router; React; Tailwind CSS 4; local shadcn-style primitives
  upstream: nextlevelbuilder/ui-ux-pro-max-skill
  upstream_path: .claude/skills/ui-ux-pro-max/SKILL.md
  upstream_ref: a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5
  version: "1.0"
---

# UI/UX Pro Max — chines-app adapter

This skill imports the useful audit discipline from `nextlevelbuilder/ui-ux-pro-max-skill`
without replacing the product-specific design system already owned by this repository.

## 1. Authority and required context

Before using this skill, read:

```text
AGENTS.md
PRODUCT.md
.agents/skills/frontend-ui-system/SKILL.md
docs/ui/component-contracts.md
docs/ui/ui-verification.md
docs/architecture/frontend-structure.md
```

Authority is always:

```text
explicit user requirement
-> nearest AGENTS.md / root AGENTS.md
-> local source, generated contracts and project docs
-> frontend-ui-system and other project skills
-> this adapted audit skill
-> generic upstream guidance
```

If upstream advice conflicts with a local component, token, state, scroll, typography,
responsive or interaction contract, keep the local contract. Do not create a second
component dialect or a second design system to satisfy generic recommendations.

## 2. Product binding

Audit HanziHome as a focused Chinese-learning workspace, not a generic SaaS dashboard.
The product needs to remain calm and dependable during long study sessions on desktop,
iPad and mobile.

Preserve these local product priorities:

1. Current learning content, pronunciation, meaning and current position first.
2. Immediate study actions second; support/meta/settings third.
3. Progressive disclosure instead of hiding core study information.
4. Color communicates selection, learning state and feedback, not decoration.
5. Keyboard, touch and responsive reading flow are first-class product behavior.
6. Avoid decorative glass, oversized empty surfaces, nested-card hierarchy and
   non-standard/hidden controls.

## 3. Audit priority model

Use this order. Do not start with visual polish while a higher-priority invariant fails.

| Priority | Domain | Required outcome |
| --- | --- | --- |
| 1 | Accessibility | Correct semantics, visible focus, labels/names, WCAG AA contrast, keyboard operation |
| 2 | Touch & interaction | Standalone targets >= 44px, menu rows >= 40px, toolbar controls >= 36px, observable pending/selected/disabled state |
| 3 | Runtime layout quality | No accidental horizontal overflow, stable layout, correct scroll owner, safe areas, content remains usable at supported viewports |
| 4 | Information architecture | One clear primary task, predictable navigation/back behavior, no duplicated navigation layers |
| 5 | Component/design-system consistency | Reuse/extend local semantic owners; no feature-built primitive visuals or parallel component grammar |
| 6 | Typography & color | Local semantic typography/tokens, readable learner text, no raw feature palettes, clear hierarchy in light and dark themes |
| 7 | Forms & feedback | Visible labels, field-local errors/helper text, pending/success/error states, destructive consequence or undo |
| 8 | Motion | Motion conveys state/spatial continuity, respects reduced motion, avoids layout-thrashing animation |
| 9 | Performance | Avoid unnecessary fetch/render work; reserve layout space; verify user-visible runtime performance where it matters |
| 10 | Charts/data visualization | Only when the product surface actually needs charts; never add dashboard charts merely to make a page feel complete |

## 4. Source audit workflow

### Step A — resolve the user flow

Write down before judging the UI:

```text
User goal:
Primary action:
Current position/orientation:
Expected next action:
Data/state owner:
Loading / empty / error / disabled states:
Desktop interaction model:
Touch interaction model:
Keyboard/focus model:
```

Do not preserve or redesign a flow without identifying the friction first.

### Step B — inventory the local owner

For every UI concern, resolve:

```text
Need
-> existing primitive?
-> existing pattern?
-> existing feature composition?
-> stable missing contract?
-> use | extend | create | justified local exception
```

Read the owner source before changing it. Feature `className` remains layout-only under
the local component contract.

### Step C — run repository guards

Use the smallest checks that can falsify the change. Relevant guards include:

```bash
npm run ui:check
npm run source:check
npm run typecheck
npm run test:run
```

For full-path work, PR/CI or release preparation:

```bash
npm run check
```

Do not report a command as passed unless it actually ran.

## 5. Rendered audit workflow

Source inspection is not sufficient for a visual claim. When the environment supports
rendering, verify the affected route/state at the smallest useful matrix.

Default viewports for cross-surface work:

```text
phone       390 x 844
iPad        820 x 1180
desktop    1440 x 900
wide       1728 x 1117   only when wide-layout behavior is relevant
```

Use both light and dark mode for theme-sensitive work. For each rendered state verify:

- exactly one intended route-level scroll owner;
- no accidental horizontal overflow;
- no clipped title, action, select/menu/dialog or learner content;
- touch targets meet the local density contract;
- icon-only controls have an accessible name;
- focus order and visible focus remain usable;
- loading, empty, error, disabled and selected states are observable;
- overlays collision-constrain to the viewport and own focus/dismissal correctly;
- bottom navigation/safe-area chrome does not compete with a modal task;
- learner Hanzi/Pinyin/translation typography uses the correct local owner;
- content hierarchy remains understandable in the first viewport without decorative dead space.

For tablet portrait, use the touch interaction model even when a desktop submenu could
physically fit.

## 6. Contrast and accessibility verification

The upstream 4.5:1 text-contrast heuristic is a minimum audit signal, not a substitute
for checking the actual rendered foreground/background pair.

For theme/palette changes verify computed contrast for normal text and state-specific
foregrounds. Do not infer compliance from token names alone. Also verify:

- native semantics before ARIA;
- `aria-current` for active route;
- pressed/checked/selected state for toggles and choices;
- Dialog title/focus/Escape/return-focus behavior;
- keyboard behavior of Tabs, Select, Menu and SegmentedControl;
- reduced-motion behavior when motion exists.

## 7. Performance audit boundary

Separate source architecture performance from user-visible runtime performance.

Source checks should catch known repository anti-patterns such as duplicate catalog
fetches or legacy data endpoints. Runtime review should independently inspect, when
relevant:

- layout shift / reserved space;
- large media loading and dimensions;
- repeated re-render/fetch caused by UI interaction;
- long-list rendering cost;
- route transition and reader interaction responsiveness.

Do not claim good runtime performance because a static source guard passed.

## 8. How to use upstream design intelligence

The upstream project also ships searchable style/product/color/type/icon/motion/stack
data and a Python search tool. That data is optional reference material, not the
project's source of truth.

For this repository:

- do not generate a replacement product-wide design system when local tokens and
  contracts already exist;
- do not persist an upstream `MASTER.md` over established local design decisions;
- use generic style/palette/font suggestions only as research input and map any adopted
  idea through local semantic owners;
- never install packages or vendor a large upstream dataset merely to complete a UI
  task unless the user explicitly authorizes that scope;
- never fabricate a database/search result. If the upstream search data is unavailable,
  label general guidance as general guidance.

## 9. Anti-patterns specific to chines-app

Reject these even if a generic style recommendation suggests them:

- dashboard/card grids as the default learning information architecture;
- decorative gradients/glass or palette-local surface recipes;
- raw feature colors, arbitrary z-index, pixel font sizes or fit-content layout patches;
- card-inside-card hierarchy for ordinary grouping;
- hover movement/scale of the hit target;
- desktop lateral submenus on phone/iPad touch flows;
- hidden core study content behind unnecessary "details" interaction;
- global font shrinking as a mobile-reading fix;
- native `window.scrollTo` / `scrollIntoView` for route or section navigation;
- a new primitive when a local semantic owner can be used or extended.

## 10. Audit report contract

Rank findings by impact, not by the number of lint-style observations.

Each finding must contain:

```text
Severity: P0 | P1 | P2 | P3
Evidence: exact file/route/state/check
Why it matters: user-visible or architectural consequence
Owner: authoritative component/state/contract
Recommendation: smallest durable correction
Verification: exact check or rendered state that can falsify the fix
```

Separate:

```text
verified source finding
verified rendered finding
inference / unrendered risk
```

Do not call an inference a visual bug. Do not claim a check passed unless it was run.

## 11. Handoff

For non-trivial UI work report only evidence-bearing items:

```text
User-flow change:
Local contracts used/extended:
Findings fixed / intentionally deferred:
Rendered routes/viewports/themes:
Keyboard/state verification:
Checks actually run:
Known unverified states:
Residual UX/accessibility/performance risk:
```
