# Frontend user-flow coverage

| Flow                | Required behavior                                                       | Current proof                         | Required addition                                                     |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Authentication      | safe next path, Google callback, logout, local/prod redirect separation | route and URL helper tests            | browser smoke with mocked/local auth; manual external OAuth checklist |
| Course library      | pending, error/retry, true empty, summary-only cards                    | catalog route and grouping tests      | component/browser state coverage                                      |
| Lesson navigation   | course/book/lesson selection, one detail request, missing lesson        | workspace module and API-schema tests | browser navigation and query-key assertions                           |
| Lesson rendering    | representative, sparse, and unknown exercise shapes                     | renderer registry and exercise tests  | coverage for remaining renderer families                              |
| Edit mode           | field validation, dirty/reset, smallest-node save, sibling isolation    | schema tests only for several nodes   | form and mutation integration tests                                   |
| Dictionary          | lookup, cached result, progress mutation, legacy fallback               | no dedicated flow test                | server mapper and browser flow tests                                  |
| Notes               | open tabs, edit/save, reload, malformed persisted state                 | no complete flow test                 | storage, autosave, and browser persistence tests                      |
| Settings            | load/error/empty, add/update/delete API key, prompt reset/save          | no dedicated flow test                | typed-client/hook tests and browser flow                              |
| HTML artifacts      | create, edit, preview bridge, runtime state, publish, delete            | utility tests only                    | runtime bridge tests and lifecycle browser flow                       |
| Responsive overlays | keyboard, focus restore, nested select, scroll ownership                | shared primitive behavior only        | iPad/Android browser assertions and manual touch check                |

## Verification viewports

- iPad portrait: approximately `820 × 1180` with the desktop sidebar visible.
- Desktop: `1440 × 900`.
- Android-width: approximately `412 × 915`.

Every flow must distinguish loading, empty, error, stale/partial, disabled, and success states where those states are possible.
