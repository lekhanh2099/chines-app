# Hanzi Studio consolidation

This branch consolidates the learner-facing Hanzi Studio product into `chines-app` without changing `main`.

## Frozen sources

- Target base: `lekhanh2099/chines-app@a1e9e90574c8d228bbfddc0f225f64f0eb9c78b9`
- Reference product: `lekhanh2099/hanzi-studio@0568e6cd15d868ac968dfe03533d99429a4e9fcf`
- Hanzi Studio reference version: `1.5.0`

The Hanzi Studio commit above is the parity reference for this migration. Later Hanzi Studio commits are not silently pulled into the migration.

## Ownership after consolidation

- App shell, authentication, API boundary, database access and sync remain owned by `chines-app`.
- HanziHome remains the single learner feature owner under `src/features/hanzihome`.
- Hanzi Studio learner flows and domain behavior are ported or merged into HanziHome; a parallel `src/features/hanzi-studio` runtime tree is prohibited.
- Supabase normalized content remains the HanziHome runtime source. Source JSON may be copied only as migration/bootstrap/audit input.
- `useLearningState` and its local-first adapter remain the single persisted learner-state entry point. Rich Hanzi Studio session/review/personal-learning state is integrated into that owner rather than creating a second store.
- Convex auth/session/snapshot infrastructure from Hanzi Studio is not migrated.

## Feature disposition

| Hanzi Studio feature        | Target owner                   | Action                         |
| --------------------------- | ------------------------------ | ------------------------------ |
| studio                      | HanziHome workspace/library    | MERGE                          |
| reading                     | HanziHome lesson text/reading  | MERGE                          |
| listening-lab               | HanziHome listening            | MERGE                          |
| practice-lab                | HanziHome practice/dictation   | MERGE + ADAPT                  |
| learning-loop               | `hanzihome/learning-loop`      | MOVE + ADAPT persistence       |
| personal-learning           | `hanzihome/personal-learning`  | MOVE + ADAPT persistence       |
| radicals                    | HanziHome radicals             | MERGE                          |
| hanzi-inspector             | `hanzihome/hanzi-inspector`    | MOVE + ADAPT UI                |
| contextual-pronunciation    | HanziHome pronunciation/reader | MERGE                          |
| polyphonic-characters       | `hanzihome/polyphonic`         | MOVE + ADAPT UI                |
| humanities                  | `hanzihome/humanities`         | MOVE + ADAPT UI                |
| daily-reading               | `hanzihome/daily-reading`      | MOVE + ADAPT UI                |
| conversation                | `hanzihome/conversation`       | MOVE + ADAPT provider boundary |
| ai-settings                 | app Settings                   | MERGE                          |
| data-quality                | HanziHome audit/debug owners   | MERGE                          |
| Convex/auth/account/session | existing chines-app platform   | DROP source infrastructure     |

## Migration gates

Every migrated capability must preserve stable source identity and semantics where applicable. A feature is not considered migrated merely because a similar screen exists in `chines-app`.

Required parity evidence is grouped into:

1. source/data identity and ordering;
2. domain behavior tests;
3. persistence migration/normalization tests;
4. learner workflow tests;
5. phone, iPad portrait, constrained tablet and desktop UI checks for affected surfaces;
6. full `npm run check` on the final branch.

The branch owns a dedicated CI workflow so every consolidation push can run the same `npm run check` gate without widening the normal `main` push trigger.

Database schema/RLS changes, dependency changes, production data mutation and destructive cleanup remain separate confirmation boundaries under the repository risk policy.
