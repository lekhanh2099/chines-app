# UI/UX Pro Max full audit — chines-app

Date: 2026-08-16

Audit branch: `audit/ui-ux-pro-max-full-2026-08-16`

Branch point: `799c66f66fe8db457589d2bdd83db65b86388d80`

Latest `main` observed during the audit: `dcfbbf4fcb11fe7abc6aa19b1f07e3560091857c`

The latest `main` commit only changes the Vercel build command. It landed after this audit branch was created. This report therefore does not claim that the branch is rebased onto the latest `main`.

No merge, production deployment, dependency change, DB/RLS/auth mutation or product-code remediation was performed as part of this audit.

## 1. Audit authority and method

This audit follows the repository adapter at `.agents/skills/ui-ux-pro-max/SKILL.md`, pinned to upstream `nextlevelbuilder/ui-ux-pro-max-skill@a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5`.

The authority order used was:

```text
explicit user requirement
-> AGENTS.md
-> local source / generated contracts / project docs
-> frontend-ui-system
-> ui-ux-pro-max adapter
-> generic upstream guidance
```

The audit was deliberately ordered by the local priority model:

```text
1. Accessibility
2. Touch & interaction
3. Runtime layout quality
4. Information architecture
5. Component/design-system consistency
6. Typography & color
7. Forms & feedback
8. Motion
9. Performance
10. Charts/data visualization
```

This matters because a visually cleaner layout is not a valid improvement if semantics, keyboard access, touch operation or state ownership become worse.

Local contracts inspected include:

- `AGENTS.md`
- `PRODUCT.md`
- `.agents/skills/frontend-ui-system/SKILL.md`
- `.agents/skills/ui-ux-pro-max/SKILL.md`
- `docs/ui/component-contracts.md`
- `docs/ui/ui-verification.md`
- `docs/architecture/frontend-structure.md`
- shared shell/UI primitives
- representative reader, dictation, TTS, Notes, HTML Artifact, module-tab and global-search source
- static audit scripts

External standards were used only to cross-check accessibility semantics:

- W3C ARIA Authoring Practices — Main Landmark
- W3C ARIA Authoring Practices — Tabs Pattern
- W3C ARIA Authoring Practices — Combobox Pattern
- WCAG 2.2 SC 2.5.7 — Dragging Movements
- WCAG 2.2 SC 2.5.8 — Target Size (Minimum)

## 2. Rendered verification matrix

A temporary branch-only GitHub Actions probe rendered the public learning surfaces using production build + headless Chrome/CDP. The temporary workflow and runtime script were removed again after evidence collection; they are not intended to become permanent repository tooling from this audit alone.

Evidence run used for this report:

```text
GitHub Actions run: 31944018365
Commit: 5114d4819eb9dfa0d8fa3dbad1e723a7d5e7135a
Rendered states: 46
Viewports:
  phone   390 x 844
  iPad    820 x 1180
  desktop 1440 x 900
Additional states:
  selected light/dark routes
  selected reduced-motion routes
```

Rendered public route families:

```text
/reader
/reader/course
/reader/hsk
/hsk
/daily-reading
/dictation
/humanities
/humanities/history
/humanities/poetry
/personal-learning
/translation
/tts
```

Protected routes were intentionally not rendered without an authenticated fixture. Source review still covered relevant protected components, but their findings are explicitly labelled source-only.

## 3. Executive assessment

There is no P0 finding.

The repository's design-system and source-level discipline are stronger than the average React/Next application. The main problems found are not “the app needs a new design system”. They are mismatches between the strong local contracts and several remaining interaction/semantic implementations.

Highest-impact findings:

1. Public rendered routes systematically contain nested `main` landmarks.
2. Notes implements a custom tab widget without the required tab keyboard model and also uses drag-only tab reordering.
3. Hanzi module reordering is drag-only on fine-pointer layouts without an equivalent non-drag pointer control.
4. Global Search visually manages an active listbox option while DOM focus remains in the input, but it does not expose the corresponding combobox / `aria-activedescendant` relationship.
5. Dictation hides a finite required source choice off the phone viewport through horizontal scrolling.

