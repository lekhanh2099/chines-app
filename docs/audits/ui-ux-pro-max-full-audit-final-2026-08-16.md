# UI/UX Pro Max full audit — final closure

Date: 2026-08-16

Repository: `lekhanh2099/chines-app`

Audit branch: `audit/ui-ux-pro-max-full-2026-08-16`

Final product-code remediation SHA: `4a78e449a2186ea8decda9dfdcc3a07239af80d4`

Final full verification SHA: `4760901bcad2eb800b29760a371972b320412b5a`

GitHub Actions verification run: `31960054374`

This document closes the remediation cycle started by `ui-ux-pro-max-full-audit-2026-08-16.md`. The earlier report remains the detailed baseline and evidence inventory; this file records which findings were actually remediated, what was rendered again, and what remains intentionally unclaimed.

## 1. Authority and scope

The audit used the repository authority order required by the local adapter:

1. explicit user requirement;
2. `AGENTS.md` and nearest repository contracts;
3. current source and generated contracts;
4. `.agents/skills/frontend-ui-system/SKILL.md`;
5. `.agents/skills/ui-ux-pro-max/SKILL.md`;
6. generic upstream guidance.

The audit priority remained accessibility, touch/interaction, runtime layout, information architecture, component consistency, typography/color, forms/feedback, motion, then runtime performance.

No product-wide replacement design system was introduced. Existing local primitives, density rules, scroll ownership, typography owners, semantic tokens and responsive contracts remain authoritative.

The branch-specific Vercel rule supplied by the user was preserved exactly during this UI work:

```json
"deploymentEnabled": {
  "**": false,
  "main": true
}
```

## 2. Full repository verification

At SHA `4760901bcad2eb800b29760a371972b320412b5a`, `npm run check` completed successfully before the browser audit.

The successful gate included:

- lint with zero warnings/errors;
- source architecture/type-safety/module reachability;
- route integrity: 131 App Router endpoints and 99 static navigation targets;
- UI-system guard with no baseline exemptions;
- API registry coverage;
- Next route type generation and TypeScript checking;
- Vitest: 98 test files, 419 tests passed;
- formatting check;
- production dependency audit;
- production Next.js build.

The UI standards regression suite now contains 26 tests, including coverage for the new nested-main and manual-tab guard classes.

## 3. Final rendered verification

The final browser audit rendered 53 public states using the production build and headless Chrome.

Viewports:

- phone: 390 × 844;
- iPad portrait: 820 × 1180;
- desktop: 1440 × 900.

Route families rendered:

- `/reader`;
- `/reader/course`;
- `/reader/hsk`;
- `/reader/mock`;
- `/reader/practice`;
- `/hsk`;
- `/daily-reading`;
- `/dictation`;
- `/humanities`;
- `/humanities/history`;
- `/humanities/poetry`;
- `/personal-learning`;
- `/translation`;
- `/tts`.

Selected routes were also rendered in dark mode and with `prefers-reduced-motion: reduce`.

Final hard failures: **0**.

Across the 53 rendered states the audit found:

- 0 invalid main-landmark states;
- 0 nested `main` landmarks;
- 0 page-level horizontal overflow states;
- 0 duplicate DOM IDs;
- 0 visible unnamed interactive controls;
- 0 nested interactive controls detected by the runtime probe;
- 0 local Button/Chip density violations under the resolved fine/coarse-pointer contracts;
- 0 simple rendered foreground/background contrast candidates below the WCAG AA thresholds used by the probe;
- 0 CLS samples above 0.1;
- 0 reduced-motion states with settled-state running-animation warnings;
- 0 visible elements crossing the viewport boundary in the audited states.

These results are evidence for the audited states only. They are not a claim of complete WCAG conformance or complete Web Vitals certification.

## 4. Baseline findings closed

### Closed — systemic nested `main`

`AppScrollViewport` remains the single application-level `main`. Route and HanziHome composition wrappers no longer create nested main landmarks. The source guard now rejects this class of regression. Final runtime evidence reports exactly one main landmark and zero nested mains across all 53 public states.

### Closed — Notes tab semantics and non-drag operation

`NoteTabBar` now uses the canonical Tabs owner rather than a hand-built tab widget. Close/reorder actions no longer live inside the tab interaction subtree. The active-tab menu provides non-drag move-left/move-right operations and close actions.

This protected surface was source-verified and exercised by repository tests/guards, but was not browser-rendered without an authenticated fixture.

### Closed — module reordering had no non-drag pointer alternative

`ModulePane` keeps drag where appropriate and adds explicit move-left, move-right and move-to-other-pane operations. Coarse-pointer layouts retain touch-appropriate selection and now also expose non-drag reordering.

### Closed — Global Search combobox relationship

Global Search now exposes the input as a combobox with a controlled listbox, stable option IDs and `aria-activedescendant` when an option exists. The direct dictionary lookup action is outside the listbox instead of pretending to be an option.

The final browser audit verifies that Ctrl+K opens the dialog, the combobox exists, `aria-controls` resolves, focus remains on the combobox during Arrow navigation, and Escape closes the dialog. Signed-out audit data returns 401 for the protected search index, so the final run had zero result options and therefore could not render-verify selection movement between actual options. That remaining point is explicitly not claimed as rendered evidence.

