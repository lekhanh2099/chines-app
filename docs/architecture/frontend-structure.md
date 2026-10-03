# Frontend Structure and Ownership

This is the canonical directory and generic state-ownership contract for
`chines-app`. Domain-specific invariants remain in the nearest `AGENTS.md`.

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

Organize a feature by product responsibility, then by implementation role when
the group needs further separation. Keep workspace/page entries at the feature
root, or in the existing `workspaces/` pattern for multiple reading surfaces.
Keep tests next to their implementation.

| Folder          | Responsibility                                           |
| --------------- | -------------------------------------------------------- |
| `components/`   | Feature UI below the workspace/page entry.               |
| `hooks/`        | React hooks and query/interaction integration.           |
| `model/`        | Domain types, schemas, policies and pure derived models. |
| `services/`     | Client API/transport integration.                        |
| `repositories/` | Canonical data reads and writes.                         |
| `server/`       | Server orchestration, provider calls and workflows.      |
| `local/`        | Browser persistence, locks and persisted-data migration. |
| `runtime/`      | Runtime stores, selectors and lifecycle agents.          |

Use a product group such as `source/`, `enrichment/`, `memory/`, `editing/` or
`listening/` when it owns a distinct part of the feature. A small product group
may keep its related files together; split it by role when responsibilities
become difficult to follow. Preserve `.server`/`.client` boundaries within
product groups.

Create only folders with current owners and consumers. Do not force every
feature into an identical folder tree or split a coherent group by file count
alone. Existing feature-local `schemas/` directories remain valid owners;
relocation must preserve their contracts and consumers.

Cross-feature consumers use the feature's explicit entry, domain/service
contract, or an explicitly shared feature UI contract such as
`settings/components/AddApiKeyDialog`. A barrel file is not required, and must
not mix server-only modules with client exports. Directory moves preserve state
ownership, public behavior, routes and persistence formats.

Concrete precedents are `src/features/reading` for workspaces, models,
repositories, services and local persistence, and `src/features/reader` for
generic model/runtime/component separation. The same rule is applied to
`daily-reading`, `hanzihome/ai-conversation` and `settings`.

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

Group primitives by their interaction or presentation responsibility:

| Folder        | Existing owners                                                  |
| ------------- | ---------------------------------------------------------------- |
| `actions/`    | Button, IconButton, ActionCard and Chip.                         |
| `forms/`      | Input, selection controls, Label and Field anatomy.              |
| `navigation/` | Breadcrumb and content-panel Tabs.                               |
| `overlays/`   | Dialog, Sheet, DropdownMenu, Popover, Tooltip and FloatingLayer. |
| `display/`    | Typography, Badge, Avatar, IconTile and DataTable.               |
| `layout/`     | Card, PageHeader, Separator and Resizable.                       |
| `feedback/`   | Spinner and QueryErrorCard.                                      |

The shared `focus-ring.ts` recipe stays at the UI root because controls across
groups use it. Import the concrete module directly; do not add root forwarding
files or a barrel that combines client and server-compatible primitives.
`components.json` keeps `aliases.ui` at this boundary. Registry output must be
reviewed against the grouped local source before applying it; place additions
in the matching group and update their consumers instead of duplicating an
existing primitive at the root.

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

| Folder        | Responsibility                                                 |
| ------------- | -------------------------------------------------------------- |
| `header/`     | Header, breadcrumb, profile menu and locale switcher.          |
| `navigation/` | Sidebar/mobile navigation, route map, logo and focus guard.    |
| `scroll/`     | AppScrollViewport, scroll positioning and chrome scroll state. |
| `theme/`      | ThemeProvider and the persisted theme contract.                |
| `runtime/`    | AppToaster and PWA service-worker lifecycle integration.       |
| `workspace/`  | Page/section composition, command header and panel controls.   |

Tests stay next to the corresponding owner. Moving Header or navigation must
not move feature search data, route toolbar registrations or scroll ownership
into those components.

### `src/lib`

Owns infrastructure and framework-agnostic helpers:

- Supabase client factories;
- request helpers;
- logging;
- shared parsers;
- safe storage utilities;
- stable pure utilities.

Do not place feature behavior in `lib` merely to share it.

Use infrastructure groups such as `ai/`, `api/`, `audio/`, `auth/`, `editor/`,
`env/`, `pronunciation/`, `query/`, `schema/`, `security/`, `storage/`, `supabase/`
and `text/`. AI contracts/model catalogs remain separate from provider/data
orchestration in `src/services/ai`. Encryption stays in `security/`; browser
storage adapters stay in `storage/`. The cross-cutting `logger.ts` and `utils.ts`
remain at the root. Directory grouping does not make a server module safe to
import from a client.

### `src/services`

Owns server/data orchestration that spans repositories or external providers.

Services MUST NOT import Client Components.

Group current services by domain: `ai/` owns AI runtime, task routing, prompt
settings, provider calls and API-key persistence; `notes/` owns note data;
`vocab/` owns vocabulary/dictionary data. Preserve each service's exported
contract and existing server-only boundary. Do not split an existing service's
business logic solely to populate subfolders.

### `src/stores`

Owns cross-feature client state only.

Before adding a store, prove the value has multiple non-local consumers or must
survive feature boundaries.

Group stores by the interaction they own: `shell/` for chrome, focus, toolbar,
sidebar and pending navigation; `search/` for global search interaction;
`dictionary/` for lookup, inspector and vocabulary detail interaction;
`notes/` for note tabs and split view. The cross-store migration test remains at
the root. These folders preserve the existing cross-feature state owners and
storage keys; they are not new stores or copies of feature/query state.

### `scripts`

Owns CI/release checks, audits and import tooling.

## 3. Server and client boundaries

- Server Components are the default in App Router.
- Add `"use client"` at the smallest practical interaction boundary.
- Client Components MUST NOT import server-only modules.
- Do not move a page or broad feature tree to the client merely because one
  child needs state.
- Browser APIs and client stores stay below a Client boundary.
- Route handlers validate input and derive trusted identity server-side.
- External data and IDs are validated/normalized once at their owning boundary.

## Installed dependency authority

For framework and library behavior, inspect the lockfile/installed version,
local source, installed exported types and version-matched documentation before
the semver range in `package.json` or remembered APIs. Generic or latest
upstream examples do not override the installed contract.

## 4. State ownership matrix

One value has one authoritative owner:

| State                             | Owner                          |
| --------------------------------- | ------------------------------ |
| Route, deep link, browser history | Next.js route/search params    |
| Remote cached data                | TanStack Query                 |
| Form input and validation         | TanStack Form                  |
| Small transient UI state          | local React state              |
| Cross-feature preference          | existing scoped TanStack Store |
| Derived filters/options/counts    | pure calculation               |
| Browser persistence               | versioned storage adapter      |

Do not mirror Query/Form/Store/route state into local state without an explicit
editable-draft or external bridge contract. Do not synchronize two owners
bidirectionally, use effects for pure derivation, or repair rendering with
timeouts, random keys or force-render. Broad cache invalidation must not hide
unclear ownership. Loading, empty and error states remain distinct.

Every state-writing effect must synchronize a real external system,
subscription or imperative bridge and be idempotent: repeating the same
authoritative inputs cannot keep producing state changes. Browser persistence
uses versioned schemas and safe parsing/migration at its owning boundary.

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
7. Verify affected consumers/interactions using the tier defined in root
   `AGENTS.md`; shared migrations and breaking contracts require the full gate.
