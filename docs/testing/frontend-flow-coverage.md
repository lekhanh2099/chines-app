# Frontend user-flow coverage

| Flow                | Required behavior                                                       | Current proof                                                      | Required addition                                                     |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Authentication      | safe next path, Google callback, logout, local/prod redirect separation | callback/confirm route tests plus URL helper tests                 | browser smoke with mocked/local auth; manual external OAuth checklist |
| Course library      | pending, error/retry, true empty, summary-only cards                    | catalog route and grouping tests                                   | component/browser state coverage                                      |
| Lesson navigation   | course/book/lesson selection, one detail request, missing lesson        | workspace module and API-schema tests                              | browser navigation and query-key assertions                           |
| Lesson rendering    | representative, sparse, and unknown exercise shapes                     | renderer registry and exercise tests                               | coverage for remaining renderer families                              |
| Edit mode           | field validation, dirty/reset, smallest-node save, sibling isolation    | schema, bulk-route, content-resource and query-invalidation tests  | form and mutation integration tests                                   |
| Dictionary          | lookup, cached result, progress mutation, legacy fallback               | mapper/service plus basic/detailed route-boundary tests            | cache/provider fallback and browser flow tests                        |
| Notes               | open tabs, edit/save, reload, malformed persisted state                 | Lexical persistence, versioned storage and malformed-storage tests | autosave callback integration and browser persistence tests           |
| Settings            | load/error/empty, add/update/delete API key, prompt reset/save          | typed API-key client and prompt-setting contract tests             | route/hook state matrix and browser flow                              |
| HTML artifacts      | create, edit, preview bridge, runtime state, publish, delete            | utility, runtime-bridge and auth/payload route tests               | lifecycle browser flow and publish/delete integration                 |
| Responsive overlays | keyboard, focus restore, nested select, scroll ownership                | UI guard plus primitive/source keyboard contracts                  | iPad/Android browser assertions and manual touch check                |

## Verification viewports

- iPad portrait: approximately `820 × 1180` with the desktop sidebar visible.
- Desktop: `1440 × 900`.
- Android-width: approximately `412 × 915`.

Every flow must distinguish loading, empty, error, stale/partial, disabled, and success states where those states are possible.
