# ADR 0004: Lesson DTO and resource boundaries

Status: accepted

## Decision

Raw import data, domain rows, API DTOs, and UI view models are distinct contracts. The server repository owns composition from normalized rows into lesson DTOs. The browser must not reconstruct a lesson by joining unrelated endpoint payloads.

Catalog, selected-lesson detail, and aggregate resources have separate response schemas and stable query-key families. Response envelopes are validated at the API-client boundary.

## Consequences

- Course cards never fetch full lesson content to calculate counts.
- A selected lesson may load its own detail and explicitly deferred resources.
- Mutation invalidation targets the smallest affected resource plus lesson detail when required.
