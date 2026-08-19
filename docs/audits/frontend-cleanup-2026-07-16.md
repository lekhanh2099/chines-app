# Frontend cleanup audit — 2026-07-16

## Baseline

- Stack: Next.js 16, React 19, TypeScript 6, TanStack Query/Form, Zod 4, Tailwind CSS 4, Radix/Base UI, Supabase, Zustand, Vitest.
- Quality gate: `npm run check` passes on commit `f431af5f` with 90 tests and a successful production build.
- Runtime study content source: normalized Supabase tables. External seed artifacts are import/bootstrap inputs only.
- Primary product viewport: iPad portrait, followed by desktop and Android-width layouts.

Passing the automated gate proves build health. It does not prove that component ownership, state flow, or interaction design is easy to understand.

## Architecture inventory

| Surface            | Route/container                                               | State and data owner                                        | Primary contract                           |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| App shell and auth | `src/app/layout.tsx`, `(app)/layout.tsx`, `login/page.tsx`    | Supabase session, shell stores, route search params         | authenticated route and safe redirect      |
| Home/library       | `src/features/home`, `HanziHomeLibraryHome`                   | catalog query and learning-state query                      | summary-only catalog payload               |
| Lesson workspace   | `HanziHomeWorkspace`                                          | route params, feature provider, lesson/resource queries     | one selected lesson detail                 |
| Dictionary         | `(app)/dictionary/page.tsx`                                   | server fetch plus client query hooks                        | normalized dictionary view model           |
| Notes/editor       | `src/features/notes`, `src/components/notes`, Lexical plugins | note queries, note-tab/split-view stores                    | note detail and debounced persistence      |
| Settings           | `SettingsPageContent`, `ApiKeyManagerSection`                 | local request state and settings APIs                       | authenticated settings payloads            |
| HTML artifacts     | `HanziHomeHtmlArtifactsPage`                                  | artifact queries, local editor/runtime state, iframe bridge | artifact CRUD and isolated preview         |
| HanziHome data     | `supabase-hanzihome-content-repository`                       | Supabase queries and Zod row parsing                        | catalog/detail/aggregate repository facade |

## Findings

### F-01 — HTML artifact page owns too many responsibilities

- Priority: P1.
- Evidence: `HanziHomeHtmlArtifactsPage.tsx` is 2,676 lines and contains runtime-state serialization, iframe bridge injection, directory drag/drop, preview, editor, publish integration, and six dialog/pane families.
- Impact: a change to one interaction requires understanding unrelated security, storage, layout, and form code; regression testing cannot target stable boundaries.
- Fix: extract runtime bridge, page controller hooks, directory, preview, editor, and dialogs behind typed internal contracts while preserving the route and API payloads.
- Acceptance: the route-level page composes named feature modules; runtime bridge has pure unit tests; directory/editor/preview state can be tested independently.

### F-02 — Supabase content repository mixes boundary validation, mapping, querying, and facade behavior

- Priority: P1.
- Evidence: `supabase-hanzihome-content-repository.ts` is 1,332 lines with more than 20 row schemas, view-model mappers, pagination helpers, aggregate queries, detail queries, and the exported repository object.
- Impact: data-contract changes and query changes share one large blast radius; mapper tests require importing server-only query infrastructure.
- Fix: split row schemas/types, pure mappers, scoped query modules, and the repository facade without changing public DTOs.
- Acceptance: pure mapper tests run without Supabase; each query module returns parsed rows; repository consumers keep the same interface.

### F-03 — Query keys and invalidation policy are duplicated

- Priority: P2.
- Evidence: lesson-detail, catalog, course-lessons, notes-list, and vocab-detail keys are repeated as array literals across hooks, dialogs, and edit wrappers.
- Impact: key-shape drift and broad invalidation are easy to introduce; ownership is difficult to review.
- Fix: define feature-local key factories and invalidation helpers, then migrate call sites.
- Acceptance: no duplicated canonical key literals outside their key module and tests; invalidation tests cover the smallest required scope.

