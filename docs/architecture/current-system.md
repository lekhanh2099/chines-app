# Current system architecture

## Runtime boundaries

```text
Browser UI
  → TanStack Query hooks
  → typed API client + Zod response validation
  → Next.js route handlers
  → server-only HanziHome repository or static Studio content adapter
  → normalized Supabase tables/RPCs or checked-in static JSON
```

Lesson content is checked-in static JSON: textbooks and the converted courses
(Giáo trình Hán ngữ, Boya) render in the textbook reader (`/textbooks/[book]`),
and the built-in Hanzi Studio courses are served by a server-only adapter
through the catalog, lesson, vocabulary, aggregate and listening routes (unknown
ids answer not found). Supabase holds radicals, the vocabulary store rows,
learning state, notes and user-owned artifacts. Lesson content is not edited in
the app.

## Vocabulary ownership

`hanzihome_vocab_items` holds the course vocabulary rows of the unified
vocabulary store (`vocabulary-index/`); a row's lesson is the converted course
lesson listed in `static-json/courses/legacy-routes.json`, and the store links
to that lesson in the textbook reader.

An active word or phrase is unique within its lesson by
`(lesson_id, word, pinyin)`. Recurrence across different lessons is allowed.
This invariant is enforced by the active database unique index and by seed
validation.

## Read contracts

| Screen/resource        | Owner                                            | Payload rule                                                                                  | Query key family             |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------- |
| Course library         | `/api/hanzihome/catalog`                         | Studio course summary and counts; radicals are opt-in                                         | `hanzihome/catalog`          |
| Course lesson picker   | catalog API with `courseId`                      | Lesson summaries for one course                                                               | `hanzihome/course-lessons`   |
| Lesson workspace       | `/api/hanzihome/lessons/[lessonId]`              | One selected Studio lesson detail                                                             | `hanzihome/lesson-detail`    |
| Vocabulary store       | server component + `/api/hanzihome/vocabulary/*` | Course vocabulary merged with bundled content; rebuilt only when the content revision changes | `hanzihome/vocabulary`       |
| Learning state         | `/api/learning-state`                            | Authenticated user state only                                                                 | `hanzihome/learning-state`   |
| Studio Reader catalog  | `/api/hanzihome/reader/documents`                | One selected static collection at a time                                                      | `hanzihome/reader/documents` |
| Studio Reader document | `/api/hanzihome/reader/documents/[documentId]`   | One static document and resolved references                                                   | `hanzihome/reader/document`  |
| Global search          | `/api/hanzihome/search`                          | Ranked, capped results + category counts                                                      | `hanzihome/search`           |

Global search is server-side (`src/features/hanzihome/search/server/`, MiniSearch).
The static index (extended textbooks, converted course books, Studio grammar course,
Studio Reader) is built lazily from the checked-in corpus once per process, so new
static lessons are included on deploy without an index step. Radicals are shared
rows re-read on a 5-minute TTL; the user's own notes are read live per request and
never cached across users. Exercise answers stay out of the index. The
browser never downloads the index.

The browser client validates every response envelope before data reaches UI state. Loading, error, and empty are separate states; an API failure must not become an empty catalog.

### Memory tips

Memory tips are a separate resource, not catalog or lesson-detail content:
`GET /api/hanzihome/memory-tips` → TanStack Query cache → `useRouteMemoryTip`
→ `GlobalMemoryTipCard`. Route changes and manual “Đổi câu” select from the
client cache without fetching lesson detail or refetching tips. Keep the
filtered tips array memoized as in `GlobalMemoryTipCard`; an array created
on every render changes the selection callback and can repeat its effect.
System tips remain read-only; user CRUD resolves ownership server-side and
uses Supabase RLS. The current GET returns the authenticated user's active,
non-system tips.

## Write contracts

Normal content writes use the smallest stable entity ID and the smallest owning node. Route handlers resolve the authenticated user, verify ownership/editability and parent-child relationships, then perform a row-level update or a purpose-built RPC. Normal edits do not delete and reinsert child arrays.

Generated database types live in `src/types/supabase.generated.ts`. Zod schemas define network and form boundaries; generated types define database client boundaries. Neither replaces the other.

Production migration checkpoint, 2026-11-13, project `pdrzkirlhbkmfpbcsujp`:

- Separately approved history-only repairs recorded `20261024124241` and
  `20260915160000` after proving their existing ACL and Auth function effects
  matched the repository. No Auth hook replay or session mutation occurred.
- Separately approved applications: `20261008113000` at 09:38:44 UTC,
  `20261113120000` at 09:42:47 UTC, and `20261113121000` at 09:45:12 UTC.
  Connector-generated versions `20261113093844`, `20261113094247` and
  `20261113094512` were reconciled to those canonical versions only after
  individual approval. Final registry matches all 17 repository migration files.
- Direct Notes/PDF writes and retired RPCs are revoked; CAS RPC ACLs are unchanged.
  Service-only browser RPC exposure is zero; 15 function changes add role guards
  only. The enrichment-job CHECK is validated and permits a deleted key's null
  live reference while preserving its required snapshot; 718 jobs, zero violations.
- Generated database types are unchanged. DATA-02 has zero cleanup candidates;
  no cleanup or business-row smoke writes occurred. The owner explicitly waived
  backup/PITR and production smoke; neither was verified. Local/CI regression
  success does not establish those production flows. Rollback requires separate
  approval: restore captured Notes/PDF grants, SEC-01 guard removal while retaining
  browser revokes, or DATA-07's prior strict CHECK as NOT VALID. Full grant restoration
  that would expose service-only RPCs to browsers is prohibited on production.

## Content modes

- Study Mode renders typed learner-facing view models and keeps answers collapsed.
- Debug/Audit Mode may expose unmapped payloads and source metadata when explicitly enabled.

## Failure behavior

- Query errors render a retryable error state, not an empty-state message.
- Missing optional study content renders an honest placeholder and review metadata; fabricated pinyin, meaning, progress, or rewards are forbidden.
- Server env is parsed centrally. Backend secrets never enter Client Components.
