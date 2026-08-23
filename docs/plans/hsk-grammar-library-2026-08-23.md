# HSK grammar library — UI-first integration plan

## Current scope

Build and verify the final `/hsk/grammar` learning UI before attaching the full HSK1–HSK6 corpus. The existing `/grammar` course/lesson aggregate remains unchanged.

## Route ownership

```text
/hsk             -> HSK reading catalog
/hsk/[slug]      -> HSK reading document
/hsk/grammar     -> HSK grammar library
/grammar         -> existing course/lesson grammar aggregate
```

The shared `/hsk` layout owns only contextual navigation between HSK Reading and HSK Grammar.

## UI contract

HSK Grammar reuses canonical project components: `PageHeader`, `Card`, `Button`, `Input`, `Select`, `Tabs`, `Badge`, `Separator`, `Typography`, and HanziHome learner typography.

Desktop uses a narrow level/item rail plus a primary detail document. Tablet/mobile uses level and point `Select` controls instead of squeezing the rail.

Detail hierarchy:

```text
identity + focus
-> core meaning / usage
-> structures
-> usage notes / constraints
-> contrasts / common errors
-> examples by tier
-> source / verification
```

## Demo data

The UI currently embeds exactly one real reviewed item from the user's HSK4 corpus (`hsk4-g001`) only to exercise every important renderer state. Other HSK levels intentionally show an empty state.

The demo is not a replacement corpus and must not be expanded by inventing learning content.

There is no public `/data` transport, gzip/base64 chunking, browser decompression, or locale-proxy exception.

## Future corpus import

The authoritative future corpus remains the user's six raw JSON files using schema `hsk_grammar_v1.0.0`.

Expected inventory:

```text
HSK1  40
HSK2  97
HSK3 141
HSK4 161
HSK5  83
HSK6  55
Total 577
```

When the corpus is attached, only the owner behind `loadHskGrammarDataset(level)` should change. Route, URL state, navigation, detail renderer, example tabs, typography, and responsive layout stay unchanged.

Acceptable future sources include:

1. reviewed static JSON co-located with the HSK grammar feature; or
2. an explicit import flow that validates user-selected JSON before putting it into the same typed dataset contract.

Do not reintroduce encoded transport artifacts merely to move static JSON through the app.

## State ownership

- selected HSK level -> URL `level`
- selected grammar point -> URL `point`
- keyword filter -> local transient state
- dataset cache -> TanStack Query
- corpus validation -> Zod at the data boundary when external JSON is attached

No DB schema, RLS, persisted learner state, or GitHub Actions change belongs to this feature.

## Verification for UI-demo completion

1. `/hsk/grammar` opens on HSK4 and renders `hsk4-g001`.
2. Core, structure, common-error, example-tier, source, and verification sections render.
3. HSK1/2/3/5/6 switch to a deliberate empty state rather than a blank screen or network error.
4. No request is made to `/data/hsk-grammar/**`.
5. `/hsk` and `/grammar` preserve their existing owners.
6. Desktop, iPad portrait, and phone stay usable without horizontal overflow.
7. Keyboard operation works for Tabs, Selects and route navigation.
8. Run targeted checks locally before considering the UI demo complete.
