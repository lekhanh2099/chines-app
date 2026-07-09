# HanziHome Content Repository

This folder is the boundary between HanziHome UI and the current content
repository.

Current implementation:

- Supabase is the runtime source for catalog, lesson detail, aggregate, and
  search data.
- Static JSON is no longer a checked-in runtime fallback. Seed/bootstrap data
  lives outside the app repo and can be supplied to data scripts with
  `HANZIHOME_DB_ROOT=/path/to/hanzihome-db`.
- `hanzihome-content-repository.ts` exports the server repository that maps
  Supabase rows into resource-like runtime contracts.
- Feature UI should prefer repository methods or hooks that wrap repository
  methods instead of importing seed JSON directly.

Repository contract:

- Keep the repository contract stable where possible.
- Overview should stay light: lesson metadata, sections, counts, progress, and
  small previews.
- Module screens can request full-enough data for that screen, such as vocab
  list/detail or grammar list/detail.
- Do not add silent JSON fallback on request paths. If Supabase data is invalid,
  fail loudly so the seed/import layer can be fixed.

Do not split tiny nested data into separate requests unless it needs independent
querying. For example, vocab detail can embed examples, collocations, warnings,
and character analysis because the detail screen usually needs them together.
