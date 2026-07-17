# Frontend Structure and Ownership

This document describes the current target architecture for `chines-app`. It is
not a generic React folder template.

## 1. Dependency direction

```text
src/app
  ↓ composes
src/features
  ↓ may use
src/components/layout
src/components/patterns
src/components/form
src/components/ui
src/lib

src/components/ui and src/lib MUST NOT depend on feature implementation.
```

Cross-feature imports are allowed only through a stable public contract. Do not
import another feature's internal component, hook or private helper because it
happens to be convenient.

## 2. Directory responsibilities

### `src/app`

Owns:

- route files;
- layouts;
- server route handlers;
- route-level composition;
- Next.js metadata and boundaries.

Does not own:

- large feature UI;
- business transformations;
- local copies of feature queries or form logic.

A page should normally import and compose a feature entry component.

### `src/features/<feature>`

Owns:

- product behavior;
- feature-level components;
- feature hooks;
- feature schemas and adapters;
- feature query keys;
- feature-specific server/data contracts.

A feature may contain internal folders such as:

```text
components/
hooks/
schemas/
editing/
search/
listening/
memory-tips/
```

Do not force every feature into an identical folder tree.

### `src/components/ui`

Owns low-level reusable interactive and visual primitives.

Examples:

- Button;
- Dialog;
- Select;
- Sheet;
- Popover;
- Card;
- Badge;
- Input;
- Checkbox;
- Separator.

This is the only normal source boundary allowed to import Radix/Base UI
primitive packages directly.

Primitive props describe stable visual or interaction contracts:

- `variant`;
- `size`;
- `tone`;
- `density`;
- `placement`;
- `scrollMode`.

A primitive MUST NOT know HanziHome, Notes, Dictionary or Settings business
data.

### `src/components/patterns`

Owns reusable semantic compositions that are larger than a primitive but do not
belong to one feature.

Target examples:

```text
ActionMenu
SettingsMenu
CommandDialog
ResponsiveOverlay
EmptyState
```

Patterns own interaction anatomy and design-system composition. Features supply
labels, data and callbacks.

### `src/components/form`

Owns TanStack Form integration.

Form adapters MUST compose the canonical `src/components/ui` controls. They
MUST NOT establish a parallel visual system.

Do not create a second form framework wrapper without a migration decision.

### `src/components/layout`

Owns the app shell:

- global header;
- sidebar;
- workspace command header;
- breadcrumb;
- shared panel controls.

Layout components may compose patterns and primitives. They do not own feature
business data except route-context composition explicitly assigned to the app
shell.

### `src/lib`

Owns infrastructure and framework-agnostic helpers:

- Supabase client factories;
- request helpers;
- logging;
- shared parsers;
- safe storage utilities;
- stable pure utilities.

Do not place feature behavior in `lib` merely to share it.

### `src/services`

Owns server/data orchestration that spans repositories or external providers.

Services MUST NOT import Client Components.

### `src/stores`

Owns cross-feature client state only.

Before adding a store, prove the value has multiple non-local consumers or must
survive feature boundaries.

## 3. Server and client boundaries

- Server Components are the default in App Router.
- Add `"use client"` at the smallest practical interaction boundary.
- Client Components MUST NOT import server-only modules.
- Do not move a page or broad feature tree to the client merely because one
  child needs state.
- Browser APIs and client stores stay below a Client boundary.
- Route handlers validate input and derive trusted identity server-side.

## 4. State ownership matrix

| State                             | Owner                         |
| --------------------------------- | ----------------------------- |
| Route, deep link, browser history | Next.js route/search params   |
| Remote cached data                | TanStack Query                |
| Form input and validation         | TanStack Form                 |
| Small transient UI state          | local React state             |
| Cross-feature preference          | existing scoped Zustand store |
| Derived filters/options/counts    | pure calculation              |
| Browser persistence               | versioned storage adapter     |

## 5. Extraction rules

Extract a reusable component when:

- the same interaction anatomy exists in at least two meaningful consumers;
- accessibility behavior should be centralized;
- styling drift already exists;
- the component has a stable semantic name;
- feature-specific data can remain outside the component.

Keep code local when:

- it is a one-off product composition;
- extraction would require many boolean props;
- the contract is still changing;
- the shared name would be generic and meaningless;
- reuse is only visual coincidence.

## 6. Naming

Prefer responsibility names:

```text
ProfileSettingsMenu
GlobalSearchDialog
LessonReadingSettings
ActionMenuItem
```

Avoid:

```text
Wrapper
Container
Common
BaseItem
GenericComponent
```

unless the term is genuinely the domain concept.

## 7. Change procedure

Before moving a file or changing a shared API:

1. Search all consumers.
2. Identify server/client boundary impact.
3. Identify styles and behavior owned by callers.
4. Classify the change as additive or breaking.
5. Add a compatibility path when migration cannot be atomic.
6. Migrate by surface, not repository-wide replacement.
7. Verify affected interactions and run `npm run check`.
