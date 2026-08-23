# HSK grammar library — route integration plan

## Goal

Integrate the reviewed HSK1–HSK6 grammar corpus into the existing HSK product surface without replacing the existing course-grammar library.

## Route ownership

```text
/hsk             -> HSK reading catalog
/hsk/[slug]      -> HSK reading document
/hsk/grammar     -> HSK grammar library
/grammar         -> existing course/lesson grammar aggregate
```

`/hsk/grammar` is the canonical route for the HSK grammar corpus. The generic `/grammar` route remains owned by `HanziHomeAggregateLibrary kind="grammar"`.

The shared `/hsk` layout owns only contextual navigation between HSK Reading and HSK Grammar. Reading and grammar retain separate feature/data owners.

## UI contract

HSK Grammar uses existing canonical components only: `PageHeader`, `Card`, `Button`, `Input`, `Select`, `Tabs`, `Badge`, `Separator`, `Typography`, and HanziHome learner typography.

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

## State ownership

- selected HSK level -> URL `level`
- selected grammar point -> URL `point`
- keyword filter -> local transient state
- static corpus load/cache -> TanStack Query
- corpus validation -> Zod boundary

No DB schema, RLS, persisted learner-state, or GitHub Actions change belongs to this feature.

## Corpus contract

The source contract is `hsk_grammar_v1.0.0` and must remain unchanged across HSK1–HSK6.

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

Every loaded dataset must pass schema validation and match its registered level/item count before rendering.

## Verification

Required before calling the full corpus integration complete:

1. All six runtime assets are present and decode successfully.
2. Counts equal 40/97/141/161/83/55.
3. `/hsk`, `/hsk/[slug]`, and `/hsk/grammar` keep the correct contextual nav state.
4. `/grammar` remains unchanged.
5. Desktop, iPad portrait, and mobile render without horizontal overflow.
6. HSK6 lexical-discrimination entries render safely when `structures` is empty.
7. Keyboard operation works for Tabs, Selects, previous/next controls, and route navigation.
8. Run targeted checks, then `npm run check` for completion.
