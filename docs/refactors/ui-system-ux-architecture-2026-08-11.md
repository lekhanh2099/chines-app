# UI System & UX Architecture Refactor — 2026-08-11

> **HISTORICAL IMPLEMENTATION RECORD.** Commands and pass/fail results below
> describe this branch at the time. Use `package.json`, `AGENTS.md`, and current
> repository contracts for the current checkout and quality gates.

Branch: `refactor/ui-system-ux-architecture`

Base: latest `main` at refactor start.

## Goal

Refactor the application as a system rather than restyling isolated screens.
The target is a UI architecture that remains consistent when new features are
added by humans or coding agents.

Primary goals:

- improve task-oriented UX and information architecture;
- remove duplicated navigation and interaction patterns;
- make shared component ownership enforceable;
- keep server/form/cross-feature/navigation state in the correct owner;
- avoid effect-driven mirrored state and update-depth loops;
- preserve existing business/data behavior unless a UX flow change is
  intentional and safe;
- keep Header/App Shell feature-neutral;
- make responsive and accessibility requirements explicit in the repo skills
  and verification contract.

## Invariants protected

This refactor intentionally did **not** redesign database semantics,
authorization, Supabase contracts, persisted learning formats or public API
behavior.

Preserved state ownership:

```text
server/cache state       -> TanStack Query
form/validation state    -> TanStack Form
cross-feature client UI  -> scoped TanStack Store
shareable navigation     -> route/search params
local transient UI       -> local React state
pure derivation          -> compute from authoritative inputs
```

No compatibility cast, fake render value, effect loop, timeout repair or random
key was added to make the refactor work.

## Intentional UX / information-architecture changes

### Home

Before: Home repeated much of the global sitemap as large cards and quick links.

After: Home is a continuation surface focused on:

- current/recent learning;
- recent notes/work to continue.

Global route discovery remains the Sidebar's job.

Removed Home-specific route-card/quick-action compositions that duplicated the
Sidebar.

### Global Sidebar

- route rows use the canonical Button navigation grammar;
- the group containing the active route is guaranteed to be expanded after
  navigation;
- user-opened unrelated groups may remain open;
- collapsed rail keeps direct route access and accessible names;
- removed the persistent informational footer card that competed with
  navigation.

This fixes the case where navigation from Home or another deep link could leave
the active route hidden inside a collapsed Sidebar group.

### Header / App Shell

The shared Header no longer imports HanziHome implementation code.

Dependency direction is now:

```text
HanziHome feature
  -> owner-safe Header context registration
  -> shared Header slot
```

The Header owns only global shell concerns:

- global search interaction entry point;
- simple route breadcrumb / generic context slot;
- global Theme, route-scoped lookup and Focus preferences;
- profile/avatar.

HanziHome catalog hooks, lesson routing, reader settings and search-result
navigation stay in the feature.

### Global search state

Added `globalSearchStore` for only:

```text
open
query
```

The HanziHome search bridge owns:

- TanStack Query / catalog context;
- active course/lesson context;
- search result navigation;
- Focus-mode lesson blocking;
- direct Chinese dictionary lookup.

This prevents the shared Header from becoming a feature-specific data owner.

### Reader quick settings

Reader controls are contextual learning controls, not global app preferences.

They moved out of global Gear and into the HanziHome lesson workspace toolbar.
The quick menu contains:

- font;
- size;
- reveal behavior;
- visibility options;
- link to full reading settings.

Font choices now preview the represented Hanzi font instead of showing only a
font name.

### HanziHome Library

Reduced nested surface hierarchy.

Before, collection/course/book levels could all become bordered rounded cards.
After:

```text
collection surface
  -> course section separated by spacing / Separator
  -> book cards as terminal interactive surfaces
```

Other changes:

- ordinary counts use subdued metadata instead of excessive Badges;
- Select + Open action share the 36px toolbar density;
- edit mode no longer exposes permanent edit/up/down/delete icon clusters on
  every row.

### Library edit mode

Course/book/lesson CRUD uses one overflow action menu per entity:

```text
Sửa
Di chuyển lên
Di chuyển xuống
────────
Xóa
```

Delete is separated into a confirmation dialog with pending state and accurate
soft-delete/recoverability copy.

TanStack Form and Query invalidation behavior remain at their existing owners.

### HanziHome lesson workspace

