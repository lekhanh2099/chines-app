# HanziHome Product Docs

This folder keeps the product direction for the HanziHome learning workspace.

## Documents

- `local-studio-prd.md`: final PRD for the local JSON-first learning studio.
- `phase-next-prd.md`: next-phase product plan from the same source folder.

## Implementation Notes For This App

The current Next/Supabase app is not the same as the local-only studio described in the PRD. Treat the PRD as product direction and the clean dataset under `data/hanzihome` as the packaged source data.

Recommended bridge into the current app:

1. Keep Hán ngữ and HSK as source modes.
2. Add a preview import path for `data/hanzihome/hanzihome_bundle_clean.json`.
3. Map bundle lessons into the app's lesson-level learning workspace.
4. Map vocab records into vocabulary entries while preserving rich fields.
5. Map grammar points into grammar points and exercises.
6. Keep radicals as a separate reference module or inline writing/character aid.
7. Never overwrite user-edited database rows without explicit reset confirmation.
