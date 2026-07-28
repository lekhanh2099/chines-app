# HanziHome script instructions

The repository root `AGENTS.md` remains authoritative.

- Scripts are explicit import, migration, audit, verification, or generation tools; app runtime must not call them.
- Validate env and inputs before connecting or writing.
- Default audit commands to read-only. Destructive/reset behavior requires an explicit flag and clear output.
- Preserve source references, stable IDs, and unmapped-field diagnostics.
- Use Node/TypeScript and existing helpers under `scripts/lib/`; do not add Python for repository data work.
- Never print secrets or full credential-bearing connection strings.
- HanziHome vocabulary seed/import output MUST store words and phrases only in
  `hanzihome_vocab_items`; vocabulary lesson-section payloads keep metadata with
  `items: []`.
- Reject duplicate active vocabulary keys by `(lesson_id, word, pinyin)`.
  Examples and detail sections remain normalized child rows and MUST NOT be
  counted as duplicate vocabulary sources.