- module navigation uses the canonical SegmentedControl pressed-choice
  semantics instead of a partial hand-built Tabs ARIA implementation;
- mobile pane selection is touch-sized;
- workspace toolbar has a feature-owned composition but canonical child
  controls;
- offline/sync error indicators use semantic Badge presentation;
- reader quick settings live in this contextual toolbar;
- split-pane state behavior remains in the existing HanziHome state owner.

### Notes

Removed feature-level viewport arithmetic that guessed Header/mobile-navigation
heights.

Notes now inherits App Shell height via:

```text
h-full min-h-0
```

and owns overflow only inside the actual workspace panes.

### Dictionary / SRS

Moved the SRS implementation out of the route page into the Dictionary feature
boundary.

The route is thin; the feature owns:

- Supabase reads/fallback behavior;
- Zod normalization;
- view-model construction;
- search filtering;
- UI composition.

UX changes:

- canonical PageHeader/Card/EmptyState;
- empty SRS differs from search no-results;
- saved vocabulary cards use the canonical interactive Card contract.

Legacy database fallback behavior is preserved.

### Memory Tips

- management page uses the canonical application page frame;
- edit/pin/delete actions moved into an overflow menu;
- edit dialog supports controlled opening from the menu;
- delete requires confirmation instead of immediate archive;
- copy reflects soft-delete/archive behavior;
- loading, query error and empty states remain distinct.

### Notebook

- uses PageContainer like other app pages;
- view mode uses canonical SegmentedControl in both normal and compact toolbar
  states;
- existing compact-scroll hysteresis remains to avoid toolbar flicker;
- section/group filters keep their current learning behavior.

### Aggregate Vocabulary / Grammar

- normalized PageHeader and surface hierarchy;
- filter Input/Select/reset action use coherent density;
- loading/error/no-results are distinct;
- removed a fake Link + `preventDefault` pattern for grammar review: navigation
  actions are Links, in-place grammar review is a Button;
- existing URL-selected review flow and TanStack Query ownership remain.

### Settings

- removed extra boxed intro sections where hierarchy is sufficient;
- status/category pills use Badge rather than feature-built recipes;
- application/reading/AI URL tab state remains unchanged;
- prompt/model data behavior and fallback storage remain unchanged.

## Design-system changes

### Card

Added/standardized semantic interactive behavior and `asChild` composition so a
feature does not need to rebuild clickable-card border/background/hover recipes.

### IconTile

Added canonical `IconTile` with typed tone and size. This replaces using
Typography or learner text as a generic colored icon container.

### PageHeader

Owns:

- title/description typography;
- optional eyebrow/meta/actions;
- typed density.

Consumers must not restyle internal headings using descendant selectors.

### SegmentedControl

Canonical compact exclusive-choice contract:

- uses Button variants;
- exposes `aria-pressed`;
- typed surface and density;
- supports compact labels and suffix metadata;
- variant types derive from Zod instead of handwritten unions.

### Select

`SelectTrigger` now owns a typed `breadcrumb` appearance. Header/feature code no
longer exports a CSS recipe to visually repair Select from the outside.

### Badge

Owns icon spacing/sizing in addition to static status/category presentation.

### Interaction density

Documented one shared vocabulary:

```text
44px : standalone / touch
36px : toolbar / command
40px : menu row
content-sized : inline text action
```

## State-loop / race hardening

### Header context store

`headerToolbarStore` now supports owner-safe registration:

```text
setOwnedContent(ownerId, content)
clearOwnedContent(ownerId)
```

Properties:

- stale owner cleanup cannot clear a newer owner's content;
- legacy cleanup cannot clear explicitly owned content;
- repeated writes of the same owner/content return the existing store state;
- feature bridge updates content without clear-then-set churn;
- unmount cleanup is separated from content update.

### Global search store

Search open/query actions are idempotent and return existing state when the
requested value is already current.

Regression tests cover both stores.

## Design-system enforcement

Expanded `scripts/check-ui-standards.mjs` so canonical visual ownership is
machine checked for:

- Button;
- Input/Textarea/form controls;
- Card;
- Badge;
- SelectTrigger;
- PageHeader;
- SegmentedControl;
- IconTile.

The guard also rejects:

- direct Radix/Base imports in feature code;
- raw application controls;
- raw application headings/paragraphs;
- feature-owned arbitrary z-index;
- arbitrary raw color/gradient recipes already covered by the guard;
- legacy glass/hero/large-elevation feature escape hatches;
- descendant selectors reaching inside canonical component anatomy.