There are also two important engineering-process findings: current static UI guards do not catch several of these semantic classes, and protected authenticated surfaces still lack repeatable rendered audit coverage.

## 4. What is already strong

### 4.1 Local product direction is explicit

`PRODUCT.md` already defines the product as a calm, focused Chinese-learning workspace. The local UI skill further rejects generic dashboard/card-grid defaults, decorative glass/gradients, unnecessary hidden content, parallel component dialects and desktop-only interaction models on touch layouts.

That local direction is the correct authority. No replacement design system is recommended.

### 4.2 Static UI ownership is strong

`scripts/check-ui-standards.mjs` already rejects a large set of structural UI debt:

- direct Base/Radix imports outside the UI owner;
- raw feature palette utilities;
- feature-owned z-index and ring repair;
- arbitrary/large radius recipes;
- pixel font sizes;
- fit-content layout patches;
- decorative gradients;
- call-site visual repair of canonical primitives;
- native route scrolling;
- raw interactive controls;
- raw application typography;
- manual tab semantics in selected migrated workspaces.

The rendered audit did not find duplicate DOM IDs, unlabeled visible controls or nested interactive controls on the 46 public states it could execute.

### 4.3 Local control density is encoded centrally

`Button` already encodes the intended density families instead of leaving them to feature authors:

```text
touch/default : 44px minimum height
sm/lg         : 44px minimum height
toolbar       : 36px
menu          : 40px
icon          : 44 x 44px
```

This prevented a false audit conclusion: the desktop sidebar collapse control rendered 40 x 40px and was initially flagged by the temporary probe, but that is not a product defect under the local desktop/toolbar interaction model. It was removed from the final finding set.

### 4.4 Public responsive layout is generally stable

Across the rendered public matrix:

- no page-level horizontal overflow was detected;
- no duplicate IDs were detected;
- no visible unnamed interactive controls were detected;
- the mobile full-navigation Sheet opened as one modal surface;
- Settings remained reachable from the mobile full-navigation surface;
- the full-navigation landmark was present;
- no initial-load CLS sample exceeded the probe's 0.1 warning threshold;
- no initial-load long task exceeded the probe's 200ms warning threshold;
- the sampled reduced-motion states produced no settled-state animation warning.

These are useful signals, not a claim of complete WCAG or Web Vitals conformance.

### 4.5 Reader visual direction is coherent at the component level

The rendered Reader phone/desktop surfaces use a calm low-chroma canvas, consistent local icon language, stable border/radius grammar and clear typography. The visual system itself is not the primary problem in this audit.

## 5. Findings

# P1 — Systemic nested `main` landmarks

Classification: **verified source finding + verified rendered finding**

Severity: **P1**

### Evidence

`src/components/layout/AppScrollViewport.tsx` explicitly owns the application-level scroll viewport and renders:

```tsx
<main id="main-content" ...>
  {route content}
</main>
```

Multiple route pages then render another `main`. For example:

```tsx
// src/app/(app)/reader/page.tsx
<main className="hanzihome-static-page ...">
  <ReaderWorkspace ... />
</main>
```

The runtime matrix reported `mainCount = 2` and `nestedMainCount = 1` on every one of the 46 rendered public states.

W3C APG guidance for the main landmark says each page should have one main landmark and that it should be top-level.

### Why it matters

The shell already established one authoritative primary-content landmark. Nesting a second one inside it weakens document landmark semantics for screen-reader users and contradicts the local shell contract that `AppScrollViewport` is the single application-level route viewport.

This is systemic rather than a one-page typo.

### Owner

```text
src/components/layout/AppScrollViewport.tsx
+ route page composition contract
+ scripts/check-ui-standards.mjs
```

### Recommendation

Keep `AppScrollViewport` as the single route-level `main`. Route-level wrappers should be `div`, `section`, `PageContainer` or another non-main semantic owner unless there is a real nested document/application boundary.

Add a source guard so a route page cannot silently reintroduce a visible `main` underneath the shell owner.

### Verification

