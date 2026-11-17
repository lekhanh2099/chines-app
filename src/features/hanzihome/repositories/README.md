# HanziHome Content Repository

This folder is the boundary between HanziHome UI and its content sources.

- Lesson content is checked-in static JSON under `src/features/hanzihome/static-json/`.
  Textbooks and the converted courses render in the textbook reader; the built-in
  Hanzi Studio courses are served by `static-json/studio-published-content.server.ts`
  through the catalog, lesson, vocabulary, aggregate and listening routes.
- `hanzihome-content-repository.ts` exports the server repository for the database
  content that remains: radicals and the vocabulary store rows
  (`hanzihome_vocab_items`).
- `hanzihome-content-api-client.ts` is the validated browser client of those routes;
  `hanzihome-content-resources.ts` holds the shared resource types and builders.

Do not add a silent JSON fallback for database reads or a write API for static
content. If database data is invalid, fail loudly.