No baseline was added.

Named Tailwind palette enforcement is intentionally **not** claimed as fully
machine-complete across old source. The refactor diff was checked not to add a
new named-palette recipe, but expanding that rule globally should only happen
with an explicit full-repo migration.

## Agent / repository documentation updated

Updated:

- `.agents/skills/frontend-ui-system/SKILL.md` -> v3.1;
- `.agents/skills/frontend-feature-workflow/SKILL.md` -> v2.1;
- `docs/ui/component-contracts.md`;
- `docs/ui/component-inventory.md`;
- `docs/ui/ui-verification.md`.

New skill rules explicitly cover:

- UX flow changes when current flow creates real friction;
- TanStack Query/Form/Store ownership;
- idempotent state-writing effects;
- feature-neutral shell boundaries;
- className ownership;
- density alignment;
- Home vs Sidebar responsibilities;
- contextual reader settings;
- destructive-action behavior;
- actual render evidence vs source/build evidence.

## Verification performed

Verification was run on a fresh archive of the latest branch HEAD, not an older
checkpoint.

Dependency install:

```text
npm ci --ignore-scripts                 PASS
```

Targeted repository gates:

```text
npm run format:check                    PASS
npm run lint                            PASS
npm run agent:check                     PASS
npm run source:check                    PASS
npm run ui:check                        PASS
npm run typecheck                       PASS
npm run test:run                        PASS
```

Full canonical repository quality gate:

```text
npm run check                           PASS
```

This includes the repository's format, lint, agent-contract, source-standard,
UI-standard, API-registry, TypeScript, Vitest, production audit and Next build
stages as defined by `package.json`.

Deployment/build status for the refactor branch is also `success`.

Additional diff/structure checks performed during the refactor:

- no newly added explicit `any` / `unknown` / Zod any/unknown / TS suppression /
  handwritten union / assertion pattern detected by the refactor diff audit;
- no newly added named Tailwind palette recipe detected by the refactor diff
  audit;
- Header contains no HanziHome feature implementation import;
- Notes no longer contains the hard-coded `calc(100dvh - ...)` shell-height
  workaround;
- removed Home sitemap-card files are absent;
- canonical visual-component static/dynamic class scans found no feature call
  site that repairs Card/Badge/SelectTrigger/PageHeader/SegmentedControl/IconTile
  visual ownership in the refactored source.

## Visual verification boundary

The source/runtime environment has a headless browser, but no authenticated app
session or user credentials were available for the protected routes.

The refactor deliberately did **not** add an auth bypass or fake production user
only to manufacture screenshots.

Therefore the following must not be reported as already proven:

- authenticated desktop 1440×900 visual matrix;
- authenticated iPad portrait 820×1180 visual matrix;
- authenticated mobile 390×844 visual matrix;
- full mouse/touch/keyboard smoke pass against real user data;
- dark-mode visual regression across every protected route.

The repository verification contract in `docs/ui/ui-verification.md` records the
exact smoke-test matrix for that final product-level pass.

## Residual architecture notes

### Search product scope

The shared Header is now feature-neutral, but the current global search product
is still backed by HanziHome search data through `HanziHomeGlobalSearchBridge`.
This is intentional: there is not yet evidence for a second search domain that
justifies a generic CommandDialog/data abstraction.

If global search later expands to Notes/API/etc., design the data contract then;
do not move feature data logic back into Header.

### Named palette enforcement

No new named palette debt was added by this refactor. A future strict global
named-palette AST gate should be introduced only together with migration of all
pre-existing consumers and a passing full repository gate.

## Branch hygiene

Primary work is only on:

```text
refactor/ui-system-ux-architecture
```

A temporary checkpoint branch named
`refactor/ui-system-ux-architecture-temp-check` was created during preflight.
The available GitHub connector did not expose a safe delete-ref action during
this run, so it was left untouched rather than attempting an unsafe ref rewrite.
It contains no additional work beyond an early checkpoint and is not the branch
to merge.

## Merge readiness

Source-level quality gate: **PASS**.

Deployment/build status: **PASS**.

Remaining release decision: perform the authenticated visual/interaction smoke
matrix from `docs/ui/ui-verification.md`, then merge the primary refactor branch
through the repository's normal review flow.