### Closed — Dictation hid a required source choice on phone

The finite source selector now uses touch density and wrapping rather than requiring sideways discovery. Final 390 × 844 evidence verifies all three required choices are simultaneously within the viewport:

- `Bài học / bài đọc HSK`: 182 × 44;
- `Từ thư viện`: 183 × 44;
- `Dán nội dung`: 121 × 44.

The group no longer requires horizontal scrolling.

### Closed — TTS numbered sample target source contract

Numbered TTS sample controls now use the 44 × 44 icon target owner and have explicit accessible names. The selector is conditional and was not present in the initial signed-out `/tts` state, so this is source/test evidence rather than a rendered target measurement.

### Closed — static UI guard blind spots

The UI checker now rejects route/feature main landmarks beneath the shell owner, applies manual-tab detection beyond the earlier small migrated-directory list, and catches directional thick-border escape hatches such as `border-l-2`. Regression tests were added.

### Closed — editor used parallel dropdown/dialog interaction grammar

The editor toolbar now uses repository DropdownMenu, Dialog, Card, Button and Separator owners instead of feature-built dropdown/dialog visual behavior. The root is exposed as a labelled group rather than falsely claiming an ARIA toolbar keyboard model that the component did not implement.

### Closed — editor block reordering was drag-only

The draggable block UI retains a drag handle on fine-pointer layouts but now also exposes explicit move-up and move-down controls. Block insertion uses the canonical dropdown menu. This closes the non-drag pointer alternative gap without removing productive desktop drag behavior.

### Closed — progressive study reveal created nested pseudo-interactions

The progressive-reveal wrapper no longer pretends to be a custom button while containing interactive annotation controls. Reveal advancement has an explicit Button owner, and annotation actions use the canonical inline Button.

### Closed — compact Button/Chip coarse-pointer density

Compact buttons and small/medium/large chips preserve their denser fine-pointer geometry but expand to the local 44 × 44 minimum on coarse pointers. The final runtime probe resolves target thresholds against the actual local owner contract instead of treating every density as 44 px on desktop.

## 5. Final interaction checks

Mobile full navigation on `/reader`:

- trigger found;
- exactly one visible dialog surface;
- Settings reachable;
- exactly one full-navigation landmark.

Global Search on desktop `/reader`:

- Ctrl+K dialog opens;
- combobox semantics present;
- controlled listbox exists;
- focus stays on the combobox during ArrowDown;
- Escape closes the dialog.

Dictation phone selector:

- all required source choices found;
- all meet 44 px touch height;
- all intersect the viewport;
- no horizontal scroll required.

## 6. Warnings that were not promoted to verified UI defects

### Public/auth contract ambiguity

The final signed-out runtime still receives 401 responses from `/api/tts` while `/dictation` itself is public, and `/api/hanzihome/search-index` returns 401 when the public Reader search dialog opens.

This is a real contract inconsistency in the signed-out flow, but changing it requires a product/auth decision: either the public shell intentionally exposes interactions that require sign-in, or those APIs should have a public-safe path. The UI audit does not silently weaken authentication to make the warning disappear.

### Protected browser coverage

The following routes were not rendered without an authenticated fixture:

`/`, `/hanzihome`, `/conversation`, `/data-quality`, `/dictionary`, `/grammar`, `/html-artifacts`, `/inspector`, `/learning-loop`, `/memory-tips`, `/notebook`, `/notes`, `/radicals`, `/settings`, `/vocab`, `/api-docs`.

Their affected source was audited and the repository/test/UI gates passed, but no claim is made that their authenticated visual states were browser-verified. A real authenticated audit fixture is required to close this coverage gap without bypassing production auth behavior.

### Runtime long-task samples

The final CI sample observed three isolated long-task warnings:

- `/reader` desktop: 204 ms;
- `/reader/mock` desktop: 214 ms;
- `/translation` phone: 963 ms.

Previous runs produced materially different routes/durations, so the current evidence is too noisy to label a deterministic performance regression. No UI code was changed merely to optimize a single CI sample. Repeated profiling on a stable runtime is required before assigning a product-performance finding.

### Linux CI Chinese glyph rendering

Headless Linux screenshots can show tofu/missing Chinese glyph boxes where the runner does not reproduce the user's installed font environment. This was not treated as proof of an application font defect without browser/font evidence from the supported user environment.

## 7. Information architecture finding intentionally deferred

The Reader landing surface is visually coherent and responsive, but it still behaves primarily as a card launcher. That remains a P3 information-architecture observation against the product preference for a focused study workspace rather than a dashboard/card-grid default.

It was not auto-redesigned in this remediation pass because replacing the landing information architecture changes product prioritization, not just implementation correctness. The accessibility, responsive and interaction defects were fixed first. A future Reader-home redesign should start from the intended primary study action/current-learning state rather than from a generic card-grid restyle.

## 8. Final status

There is no P0 finding.

No verified P1 or P2 UI implementation defect from the baseline remains open in the public rendered/source-verified remediation scope.

The remaining items are deliberately classified rather than hidden:

- authenticated rendered coverage gap;
- public/auth interaction contract decision;
- non-reproducible CI performance warnings;
- P3 Reader landing information-architecture decision.

The audit branch remains separate from `main`; nothing in this closure implies a merge or production deployment.
