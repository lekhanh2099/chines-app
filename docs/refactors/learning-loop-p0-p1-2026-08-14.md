# Learning Loop P0/P1 — Review Handoff

Date: 2026-08-14

Branch: `feat/learning-loop-p0-p1-review`

Base: `main` at `a1e9e90574c8d228bbfddc0f225f64f0eb9c78b9`.

## Goal

Turn existing HanziHome review and listening interactions into a first coherent learning loop without changing database semantics, authentication, RLS, or public API contracts.

```text
lesson / aggregate review
  -> review result
  -> atomic learning-state mutation
  -> derived due time
  -> /review
  -> Home attention signal

self-graded listening item
  -> local attempt event
  -> mastery / recovery streak
  -> weak-item classification
  -> /practice-errors
  -> Home attention signal

source playback / TTS
  -> microphone recording
  -> local replay
  -> retry / discard
```

## P0 — Review scheduling

The review scheduler is a pure domain module over the fields already persisted by `LearningProgressItem`.

Current intervals:

```text
learning -> 10 minutes
hard     -> 1 day
known level 0/1 -> 1 day
known level 2   -> 3 days
known level 3   -> 7 days
known level 4   -> 14 days
known level 5   -> 30 days
```

Result transitions:

```text
again -> level 0, learning
hard  -> retain current stage (minimum 1), hard
known -> advance one stage, cap 5, known
```

This is intentionally **not described as FSRS**. It is a deterministic, replaceable scheduling contract for this review slice.

Untouched `new` items never enter the due queue. Legacy `learning` / `hard` rows without `lastReviewedAt` remain reviewable.

`useLearningState.recordReview()` now writes the progress transition and review-history event in one local-first state update.

New route: `/review`.

The review deck freezes its membership after the first answer. This prevents the current due item from disappearing after rescheduling and accidentally shifting the next item out of the active session.

## P0 — Practice error intelligence

Current producer coverage is deliberately limited to listening item types whose correctness is deterministic:

- `single_choice` / `stress_choice`;
- `true_false` / `same_different`;
- `fill_blank`.

The branch does not invent correctness for open-answer, oral-response, shadowing, or matching interactions.

Per-item local progress records:

- attempt count;
- correct count;
- consecutive-correct count;
- mastery ratio;
- last result;
- last answer;
- last attempt time;
- last error time.

After an explicit error, two consecutive correct answers are required to recover the item from the weak list.

New route: `/practice-errors`.

Practice progress is Zod-validated, versioned browser state owned by a scoped TanStack Store. It is intentionally local-only in this review slice; there is no hidden database migration.

## P1 — Speaking / shadowing

`SpeakingRecorder` uses `getUserMedia` + `MediaRecorder` for `oral_response` and `shadowing` sections.

The learner can:

- request microphone access;
- record;
- stop;
- replay;
- record again;
- discard.

Streams and Blob URLs are cleaned up. Recordings are not uploaded or persisted.

There is no STT, tone score, or AI pronunciation score in this slice because those would introduce new evaluation contracts rather than reuse reliable existing answers.

## Information architecture

- `/review` is the primary practice destination in Sidebar/mobile quick navigation.
- `/dictionary` is relabeled `Từ đã lưu`; it is not presented as the new review scheduler.
- Home `Nhịp học` surfaces due count and weak-practice count with direct actions.

## Preserved invariants

- No Supabase migration.
- No RLS/policy change.
- No auth change.
- No dependency added.
- Existing manual vocabulary/grammar status marking remains available.
- Existing content schemas/listening reads remain unchanged.
- Open-ended answers are not assigned fabricated correctness.
- Audio is not uploaded.

## Deliberate boundary before product review

Still separate:

- legacy Dictionary `user_vocab_progress` / saved-word progress;
- remote persistence for practice attempts;
- general exercise and matching attempt producers;
- FSRS-specific memory parameters;
- automated speaking/pronunciation assessment.

These require database/domain decisions and should be reviewed after the current state model and UX are accepted.

## Review paths

```text
/review
/practice-errors
/hanzihome -> a listening lesson -> oral_response or shadowing
/
```

Check desktop, tablet and mobile; especially due-deck progression, answer recovery, microphone permission denied, recording retry/discard, and navigation active state.

## Verification status

The source diff was reviewed for unsafe TypeScript escape patterns and this branch does not add dependencies, migrations, RLS, or auth changes.

`npm run check`, authenticated viewport smoke tests, and CI are **not claimed as passed** here. The available GitHub-connected environment could not execute the local repository toolchain, and the current CI workflow does not run on an un-opened feature branch. Those gates remain required before merge/release.
