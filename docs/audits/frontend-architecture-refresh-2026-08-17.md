# Frontend Architecture Refresh — 2026-08-17

Baseline: `main@3f05243b2f6912dcb333945338185c3cf5b7e9cd`

This is a fresh source audit against the current repository contracts. Older audit findings are historical evidence only; they are not carried forward unless they still reproduce on this baseline.

## Status model

- `OPEN`: current source still violates or obscures an owned contract.
- `FIXED`: current source has a durable owner/contract for the old issue.
- `NEEDS_RUNTIME_PROOF`: source inspection cannot prove the user-visible claim.
- `INTENTIONAL`: current behavior is supported by a documented owner.

## Current findings

### A01 — P1 — Home recent-activity labels are derived from data that the catalog summary does not contain

Status: `OPEN`

Evidence:

- `src/features/home/hooks/useHomeDashboard.ts` requests `useHanziHomeCatalogData({ includeLessons: true })`.
- It then builds vocabulary and grammar label maps from `catalog.lessons[*].vocab` and `catalog.lessons[*].grammar`, and radical labels from `catalog.radicals`.
- `src/features/hanzihome/data/server/supabase-hanzihome-content-repository.ts::lessonSummaryToViewModel` intentionally returns `vocab: []`, `grammar: []`, `vocabIds: []`, and `grammarPointIds: []` for lesson summaries.
- The Home request does not set `includeRadicals`, so `catalog.radicals` is also empty.

Consequence:

Recent review activity falls back to generic labels such as `Từ vựng đã ôn`, `Điểm ngữ pháp đã ôn`, and `Bộ thủ đã ôn` instead of resolving the actual reviewed item. The current code also creates label maps from collections that are structurally empty on this query path.

Owner:

Home dashboard composition owns the display requirement; HanziHome catalog summaries own summary-only loading and must not be expanded with full lesson content merely to repair Home labels.

Recommendation:

Add or reuse a lightweight review-activity label/resource contract that resolves only the recent reviewed IDs. Do not make Home load full lesson vocab/grammar/radical datasets.

### A02 — P2 — Internal TypeScript state is modeled through Zod type algebra

Status: `OPEN`, first cleanup batch started.

Evidence includes:

- `src/features/hanzihome/html-artifacts/HanziHomeHtmlArtifactsPage.tsx`: local UI states (`MobilePane`, `InspectorTab`, `PreviewMode`, drag/delete state, move/history direction, nullable refs) are synthesized through Zod types even though no runtime parsing is required for those values.
- `src/features/dictionary/types.ts` and `src/features/dictionary/hooks/useDictionaryPageViewModel.ts`: nullable internal view-model/state types were expressed as `z.infer<z.ZodNullable<...>>`.
- `src/features/home/types.ts`: Home-only compile-time view models were expressed as exported Zod schemas with no runtime parse consumer found in the current source search.
- `src/features/hanzihome/repositories/hanzihome-content-api-client.ts`: the local `Nullable<T>` helper was expressed through Zod even though the file already keeps Zod where response parsing is actually required.

Contract:

Root `AGENTS.md` requires TypeScript for internal compile-time modeling and Zod only at actual runtime trust boundaries.

Correction rule:

Use native TypeScript unions/nullability for internal state. Keep Zod for API/JSON/persisted/provider/database boundaries and real `safeParse`/`parse` operations.

### A03 — P2 — HTML artifacts workspace still co-locates too many owners

Status: `OPEN`

Evidence:

`src/features/hanzihome/html-artifacts/HanziHomeHtmlArtifactsPage.tsx` is 71,662 bytes on this baseline and currently owns URL selection, directory/filter state, drag/drop, CRUD mutations, editor draft state, iframe preview/runtime-state bridge orchestration, fullscreen state, responsive pane state, publish connection UI, dialogs, and several large child components in one module.

Important nuance:

The existing effects are not automatically invalid. Fullscreen keyboard handling, matchMedia subscription, iframe messaging, object-URL cleanup, URL replacement and delayed runtime-state persistence are real external/imperative bridges. The refactor must split responsibility without deleting legitimate effects merely to reduce hook count.

Recommendation:

Split by stable ownership boundary (workspace orchestration, directory, preview/runtime bridge, editor/form, dialogs), preserving route/API/persisted contracts.

### A04 — P2 — Supabase HanziHome content repository still mixes query and mapping responsibilities

Status: `OPEN`

Evidence:

`src/features/hanzihome/data/server/supabase-hanzihome-content-repository.ts` is 34,921 bytes. Row schemas have already been extracted to `supabase-content-row.schemas.ts`, but the repository still contains row-to-view-model mapping/normalization, catalog/lesson/vocab/radical/aggregate queries and the public repository facade in one module.

Recommendation:

Extract pure mappers and query groups while preserving the repository facade and all database/API behavior. No schema/RLS migration is required for this refactor.

### A05 — P1 — Authenticated browser-flow coverage is not proven by the current test stack

Status: `NEEDS_RUNTIME_PROOF`

Current Vitest/API/source guards cover many contracts, but the repository has no Playwright dependency or browser-test script. Source inspection cannot prove authenticated navigation, persistence/reload, overlay focus, touch/iPad behavior or the HTML-artifact lifecycle end to end.

Adding Playwright is a dependency change and therefore requires explicit confirmation under `AGENTS.md`; it is not part of the current automatic cleanup.

### A06 — P2 — HanziHome performance guard is source-pattern evidence, not runtime performance evidence

Status: `NEEDS_RUNTIME_PROOF`

`scripts/check-hanzihome-performance.mjs` checks specific source strings and known boundaries. It can prevent selected regressions, but it cannot prove request count, payload cost, rerender cost, route responsiveness or long tasks.

Do not add more source-string heuristics as a substitute for runtime profiling. Re-evaluate this script after repeatable runtime evidence exists.

## Older findings confirmed fixed on current structure

- Feature query-key ownership exists for HanziHome, Dictionary, Notes and other active domains rather than route-local duplicated key arrays.
- Browser persistence has a versioned storage adapter and tests.
- Settings API-key presentation uses its managed hook rather than owning raw transport in the section component.
- `/dictionary` route composition is thin and delegates to the dictionary feature entry.

These stay `FIXED` unless a current regression is found.

## Execution order from this audit

1. Finish safe TypeScript/Zod ownership cleanup where behavior is unchanged.
2. Repair Home recent-activity data ownership without loading full lesson content.
3. Refactor the HTML-artifacts workspace by ownership boundary.
4. Split the Supabase content repository into mapper/query/facade responsibilities.
5. Sweep remaining state-writing effects and cache invalidation only after their real owners are traced.
6. Add runtime/browser proof only after explicit approval for any new dependency.
7. Profile performance with runtime evidence before deleting or replacing performance guards.
