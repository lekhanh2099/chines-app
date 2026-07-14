# Contributing

Read `AGENTS.md` before changing HanziHome code. Inspect the current data and render path first, then choose the smallest safe slice.

## Change workflow

1. State the read owner, payload boundary, cache key, loading/error/empty behavior, and expected payload size.
2. For edits, state the stable entity ID, owned fields, authorization check, parent relationship check, and invalidation scope.
3. Add or update Zod boundary tests when an API/form contract changes.
4. Add a timestamped Supabase migration for schema changes; never edit production schema only through the dashboard.
5. Run `npm run check` and `npm run deps:check` before opening a pull request.

Do not commit secrets, generated build output, raw production data, or app code that writes static JSON.