```text
runtime: document.querySelectorAll("main").length === 1
runtime: no main element contains another main
source guard: seeded route-level nested main fixture fails
```

---

# P1 — Notes custom tabs do not implement the tab keyboard contract

Classification: **verified source finding; protected route not rendered in this audit**

Severity: **P1**

### Evidence

`src/components/notes/NoteTabBar.tsx` builds a manual tablist:

```tsx
<div role="tablist" ...>
```

Each tab is a clickable `div`:

```tsx
<div
  role="tab"
  aria-selected={isActive}
  onClick={onActivate}
  ...
>
```

The tab itself has no `tabIndex`, no roving-focus model and no Left/Right/Home/End keyboard handling. The close `Button` is also placed inside the same `role="tab"` subtree.

W3C APG Tabs expects focus to enter the active tab and Left/Right to move among horizontal tabs; manual activation also requires Space/Enter. Optional Home/End and Delete semantics are defined for the pattern.

### Why it matters

The visual tab state exists, but the ARIA widget contract is incomplete. A keyboard user can encounter the close button without having a coherent keyboard route through the tabs themselves. The role says “tab” while the interaction model behaves like a pointer-only custom surface.

The nested close action also makes the tab's interaction anatomy harder to reason about than the existing canonical Tabs contract.

### Owner

```text
src/components/notes/NoteTabBar.tsx
src/components/ui/tabs.tsx
docs/ui/component-contracts.md
```

### Recommendation

Use the canonical Tabs owner if its contract can express closable tabs. If it cannot, extend the local semantic owner rather than preserving a one-off manual ARIA implementation.

A durable closable-tab pattern must explicitly own:

```text
roving focus
Left / Right keyboard movement
activation model
focus after close
close-button semantics
overflow behavior
```

### Verification

On authenticated `/notes` desktop/tablet:

```text
Tab enters the active tab
Left/Right traverses tabs
Space/Enter activates according to chosen activation model
closing active tab moves focus predictably
close action remains separately named
focus-visible remains visible
```

---

# P1 — Drag-only reordering has no equivalent non-drag pointer operation

Classification: **verified source finding**

Severity: **P1**

### Evidence — Notes

`NoteTabBar.tsx` exposes tab reordering through HTML drag events and calls `reorderTabs(dragIndex, index)`. No click/tap move-left, move-right or move-to-position command exists in this component.

### Evidence — Hanzi module panes

`src/features/hanzihome/components/layout/ModuleTabButton.tsx` makes module buttons draggable for fine pointers and performs `onMoveModule(...)` in `onDrop`.

`ModulePane.tsx` replaces the draggable row with a Select for coarse pointers, but that Select changes the active module; it does not expose module reordering. No equivalent single-pointer reorder control is present in the pane source.

WCAG 2.2 SC 2.5.7 requires functionality implemented through dragging to also be achievable with a single pointer without dragging unless dragging is essential.

### Why it matters

Reordering is user functionality, not merely a decorative animation. Users who cannot accurately hold-and-drag need a click/tap alternative. Keyboard equivalence alone would not satisfy SC 2.5.7 unless the same alternative is also operable by a single pointer.

### Owner

```text
src/components/notes/NoteTabBar.tsx
src/features/hanzihome/components/layout/ModuleTabButton.tsx
src/features/hanzihome/components/layout/ModulePane.tsx
```

### Recommendation

Keep drag as an enhancement, but add an explicit reorder command such as:

```text
Move left
Move right
Move to other pane
Move to position…
```

Expose it through a touch/keyboard reachable action menu or direct controls. Reuse one reorder contract for pointer, touch and keyboard rather than creating three state flows.

### Verification

Without performing any drag gesture, a user must be able to complete every reorder operation using ordinary click/tap controls. Keyboard access should operate the same underlying reorder command.

---

# P1 — Global Search's visual active option is not exposed as a complete combobox/listbox relationship

Classification: **verified source finding + partial rendered interaction finding**

Severity: **P1**

### Evidence

`GlobalSearchDialog.tsx` keeps DOM focus in the search `Input` while ArrowUp/ArrowDown updates a React `selectedIndex`.

