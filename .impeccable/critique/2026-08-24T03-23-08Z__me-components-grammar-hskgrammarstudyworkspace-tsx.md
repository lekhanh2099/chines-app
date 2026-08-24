---
target: HSK Grammar study workspace
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T03-23-08Z
slug: me-components-grammar-hskgrammarstudyworkspace-tsx
---

## Design Health Score

| #         | Heuristic                       |     Score | Key issue                                                                                |
| --------- | ------------------------------- | --------: | ---------------------------------------------------------------------------------------- |
| 1         | Visibility of system status     |         3 | Current point is clear, but a deep-scroll change can hide the new title.                 |
| 2         | Match system / real world       |         4 | The learning structure and Vietnamese labels fit the HSK study task.                     |
| 3         | User control and freedom        |         2 | Selecting a new point can preserve the old content-pane scroll position.                 |
| 4         | Consistency and standards       |         4 | It reuses the app Header, Sidebar, Sheet, and learner UI vocabulary.                     |
| 5         | Error prevention                |         2 | No guard against landing halfway through a newly selected grammar point.                 |
| 6         | Recognition rather than recall  |         3 | Context is visible, but long HSK lists require visual scanning.                          |
| 7         | Flexibility and efficiency      |         2 | HSK4-level navigation has no quick-find or grouping.                                     |
| 8         | Aesthetic and minimalist design |         3 | Repeated metadata and nested panels make long lessons feel segmented.                    |
| 9         | Error recovery                  |         2 | The interface has no explicit recovery from a disorienting selection/scroll state.       |
| 10        | Help and documentation          |         1 | A first-time learner is not told which of Header or sidebar is the primary jump control. |
| **Total** |                                 | **26/40** | **Serviceable, with navigation and flow issues**                                         |

## Anti-Patterns Verdict

**LLM assessment: pass.** The surface does not look generically AI-generated: it uses HanziHome's established shell, Header context, app navigation, study typography, and restrained colour system. The remaining risk is mild panel repetition rather than decorative UI slop.

**Deterministic scan: clean.** The detector scanned `HskGrammarStudyWorkspace.tsx`, `HskGrammarHeaderContextBridge.tsx`, `StructuredGrammarContent.tsx`, `GrammarWorkspace.tsx`, and `Sidebar.tsx`, returning `[]` (0 findings). No false positives were identified.

**Visual overlays: unavailable.** The in-app browser supports read-only evaluation, so mutable script injection could not be preflighted. No overlay was presented or claimed.

## Overall Impression

The study workspace is structurally correct: it belongs in the existing app shell, keeps navigation and lesson content independently scrollable, and places TTS beside the learning examples. The main opportunity is to make switching among grammar points predictable and fast, especially for large HSK levels.

## What's Working

- The Header context is implemented through `headerToolbarStore` and `AppHeaderBreadcrumb`, instead of copying a breadcrumb into the feature content.
- `LessonModuleFrame` provides the correct desktop split workspace and a mobile Sheet navigation pattern; browser evidence confirms independent scrolling at desktop and tablet.
- Each of the eight current Chinese example sentences has an enabled, sentence-specific TTS action with an accessible label.

## Priority Issues

### P1 - Selecting a grammar point can leave the learner midway through the next lesson

**Why it matters:** Both Header and sidebar navigate with `scroll: false`, while the study text lives in its own scroll container. A learner who switches after scrolling deep into a point may see the middle of the new point and lose context.

**Fix:** Reset only the study content pane to its top when the selected point changes. Do not reset the application scroll viewport.

**Suggested command:** `$impeccable polish`

### P1 - Repeated TTS action is smaller than a comfortable touch target

**Why it matters:** Listening is a high-frequency learning action. The current 36x36 px icon target is below the workspace's preferred 44 px touch target.

**Fix:** Preserve the compact glyph but use a 44 px hit area for coarse pointers.

**Suggested command:** `$impeccable audit`

### P2 - Context repeats without improving orientation

**Why it matters:** The HSK level and item count appear in Header, navigation, and article badges. Repetition adds visual work without offering new learning context.

**Fix:** Keep Header for current location and quick jump, sidebar/Sheet for browsing, and retain only article metadata that adds learning value.

**Suggested command:** `$impeccable distill`

### P2 - Navigation is too slow for long HSK levels

**Why it matters:** HSK4 has 161 points. A flat list forces learners to scan and remember labels, reducing the usefulness of an otherwise solid library.

**Fix:** Add a quick-find or semantic grouping inside the existing sidebar/Sheet navigation surface; do not add a competing navigation system.

**Suggested command:** `$impeccable polish`

### P2 - Long lessons accumulate too many bordered panels

**Why it matters:** Continuous explanation becomes visually fragmented when callouts, formula panels, formula boxes, and detail cards all compete as separate surfaces.

**Fix:** Reserve cards for interactive or discrete units; use spacing and separators for continuous explanation.

**Suggested command:** `$impeccable layout`

## Persona Red Flags

**Learner:** After choosing a different point, they may land in the middle of the new content and miss the title or core formula.

**Power learner:** At higher levels, they must scan up to 161 labels without a quick lookup path.

**First-timer:** Header Select and sidebar both change the point, but the interface does not establish which is the primary browse versus jump interaction.

## Minor Observations

- Current data renders its examples through `examplesParsed`; TTS coverage must remain intact if a future data shape introduces a separate `examples` section.
- Audio playback itself was not triggered, so output/playback remains unverified even though all eight controls are visible and enabled.

## Questions to Consider

- Should a point change always begin at the new title, or should it preserve the learner's old scroll position?
- For a 161-item HSK level, are learners primarily searching by grammar-point name, topic, or learning progress?
- Can Header be the fast jump control while the sidebar/Sheet becomes the single browse control?
