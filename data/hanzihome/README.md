# HanziHome Clean Dataset

This folder is the packaged clean dataset for HanziHome learning flows.

## Source Of Truth

Use `hanzihome_bundle_clean.json` as the primary source for app import and local-studio flows. The split files are projections for focused import/export jobs and faster inspection.

## Files

- `hanzihome_bundle_clean.json`: full bundle with lessons, vocabulary, grammar points, radicals, and review flashcards.
- `hanzihome_lessons_index_clean.json`: lesson index and cross-reference ids.
- `hanzihome_vocab_clean.json`: detailed vocabulary records.
- `hanzihome_grammar_clean.json`: grammar lesson and point records.
- `hanzihome_radicals_clean.json`: radical reference records.
- `hanzihome_flashcards_clean.json`: lightweight review cards.
- `manifest.json`: generated validation manifest with counts and SHA-256 hashes.

## Current Counts

- Lessons: 25
- Vocabulary: 1146
- Grammar points: 59
- Radicals: 244
- Flashcards: 1390

## Validation

Run:

```bash
npm run data:hanzihome:validate
```

The validator checks:

- JSON parse health.
- Split file counts match the bundle.
- Duplicate ids.
- Lesson to vocab/grammar references.
- Vocab/grammar to lesson references.
- Flashcard references to vocab/radical source records.

To refresh `manifest.json` after replacing any dataset file:

```bash
node scripts/validate-hanzihome-data.mjs --write-manifest
```

## Import Policy

Do not import this directly into production tables without a preview step.

Recommended import order:

1. Validate this package.
2. Preview counts and lesson mapping.
3. Import into source-specific course records.
4. Preserve user-edited data unless the user explicitly chooses reset.
5. Keep the bundle version and file hashes in import metadata.