The result region has:

```tsx
role="listbox"
```

and each `SearchResultItem` is a Button rewritten as:

```tsx
role="option"
aria-selected={selected}
```

However the input does not expose the combobox/listbox relationship through `role="combobox"`, `aria-controls` and `aria-activedescendant`. A repository search found no `aria-activedescendant` implementation.

The direct Chinese lookup `Button` is also inserted inside the listbox but is not an option.

W3C APG Combobox specifically describes the pattern where DOM focus remains on the combobox while a listbox item is visually active: `aria-activedescendant` identifies that active item.

Rendered evidence confirms Ctrl+K exposed one dialog and one visible input. The audit did not treat the initial Escape timing observation as a product bug because the first probe checked too soon relative to Dialog close animation.

### Why it matters

Sighted keyboard users see selection move, but assistive technology does not receive an equivalent active-option relationship. The listbox also contains an action that does not follow the listbox option model.

### Owner

```text
src/features/hanzihome/search/GlobalSearchDialog.tsx
src/features/hanzihome/search/SearchResultItem.tsx
src/components/ui/dialog.tsx
```

### Recommendation

Choose one explicit semantic model and implement it completely:

```text
Input/combobox owns DOM focus
-> listbox has stable id
-> each option has stable id
-> input exposes aria-controls
-> input exposes aria-activedescendant for selected option
-> active option exposes aria-selected
```

The direct dictionary lookup should either become a real option in the same navigation model or live outside the listbox as a separate command.

### Verification

Use keyboard + a screen reader on Ctrl+K:

```text
ArrowUp/Down announces the newly active result
Enter opens exactly the announced result
empty/loading/error state remains announced/readable
Escape returns focus to the trigger
```

---

# P2 — Dictation hides a finite required source choice off-screen on phone

Classification: **verified rendered finding + verified source finding**

Severity: **P2**

### Evidence

On `/dictation` at 390 x 844, the source choice row displays:

```text
Bài học / bài đọc HSK
Từ thư viện giọng đọc
Dán nội dung
```

The third choice, `Dán nội dung`, is positioned beyond the visible viewport. Runtime evidence identified the same button as out-of-bounds in both light and dark phone states.

The page did not create document-level horizontal overflow because the shared `SegmentedControl` owns `overflow-x-auto`. That avoids page breakage, but it still requires sideways discovery for a small finite required choice set.

The local UI contract explicitly says finite required choices should wrap/grid instead of relying on sideways discovery.

### Why it matters

This is not a harmless overflow detail. The hidden option changes how the user supplies content to the exercise. A user can reasonably conclude that only the first two modes exist.

### Owner

```text
src/features/hanzihome/practice/StudioDictationWorkspace.tsx
src/components/ui/segmented-control.tsx
```

### Recommendation

Do not globally remove overflow behavior from `SegmentedControl`; that owner may legitimately support large option sets.

For this finite three-choice usage, use one of:

```text
responsive labels + wrapping
small grid of touch-sized choices
one touch modal/Sheet for source mode if labels cannot remain readable
```

Keep the same authoritative `sourceType` state.

### Verification

At 390 x 844 and 320-ish narrow widths, all three source modes must be visibly discoverable without a horizontal gesture and without shrinking labels below the reading contract.

---

# P2 — TTS segment-number controls violate the stronger local standalone touch target contract

Classification: **verified rendered finding + verified source finding**

Severity: **P2**

### Evidence

`TtsStudioWorkspace.tsx` renders segment selectors as number-only `Button size="sm"` controls.

The rendered audit measured buttons `1`, `2`, `3` at approximately:

```text
31 x 44px
```

on phone, iPad and desktop.

The local UI/UX adapter requires 44px minimum for standalone/touch targets. `Button` already has an explicit square `icon` family that owns 44 x 44px geometry.

### Standards distinction

This is a violation of the repository's stronger product/touch contract, but it should **not** be mislabeled as a WCAG 2.2 SC 2.5.8 failure merely from 31 x 44px geometry. WCAG 2.2 AA Target Size (Minimum) uses a 24 x 24 CSS-pixel baseline with defined exceptions.

