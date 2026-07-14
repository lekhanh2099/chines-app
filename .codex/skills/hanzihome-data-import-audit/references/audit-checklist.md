# Import audit evidence

- Input inventory: path, format, encoding, bytes, source version.
- Count reconciliation: source → parsed → normalized → accepted/rejected.
- Required learner fields: Chinese text, pinyin where expected, Vietnamese meaning where expected.
- Identity: duplicate IDs, missing IDs, index-derived IDs, collisions across files.
- Relationships: course/book/lesson, section/lesson, child/parent, source refs.
- Shapes: unknown keys, unknown section/exercise types, nullable-vs-missing drift.
- Ordering: stable course, book, lesson, section, item, and child order.
- Safety: read-only default, transaction for explicit bulk writes, no secret output.
- Verification: representative source-to-row comparison and post-import count query.
