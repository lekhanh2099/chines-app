# HanziHome Content Repository

This folder is the boundary between HanziHome UI and the current content
repository.

Current implementation:

- Supabase is the runtime source for catalog, lesson detail, aggregate, and
  search data.
- The reviewed Hanzi Studio Reader/practice corpus is an explicit static
  content family under `src/features/hanzihome/static-json/`; its server-only
  adapter is used only by the Studio migration routes and is not a fallback for
  canonical HanziHome content.
- New Studio user state is persisted in HanziHome-owned Supabase tables. Old
  Studio localStorage, IndexedDB, Convex state, and account data are never read.
- `hanzihome-content-repository.ts` exports the server repository that maps
  Supabase rows into resource-like runtime contracts.
- Feature UI should prefer repository methods or hooks that wrap repository or
  static-content adapter methods instead of importing JSON directly.

Repository contract:

- Keep the repository contract stable where possible.
- Keep static Studio content scoped to the migration adapter; do not merge it
  into canonical Supabase queries or add a silent JSON fallback.
- Overview should stay light: lesson metadata, sections, counts, progress, and
  small previews.
- Module screens can request full-enough data for that screen, such as vocab
  list/detail or grammar list/detail.
- Do not add silent JSON fallback on request paths. If Supabase data is invalid,
  fail loudly so the seed/import layer can be fixed.

Do not split tiny nested data into separate requests unless it needs independent
querying. For example, vocab detail can embed examples, collocations, warnings,
and character analysis because the detail screen usually needs them together.
