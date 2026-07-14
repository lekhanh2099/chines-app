# HanziHome feature instructions

The repository root `AGENTS.md` remains authoritative.

- Keep route pages thin; feature components own composition.
- Identify Study, Debug, or Edit Mode before changing a renderer.
- Browser reads go through typed repository/API clients and stable TanStack Query keys.
- Distinguish pending, error, and empty. Never map a failed query to empty content.
- Edit controls follow the current render node and submit only node-owned fields.
- Preserve stable DB IDs in editable children; array indexes are render-only fallbacks.
- Add Zod boundary tests for changed API, form, or mutation contracts.
- Do not import server-only modules into Client Components.
