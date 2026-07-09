---
name: hanzihome-ui-system-audit
description: Audit and guide UI design-system consolidation in the HanziHome/chines-app repository. Use when a task mentions HanziHome UI polish, Nova UI, design tokens, Tailwind class drift, globals.css component recipes, Home/Notebook/HanziHome visual consistency, glass surfaces, hero/card primitives, or preventing Codex from adding ad-hoc utility CSS.
---

# HanziHome UI System Audit

## Overview

Use this skill to keep HanziHome UI work aligned with the app's token and component system. The goal is to prevent new feature code from copying raw visual recipes such as `bg-white/*`, `border-white/*`, arbitrary gradients, arbitrary shadows, or hard-coded hex colors when a semantic primitive should own the styling.

Important: HanziHome has a gradient-forward brand. Do not flatten brand surfaces into plain token cards during cleanup. Gradients and glass are part of the design system, not informal exceptions. They must be owned by named primitives or global brand classes such as `app-gradient-hero`, `app-brand-gradient`, or `app-glass-surface`, not repeated as feature-local `bg-[linear-gradient(...)]`, hard-coded hex colors, or one-off shadow recipes.

## First Checks

Start by reading repository instructions and the current surface before editing:

```bash
sed -n '1,260p' AGENTS.md
git status --short
rg -n "bg-white/|border-white/|text-\[#|shadow-\[|bg-\[linear-gradient|nova-glass-panel|nova-gradient-hero|hanzihome-liquid|border-purple-|bg-emerald-|text-purple-|bg-pink-|bg-sky-" src
```

Inspect these files when they exist:

- `src/app/globals.css`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/glass-panel.tsx`
- `src/components/layout/workspace-command-header.tsx`
- `src/features/home/components/HomePrimitives.tsx`
- `src/features/home/components/ContinueLearningPanel.tsx`
- `src/features/home/components/HomeResourceLinks.tsx`
- `src/features/notebook/components/NotebookHero.tsx`
- `src/features/notebook/components/NotebookDeepDive.tsx`
- HanziHome lesson, exercise, overview, and layout components touched by the task

If the task touches shadcn component APIs, `components.json`, registry items, variants, or component docs, also read `.agents/skills/shadcn/SKILL.md`.

## Current Diagnosis Pattern

Treat this as a UI system governance problem, not as a Tailwind syntax problem:

- `bg-bg-card/80` is valid Tailwind opacity syntax, but repeated opacity values can become hidden tokens.
- `globals.css` should own theme tokens, base rules, and limited shell/brand recipes. Named brand recipes are allowed when they preserve the app identity and prevent ad-hoc feature gradients.
- Feature code should prefer shared primitives or semantic variants over raw visual recipes.
- One-off palettes in feature components make dark mode and cross-page consistency drift.
- Do not remove brand gradients just because a scan finds gradients. First classify whether the gradient is primitive-owned (`app-gradient-hero`, `app-brand-gradient`, `app-glass-surface`) or feature-local/ad-hoc.
- Overlay stacking belongs in shared primitives. Do not remove tested `z-*` classes from `SelectContent`, `DialogContent`, `SheetContent`, `PopoverContent`, `TooltipContent`, or similar overlay primitives during cleanup. The rule against manual z-index applies to feature call sites and one-off wrappers, not to the primitive that must render above the app shell and sticky toolbars.
- HanziHome study flow correctness remains higher priority than visual cleanup. Do not mix UI-system consolidation with content-model, DB, or edit-contract changes unless the user asks.

## Workspace Command Header Contract

Workspace pages that combine page context, search/select controls, actions, and tabs/filters should reuse `WorkspaceCommandHeader` from `src/components/layout/workspace-command-header.tsx` instead of hand-building a new sticky header.

Use this contract for new pages and for cleanup of existing page headers:

- Put page title, count/status badge, and short description in the header identity area.
- Put search inputs, quick selects, and primary page actions in the `controls` slot.
- Put tabs, filters, segmented controls, or secondary command rows as header children.
- Keep controls wrap-safe and scroll-safe for iPad portrait. Do not assume desktop width once the sidebar is visible.
- Use icon-first actions below wide desktop when labels would force a second tall row. Preserve `title` and `aria-label`.
- Hide non-essential global header inputs when route-specific toolbar content is active on iPad/tablet widths.
- Preserve the scroll owner: the header should shrink-wrap its commands while the content area owns vertical scroll.
- Avoid duplicating sticky header recipes in feature files; extend the shared primitive if a repeated header density or slot is needed.

When adding a new study, notebook, notes, aggregate, or artifact page, first decide whether it is a workspace-command surface. If yes, start from `WorkspaceCommandHeader`.

## iPad Safari Audit Contract

HanziHome is primarily used for study on iPad, including portrait orientation in Safari. UI changes to study surfaces, note surfaces, or app-wide headers must be checked against this constraint.

Audit at least these states when the touched surface is visible there:

- iPad 11-inch portrait-ish width with desktop sidebar visible, around `820px x 1180px`.
- iPad portrait with route-specific header controls active.
- Safari dynamic viewport behavior: use `100dvh`/safe-area-aware wrappers where the page already owns viewport height.
- Header height budget: app header plus workspace command header should not consume excessive vertical space.
- Toolbar/action density: rich editor toolbars should not wrap into multiple tall rows on iPad; prefer horizontal scroll for low-frequency tools.
- Horizontal overflow: tabs, filters, select triggers, action groups, and editor toolbars must either wrap intentionally or scroll horizontally inside their own row.
- Split panes: avoid side-by-side panes at tablet widths when each pane becomes too narrow; stack or compact instead.
- Touch ergonomics: keep icon buttons large enough for touch even when labels are hidden.

## Gradient System Contract

Gradient is a first-class brand primitive in this app.

Allowed gradient/glass entrypoints:

- `app-gradient-hero`: primary branded hero and featured learning surfaces.
- `app-brand-gradient`: compact brand marks, logo chips, and small identity anchors.
- `app-glass-surface`: translucent cards/panels layered on brand gradients or app shell backgrounds.
- `app-active-item`: selected navigation, tabs, list rows, and picker cards that need a consistent active state.
- `nova-page`, `nova-shell-header`, `nova-shell-sidebar`: existing shell/page atmosphere recipes.
- `hanzihome-liquid-*`: HanziHome workspace liquid surfaces; preserve scroll ownership before editing.

Strict rules:

- Do not replace a gradient hero, brand mark, or glass panel with a flat card unless the user explicitly asks for a flatter visual style.
- Do not add new gradient recipes in feature components.
- Do not use `bg-[linear-gradient(...)]`, hard-coded hex colors, or arbitrary gradient shadows in TSX.
- Do not create a new global gradient class unless at least two surfaces need the same art direction or the class represents a named brand role.
- If adding or changing a global gradient recipe, update this skill in the same change so future agents know the allowed contract.
- If a scan flags gradients, classify them as `system-gradient`, `system-glass`, `shell-recipe`, `workspace-liquid`, or `ad-hoc-debt` before editing.

## Active State Contract

Selection and active states are system primitives, not per-feature styling.

Use `app-active-item` for selected navigation rows, segmented controls, module tabs, sidebar list rows, picker rows, artifact cards, folder rows, and other active list/card controls. This keeps active states on one tonal brand-gradient recipe with stronger text and borders while avoiding CTA styling.

Strict rules:

- Do not add new active-state recipes in feature components with local combinations such as `bg-primary text-primary-foreground`, `ring-primary`, `bg-primary/10 text-primary`, or `bg-accent-subtle text-accent-text`.
- Keep active states on a restrained violet tonal recipe. Do not introduce cyan/teal, pink/rose, or solid multi-color active fills unless the surface has an explicit semantic role.
- Do not use full `Button default` styling or solid primary gradients just to indicate selection. Reserve full-primary buttons for commands and CTAs.
- When the interactive control is a `Button`, use shared button variants such as `active`, `surface`, or `surfaceCard` for selected/list/chip states. Do not add `app-active-item`, token color stacks, or hover palettes directly in feature-level `className`.
- Active/selected states must have enough contrast to be readable at a glance; avoid pale purple text-only active states.
- Small nested status marks, check indicators, and badges may keep their own tone when they represent status rather than the selected surface.
- If an active state needs a new density or emphasis, extend the system recipe first and update this skill in the same change.

## Overlay Stack Contract

Overlay z-index belongs to shared primitives and must be ordered by interaction depth:

- App shell/header: below transient overlays.
- Popover/sheet/dialog panels: above shell and content.
- Select/dropdown content opened from inside an overlay: above the parent overlay, not behind it.

Do not set one-off high z-index at feature call sites to fix nested dropdown bugs. Fix the shared primitive stack instead, then verify nested controls such as a `Select` inside a reading-settings `Popover`.

## Fix Planning

Plan the smallest safe slice before editing. Prefer this order:

1. Inventory drift and classify each usage as primitive-owned, token-owned, or legitimate local exception.
2. Define the missing primitive or variant contract before replacing classes. Common missing contracts are `AppSurface`, `GlassSurface`, `GradientHero`, `BrandMark`, `PageHero`, `SectionHeader`, `IconTile`, `MetricCard`, `InfoPanel`, `ChineseText`, `MetaLabel`, and `EmptyState`.
3. Move repeated visual recipes behind shared components or `cva` variants. Keep props semantic, such as `tone`, `surface`, `density`, or `emphasis`, only when they match real repeated behavior.
4. Refactor by surface, not by global search-replace. Use this order unless the user gives a tighter scope: Home, Notebook, HanziHome overview/exercise, Memory Tips, then remaining shared components.
5. Leave layout and data behavior unchanged unless required for the UI contract. Preserve loading, empty, error, disabled, responsive, and scroll states.
6. Add an escape hatch only when a component truly needs local art direction. Name it explicitly and keep arbitrary values contained.

## Class Governance

Avoid adding these in feature code without a clear exception:

- `bg-white/*`
- `border-white/*`
- `text-[#...]`
- feature-local `bg-[linear-gradient(...)]`
- `shadow-[...]`
- feature-local `z-*` on overlays or wrappers
- feature-local active-state styling such as `bg-primary text-primary-foreground`, `ring-primary`, or `bg-primary/10 text-primary`
- feature-local palettes such as `purple-200`, `emerald-50`, `pink-50`, or `sky-50`
- new global component classes parallel to React primitives

Prefer these instead:

- named brand recipes such as `app-gradient-hero`, `app-brand-gradient`, and `app-glass-surface`
- `app-active-item` for selected/active surfaces
- token-backed utilities such as `bg-bg-card`, `text-text-primary`, `border-border-default`, `shadow-theme-sm`
- existing `Card`, `Button`, `Badge`, `Select`, and shared layout primitives
- primitive-owned overlay stacking in shared components, for example `SelectContent` staying above shell/header layers
- new or extended primitives when at least two surfaces share the same pattern
- semantic CSS variables for values that must stay themeable

Brand-gradient acceptance:

- Hero, logo, featured course/continue-learning, and primary dashboard surfaces should retain a clear gradient or glass signal.
- Repeated gradients must be centralized in `src/app/globals.css` or wrapped by shared primitives.
- Audit reports should call out “ad-hoc gradient debt” separately from “brand gradient intentionally preserved.”

Stop and ask before flattening:

- `app-gradient-hero`
- `app-brand-gradient`
- `app-glass-surface`
- `nova-page`
- `nova-shell-*`
- `hanzihome-liquid-*`

## Report Format

When the user asks for a review or audit, lead with the current-state verdict and concrete evidence:

- State whether the report or suspicion matches the current checkout.
- Cite exact files and patterns inspected.
- Separate syntax-valid Tailwind from design-system debt.
- Call out scope corrections, such as drift outside HanziHome.
- End with a phased fix plan and verification commands.

## Verification

For report-only work, validate the skill or artifact changes only. For app code changes, run the checks required by `AGENTS.md`:

```bash
npm run lint
npm run typecheck
npm run build
```

If the change is only a scoped UI refactor and `next build` fails for an unrelated external dependency, report that explicitly and include the passing checks.
