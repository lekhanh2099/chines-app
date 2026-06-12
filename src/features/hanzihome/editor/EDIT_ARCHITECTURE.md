# HanziHome Edit Architecture Note

HanziHome runtime reads canonical module files from `data/hanzihome-db`.
Study Mode renders typed view models derived from those modules; Edit Mode is an
overlay on the rendered nodes.

The old failure mode was:

1. A rendered node created a draft patch with only a view-model `path`.
2. `DraftChangesPanel` tried to infer the DB file at save time.
3. Exercise nodes often looked like `exercise` view-model patches and failed
   with `Section patch không có section file tương ứng`.

The current contract is:

- `EditableNodeWrapper` asks the feature service for a canonical DB target when
  the edit button opens.
- New patches store both `target` and `targetRelativePath`.
- The DB draft builder groups patches by target file and applies the relative
  path inside that module.
- Legacy path inference remains as a fallback for older in-memory patches only.
- Unsupported patches are reported and can be skipped while supported patches
  save normally.

This repository uses Next.js App Router, not TanStack Router. The
`HanziHomeFeatureProvider` therefore acts as the route-level dependency
injection boundary for feature services and the TanStack Store-backed UI state.