### Why it matters

The number buttons are dense repeated targets where horizontal precision matters. The local 44px target rule exists specifically to make touch study interactions less error-prone.

### Owner

```text
src/features/hanzihome/tts/TtsStudioWorkspace.tsx
src/components/ui/button.tsx
```

### Recommendation

Use a semantic square target size already owned by Button or introduce a typed segment-number size on the correct shared owner if this pattern repeats. Do not patch width with feature-local arbitrary pixels.

### Verification

Rendered segment selectors have at least a 44 x 44px interactive hit box on phone/iPad while retaining the same visual density and wrapping behavior.

---

# P2 — Static UI guard has semantic blind spots that allowed P1 issues to pass

Classification: **verified source/process finding**

Severity: **P2**

### Evidence

`npm run ui:check` passed with no baseline during the audit, even though the source contains the issues above.

The current checker only requires canonical Tabs for these directories:

```text
src/features/hanzihome/reader/
src/features/hanzihome/practice/
src/features/hanzihome/tts/
src/features/hanzihome/humanities/
```

Therefore manual tab roles in `src/components/notes/NoteTabBar.tsx` and HTML Artifact UI are outside that rule.

The checker also has no route-level nested-main rule.

Its thick-border matcher targets generic `border-2...border-9`; directional recipes such as `border-l-2` are not covered by that exact pattern. `NoteTabBar` contains `border-l-2` for a drop target.

### Why it matters

The project has invested heavily in making contracts machine-enforceable. High-impact semantic gaps that bypass the checker undermine that benefit and force the same audit to be rediscovered manually.

### Owner

```text
scripts/check-ui-standards.mjs
scripts/check-ui-standards.test.mjs
docs/ui/component-contracts.md
```

### Recommendation

Extend the checker narrowly rather than adding broad fragile regex rules:

1. Ban manual `role="tab"` / `role="tablist"` outside the canonical Tabs owner or a documented adapter, repo-wide.
2. Detect nested/duplicate route-level `main` ownership.
3. Cover directional thick-border recipes if the product contract intends to forbid them.
4. Add deterministic fixtures for each new invariant.

### Verification

Seeded source fixtures for Notes-style manual tabs and route-level nested main must fail while canonical Tabs and the shell `AppScrollViewport` remain green.

---

# P2 — Public learning surfaces expose interactions backed by authenticated-only APIs

Classification: **verified source finding + rendered runtime dependency; intended product behavior is not fully specified**

Severity: **P2 contract gap**

### Evidence

Middleware intentionally treats these learning routes as public static surfaces, including `/dictation`, `/reader`, `/daily-reading`, `/humanities`, `/translation` and `/tts`.

`/api/tts`, however, requires an authenticated user for both GET and POST.

During unauthenticated `/dictation` rendering, the runtime audit observed `401` responses from `/api/tts` while the page was loading its TTS interaction support.

The public `/reader` shell also produced a `401` from the authenticated search-index endpoint when global search was opened.

### Why it matters

There are two valid product models, but the UI must choose one explicitly:

```text
A. public content + authenticated premium/personal interactions
B. public content + public reader/TTS/search interactions
```

If A is intended, unauthenticated users need an observable sign-in boundary instead of a background 401 that looks like a broken control. If B is intended, the API boundary conflicts with the product intent.

The current evidence is not enough to choose A or B on behalf of the product.

### Owner

```text
src/lib/supabase/middleware.ts
src/app/api/tts/route.ts
public reader/dictation/search UI contracts
```

### Recommendation

First document the anonymous-user contract. Then make the UI/API boundary consistent with that decision. Do not weaken API authentication merely to remove the console/network error.

### Verification

Render the public route as a signed-out user and execute the interaction. The result must be either a working public action or an intentional, accessible sign-in affordance — never an unexplained failed request.

---

# P2 — Authenticated critical surfaces do not yet have repeatable rendered audit coverage

Classification: **verified verification gap, not a visual-bug claim**

Severity: **P2**

### Evidence

