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

Supabase remains the runtime source for canonical HanziHome courses, books,
lessons, study resources, learning state, notes, and user-owned artifacts.
The reviewed Hanzi Studio learning corpus is an explicit exception: its
published content is loaded from the checked-in static package through a
server-only adapter, while all new user state remains in HanziHome tables.
External JSON is never silently used as a fallback for canonical Supabase
content.

## Vocabulary ownership

`hanzihome_vocab_items` is the single canonical parent for vocabulary words and
phrases. `hanzihome_vocab_examples` and
`hanzihome_vocab_detail_sections` are normalized children of that parent, not
parallel vocabulary sources.

Vocabulary lesson sections preserve section metadata and ordering with
`payload.items = []`. The lesson mini-grid, vocab workspace, review and editor
all consume the dedicated normalized vocabulary resource through the same
TanStack Query cache. Derived mini-grid items must never be persisted back into
the lesson-section payload.

An active word or phrase is unique within its lesson by
`(lesson_id, word, pinyin)`. Recurrence across different lessons is allowed.
This invariant is enforced by the active database unique index and by seed
validation.

## Read contracts

| Screen/resource         | Owner                                          | Payload rule                                | Query key family             |
| ----------------------- | ---------------------------------------------- | ------------------------------------------- | ---------------------------- |
| Course library          | `/api/hanzihome/catalog`                       | Summary and counts; lesson detail is opt-in | `hanzihome/catalog`          |
| Course lesson picker    | catalog API with `courseId`                    | Lesson summaries for one course             | `hanzihome/course-lessons`   |
| Lesson workspace        | `/api/hanzihome/lessons/[lessonId]`            | One selected lesson detail                  | `hanzihome/lesson-detail`    |
| Aggregate vocab/grammar | `/api/hanzihome/aggregate/[kind]`              | Explicit course/book/lesson/search scope    | `hanzihome/aggregate`        |
| Learning state          | `/api/learning-state`                          | Authenticated user state only               | `hanzihome/learning-state`   |
| Studio Reader catalog   | `/api/hanzihome/reader/documents`              | One selected static collection at a time    | `hanzihome/reader/documents` |
| Studio Reader document  | `/api/hanzihome/reader/documents/[documentId]` | One static document and resolved references | `hanzihome/reader/document`  |

The browser client validates every response envelope before data reaches UI state. Loading, error, and empty are separate states; an API failure must not become an empty catalog.

## Write contracts

Normal content writes use the smallest stable entity ID and the smallest owning node. Route handlers resolve the authenticated user, verify ownership/editability and parent-child relationships, then perform a row-level update or a purpose-built RPC. Normal edits do not delete and reinsert child arrays.

Generated database types live in `src/types/supabase.generated.ts`. Zod schemas define network and form boundaries; generated types define database client boundaries. Neither replaces the other.

## Content modes

- Study Mode renders typed learner-facing view models and keeps answers collapsed.
- Debug/Audit Mode may expose unmapped payloads and source metadata when explicitly enabled.
- Edit Mode overlays the study render tree and produces field/node-level patches.

## Failure behavior

- Query errors render a retryable error state, not an empty-state message.
- Missing optional study content renders an honest placeholder and review metadata; fabricated pinyin, meaning, progress, or rewards are forbidden.
- Server env is parsed centrally. Backend secrets never enter Client Components.
