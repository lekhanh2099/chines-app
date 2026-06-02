# HanziHome Static Data

HanziHome now reads built-in study content from static JSON in this repo.

## Runtime Sources

- `q2/vocab/*.json`: canonical Quyển 2 vocabulary source. The validator expects 25 lesson files and 1195 vocabulary items.
- `q2/lessons/*.json`: optional lesson text/reading/exercise JSON for lessons that have been rebuilt.
- `q2/lessons/*.json` and `q3/lessons/*.json`: canonical grammar/text/exercise/reading source when present.
- `hanzihome_radicals_clean.json`: retained radical reference source.

Supabase is not a content source for HanziHome lessons, vocabulary, or grammar in this phase. It is still used for auth and notes.

## Validation

Run:

```bash
npm run data:hanzihome:q2:validate
```
