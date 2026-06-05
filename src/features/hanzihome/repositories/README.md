# HanziHome Content Repository

This folder is the boundary between HanziHome UI and the current static JSON
seed data.

Current implementation:

- Static JSON remains the built-in import/source format.
- `hanzihome-content-repository.ts` maps static data into resource-like runtime
  contracts.
- Feature UI should prefer repository methods or hooks that wrap repository
  methods instead of importing `static-data.ts` directly.

Future server implementation:

- Keep the repository contract stable where possible.
- Replace static repository internals with API/Supabase-backed reads.
- Overview should stay light: lesson metadata, sections, counts, progress, and
  small previews.
- Module screens can request full-enough data for that screen, such as vocab
  list/detail or grammar list/detail.

Do not split tiny nested data into separate requests unless it needs independent
querying. For example, vocab detail can embed examples, collocations, warnings,
and character analysis because the detail screen usually needs them together.
