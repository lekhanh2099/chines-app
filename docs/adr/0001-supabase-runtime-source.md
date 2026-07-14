# ADR 0001: Supabase is the study-content runtime source

Status: accepted

## Decision

Normalized Supabase tables and RPCs are the only runtime source for HanziHome study content. Static JSON and external source folders are migration/bootstrap/audit inputs only.

## Consequences

- UI and route handlers must not fall back to checked-in JSON after a database error.
- Dashboard reads use summary queries; selected lessons use detail queries.
- Import scripts must validate, report unmapped fields, and assign stable IDs.
- Any schema change requires a migration and refreshed generated TypeScript types.