The runtime probe intentionally skipped protected routes because it had no authenticated fixture. Examples include:

```text
/
/hanzihome
/conversation
/data-quality
/dictionary
/grammar
/html-artifacts
/inspector
/learning-loop
/memory-tips
/notebook
/notes
/radicals
/settings
/vocab
/api-docs
```

This matters because several of the source-only P1 findings live on protected surfaces, especially Notes.

### Why it matters

A successful build or static checker cannot prove focus trapping, actual overlay collision, rendered focus-visible, responsive editor layout, authenticated empty/error states or true touch reachability.

The repository verification contract already says visual claims require rendering.

### Owner

```text
docs/ui/ui-verification.md
CI/test fixture architecture
```

### Recommendation

Create a reusable isolated authenticated UI fixture for browser audit. It should not use real production user data and should not require weakening middleware/auth contracts.

Start with the highest-value protected flows rather than rendering every dynamic route on every commit:

```text
Home
Notes
Settings
HanziHome lesson workspace
HTML Artifacts
Dictionary / SRS
Memory Tips
```

### Verification

The critical authenticated matrix produces screenshots + structured DOM/a11y evidence in CI and can reproduce a deliberately seeded regression.

---

# P3 — Reader landing still leans toward a launcher-card grid rather than a study workspace

Classification: **verified rendered product/IA observation; not a standards failure**

Severity: **P3**

### Evidence

The desktop `/reader` first view is dominated by a three-column grid of large route/action cards such as Daily Reading, course reading, HSK reading, lookup, PDF practice, independent reading and TTS.

The mobile view becomes a long vertical stack of the same large launch cards, so the first viewport is largely route-discovery UI rather than current learning continuation/content.

This does not violate accessibility, and the visual tokens themselves are coherent. The issue is product hierarchy: the local skill explicitly rejects dashboard/card grids as the default learning information architecture and prioritizes current learning content/current position before support/navigation.

### Why it matters

The Sidebar/bottom navigation already owns global discovery. A launcher-heavy Reader surface can make the product feel like a navigation dashboard rather than a focused study workspace and spends substantial first-viewport area on destinations rather than continuation.

### Owner

```text
Reader landing information architecture
PRODUCT.md
.agents/skills/frontend-ui-system/SKILL.md
```

### Recommendation

Do not blindly delete cards. Re-evaluate which items are true primary study continuation versus secondary destinations.

A stronger hierarchy would normally be:

```text
continue/current reading context
-> current/high-value next study action
-> compact secondary library/tools discovery
```

This should be treated as a product/IA refactor and validated against real study flow, not as a CSS cleanup.

### Verification

On phone and desktop, the first viewport should make the learner's current/next reading action obvious without requiring the learner to scan a sitemap-like card set. Global destinations must remain discoverable through the shell.

## 6. Source-only protected-surface risk: HTML Artifacts manual tab semantics

`src/features/hanzihome/html-artifacts/HanziHomeHtmlArtifactsPage.tsx` still contains manual `role="tab"` semantics according to source search, while `docs/ui/component-contracts.md` says content tabs should use the local Tabs owner.

This is not promoted to a separate rendered P1 because `/html-artifacts` was not authenticated/rendered in this audit. It should be reviewed together with the repo-wide manual-tabs guard remediation.

Also verify that commands such as connection/publish actions are represented as commands rather than tab semantics when remediation begins.

## 7. False positives and observations explicitly ruled out

### Sidebar collapse target

The temporary runtime probe initially flagged `Thu gọn thanh điều hướng` at 40 x 40px because it treated `icon-sm` as a standalone 44px target.

This was rejected as a product finding. The control is desktop shell chrome and fits the local toolbar-like density model, whose minimum is 36px. Auditing the semantic owner before judging the consumer prevented a false positive.

### Ctrl+K Escape timing

The first probe observed one dialog still visible 100ms after Escape. The local Dialog has close animation/state behavior, so a 100ms snapshot is insufficient evidence of a broken dismissal contract.

This audit does **not** claim that Escape is broken. A future browser test should wait for the dialog's closed state rather than an arbitrary short delay and should verify focus return.

