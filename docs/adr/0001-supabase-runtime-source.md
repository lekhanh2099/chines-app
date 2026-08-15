# ADR 0001: Supabase and the reviewed static Reader package are runtime sources

Status: accepted

## Decision

Normalized Supabase tables and RPCs are the runtime source for canonical HanziHome study content. The reviewed Hanzi Studio Reader/practice corpus is an explicit exception served from a checked-in, schema-validated static JSON package. It is not seeded into Supabase and is not a fallback for canonical Supabase content.

## Consequences

- UI and route handlers must not fall back to checked-in JSON after a canonical Supabase database error. Reader/practice routes use their explicit static package adapter and do not query Reader content tables.
- Dashboard reads use summary queries; selected lessons use detail queries.
- Import scripts must validate, report unmapped fields, and assign stable IDs.
- Any schema change requires a migration and refreshed generated TypeScript types.