### F-04 — Settings components own transport and presentation together

- Priority: P2.
- Evidence: `ApiKeyManagerSection.tsx` performs six direct `/api/settings/api-keys` requests and owns loading, validation, mutation, dialog, and list rendering state.
- Impact: request errors and stale UI transitions are coupled to a 600-line component and lack a reusable typed boundary.
- Fix: introduce a typed API client and TanStack Query hooks; keep component state limited to form/dialog interaction.
- Acceptance: loading/error/empty/mutation behavior is tested at the hook/client boundary and the component contains no direct fetch.

### F-05 — Persisted UI state has inconsistent validation and migration behavior

- Priority: P2.
- Evidence: sidebar, focus mode, note tabs, split view, inspector, dictionary overrides, AI prompt settings, workspace layout, and memory tips read independent unversioned localStorage shapes.
- Impact: malformed or stale browser state can produce inconsistent fallback behavior and future shape changes cannot migrate safely.
- Fix: shared versioned storage envelope and feature-owned Zod schemas with SSR guard, migration, corrupted-data fallback, and reset behavior.
- Acceptance: each persisted store has valid, legacy, malformed, and unavailable-storage tests.

### F-06 — Effect-heavy modules require ownership cleanup

- Priority: P2.
- Evidence: more than 60 effects exist; the densest modules are HTML artifacts, note tabs/editor, Lexical toolbar, and workspace synchronization.
- Impact: derived state, external synchronization, and event-driven state are difficult to distinguish; stale closure and render-loop risks are harder to review.
- Fix: classify every effect and remove only effects that mirror derived/query/form state. Keep browser integration, subscription, autosave, and editor synchronization explicit.
- Acceptance: every remaining non-trivial effect has one external synchronization responsibility and targeted transition coverage.

### F-07 — Route and feature boundaries are uneven

- Priority: P2.
- Evidence: most route pages are thin, while Dictionary is 379 lines and combines server querying, legacy compatibility parsing, mapping, and page UI.
- Impact: the route boundary is inconsistent and dictionary compatibility logic is hard to retire safely.
- Fix: move query/parsing/mapping into feature server modules and leave the page responsible for authentication and composition.
- Acceptance: the page is a thin server composition layer and legacy parsing has direct tests.

### F-08 — Automated coverage does not match the user-flow risk

- Priority: P1.
- Evidence: current tests protect several auth, schema, renderer, and local-first contracts, but there is no complete browser flow for login, lesson navigation, notes persistence, settings mutations, or HTML artifact lifecycle.
- Impact: a green build can still ship interaction, responsive, or cross-boundary regressions.
- Fix: add a behavior coverage matrix and browser verification for critical flows, including iPad portrait and Android-width checks.
- Acceptance: every critical flow has deterministic automated coverage or an explicit reproducible manual check where browser automation cannot safely own external OAuth.

## UI-system assessment

The current token drift is low: no feature-local hard-coded hex colors, arbitrary gradients, or arbitrary shadows were found. Most high z-index values are correctly owned by overlay primitives. The actionable UI debt is interaction hierarchy and component responsibility rather than a global palette rewrite.

Deep redesign must preserve the existing gradient/glass identity, Course → Book → Lesson → Module information architecture, and the current study data contracts.

## Legacy compatibility policy

Runtime compatibility remains active for vocabulary cache/progress, lookup mirroring, lesson route IDs, API-key migration, and selected renderer input shapes. These paths are not dead solely because they contain `legacy`.

Each removal requires:

1. current production-data evidence;
2. no remaining runtime consumer;
3. a migration or compatibility reader when the persisted shape changes;
4. regression coverage for the canonical path;
5. a separate rollback boundary.

## Completion rule

The cleanup is complete only when a final audit finds no actionable P0–P2 or minor code-style, state-flow, or UI/UX issue. Intentional exceptions must name the contract they protect and the test or verification that proves it.