### CI Chinese tofu glyphs

Some headless Linux screenshots rendered Chinese content as missing-glyph boxes. This is not reported as an app typography bug because the runner font environment is not representative enough to establish that conclusion.

### Raw audit failure count

The temporary runtime script reported 65 raw hard failures. That number must not be interpreted as “65 product bugs”. Most were the same systemic nested-main issue repeated across route/viewports plus a false-positive desktop target rule.

This report collapses repeated observations into root causes.

## 8. Typography, color, motion, performance and charts

### Typography and color

Source-level token ownership is strong and the rendered public screenshots visually preserve clear hierarchy in both sampled light/dark states.

This audit did **not** complete a trustworthy computed-contrast matrix for every palette/state combination. Therefore it does not claim WCAG contrast conformance. The existing WCAG AA target remains a required future authenticated/theme verification item.

### Motion

No settled-state reduced-motion warning was produced on the sampled public routes. That does not prove every Dialog/Menu/transition interaction respects reduced motion. No motion defect is promoted without interaction evidence.

### Performance

The initial-load browser samples produced no CLS warning above 0.1 and no long-task warning above 200ms in the sampled public matrix.

This is only a probe signal. It is not a Core Web Vitals certification and does not cover authenticated data-heavy flows.

### Charts/data visualization

No need was found to introduce additional charts into the audited learning surfaces. Adding charts merely to make the app appear more complete would conflict with the product direction.

## 9. Repository checks actually executed

From GitHub Actions audit run `31944018365`:

```text
npm ci
  -> 890 packages installed
  -> npm reported 0 vulnerabilities

npm run lint
  -> 0 warnings, 0 errors

npm run source:check
  -> passed

npm run route:check
  -> passed
  -> 131 App Router endpoints
  -> 99 static navigation targets

npm run ui:check
  -> passed with no baseline

npm run api:check
  -> passed

npm run typecheck
  -> passed

npm run test:run
  -> 98 test files passed
  -> 417 tests passed

npm run format:check
  -> failed only because the temporary branch-only audit workflow itself was not formatted yet

fallback npm run build
  -> passed
  -> Next.js production build compiled and generated routes successfully
```

A later branch-only run was started after pre-formatting temporary audit tooling, but it was cancelled by subsequent cleanup pushes/concurrency while the repository gate was still running. It is therefore not used as pass evidence.

The final branch removes the temporary workflow/script and restores `package.json` to its original audit-independent script set. No claim is made that the final branch received a fresh full `npm run check` after that cleanup; product code was not modified by the audit.

## 10. Remediation order

Do not start by redesigning surfaces. Fix the accessibility contract first.

Recommended order:

```text
1. Remove nested route-level main landmarks + add guard.
2. Replace/extend Notes custom tab semantics with canonical keyboard-complete Tabs.
3. Add non-drag pointer reorder actions for Notes + module panes.
4. Repair Global Search combobox/listbox active-descendant semantics.
5. Fix Dictation finite-choice phone discovery.
6. Fix TTS number-button local touch geometry.
7. Extend static UI guards for manual tabs/nested main.
8. Resolve signed-out public-interaction contract for TTS/search.
9. Add authenticated critical-route browser fixture.
10. Revisit Reader landing IA only after higher-priority interaction invariants are green.
```

## 11. Completion / residual risk

### Verified

- source architecture and local UI contracts were inspected;
- 46 public route/viewport/theme states were rendered;
- phone/iPad/desktop screenshots were captured by CI;
- public DOM invariants were sampled;
- mobile full-navigation interaction was exercised;
- Ctrl+K opening was exercised;
- critical source-only protected components were reviewed;
- W3C/WCAG semantics were cross-checked for the accessibility findings.

### Not verified

- authenticated browser states on protected routes;
- screen-reader announcement behavior;
- every focus-return path;
- every overlay collision state;
- complete theme/palette computed-contrast matrix;
- full interaction-time reduced-motion behavior;
- production Web Vitals / real network performance;
- visual state after real user data loads.

These limitations are deliberate audit boundaries, not assumed passes.
