# UI/UX Pro Max audit — chines-app

Date: 2026-08-16

Scope: source/contracts/CI audit of `main`, using the priority model from
`nextlevelbuilder/ui-ux-pro-max-skill` pinned at
`a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5`, then resolving every recommendation
against the local `PRODUCT.md`, `AGENTS.md`, `frontend-ui-system`, component contracts
and UI verification contract.

This is not a rendered browser audit. No visual bug is claimed solely from JSX/CSS
inspection.

## Executive assessment

The repository already has a stronger project-specific UI contract than the generic
upstream skill. The right integration is therefore additive: keep
`frontend-ui-system` authoritative and use `ui-ux-pro-max` as a secondary audit lens.

The largest remaining gap is not missing design rules. It is continuous runtime
evidence. The repository has strong static guards and a detailed manual verification
matrix, but the current CI path does not keep a rendered responsive/accessibility
matrix as a persistent gate.

## What is already strong

### Local product direction is explicit

`PRODUCT.md` defines the intended HanziHome experience: calm/focused study, current
learning content first, progressive disclosure, color for state/feedback rather than
decoration, keyboard flow and responsive reading layouts. It also explicitly rejects
decorative glass, oversized empty surfaces, nested-card hierarchy and hidden or
non-standard controls.

This is more useful for implementation decisions than a generic generated design
system and must remain authoritative.

### Component ownership is explicit

`docs/ui/component-contracts.md` maps product needs to canonical local components and
separates primitive, pattern, feature and shell ownership. It also defines density,
geometry and `className` ownership instead of allowing call-site visual repair.

### Static UI enforcement is unusually strong

`scripts/check-ui-standards.mjs` already rejects many failure modes that generic UI
skills only describe as advice, including:

- direct Base/Radix primitive imports outside the UI owner boundary;
- raw feature palette utilities and visual escape hatches;
- arbitrary z-index, fit-content layout patches and pixel font sizes;
- decorative gradients and feature-owned ring/radius/border recipes;
- child-margin/`space-x`/`space-y` composition debt;
- visual overrides on canonical primitives;
- raw interactive controls and raw application typography;
- native `scrollIntoView`, `window.scrollTo` and document-element route scrolling;
- page-root max-width constraints and manual tab semantics in migrated workspaces.

That guard should remain the first source-level UI gate.

### Shared interaction density is encoded in primitives

`src/components/ui/button.tsx` currently encodes the local density contract rather than
leaving it to feature authors:

- default/touch and `sm`: minimum 44px height;
- toolbar: minimum 36px;
- menu: minimum 40px;
- icon default: 44px.

This matters because a source search can make a `size="sm"` button look suspicious,
but the actual owner proves that `sm` is touch-safe. Audit the owner before declaring a
consumer wrong.

### Scroll ownership is being followed in current source

For example, `LessonTextInlineEditor.tsx` uses `scrollAppContentToElement` rather than
native route scrolling. This matches the `AppScrollViewport` contract.

## Findings

### P1 — Rendered UI verification is not a persistent CI gate

Status: verified source/process finding.

Evidence:

- `.github/workflows/ci.yml` currently runs `npm run check`.
- `package.json` includes static/source/type/test/build gates, but no persistent rendered
  responsive browser audit in `check`.
- `scripts/check-ui-standards.mjs` is source analysis, not browser rendering.
- A recent temporary workflow (`temp-route-audit.yml`) did render a route/viewport/theme
  matrix, capture screenshots and inspect runtime DOM conditions, but that temporary
  workflow was subsequently removed.
- `docs/ui/ui-verification.md` itself says a successful build is not proof of responsive
  or keyboard correctness.

Why it matters:

Static contracts cannot prove actual horizontal overflow, popup collision, duplicate
DOM IDs, visible focus, runtime labels, safe-area behavior or rendered responsive
hierarchy. These are exactly the classes of regressions the local verification contract
requires agents to verify.

Authoritative owner:

`docs/ui/ui-verification.md` + CI/repository verification tooling.

Recommendation:

Promote the useful part of the temporary browser matrix into a reusable repository
script/job instead of keeping it as ad-hoc CI YAML. Keep it targeted to critical user
flows so normal feedback remains fast.

Verification:

A CI run should produce a machine-readable report and screenshots for the configured
critical route/state matrix and fail on agreed hard invariants.

### P1 — Touch-target checks were warnings, not failures, in the rendered audit prototype

Status: verified historical audit-contract finding; the temporary audit is no longer in
current CI.

Evidence:

The temporary browser matrix calculated target thresholds of 44px for standalone
controls, 40px for menu items and 36px for toolbar controls, but collected violations as
`targetWarnings` instead of `hardFailures`.

Why it matters:

Both `PRODUCT.md` and the local UI system treat touch usability as a product invariant,
and the upstream priority model classifies touch/interaction as critical. A warning can
silently persist indefinitely.

Authoritative owner:

Local component density contract + rendered verification gate.

Recommendation:

When the runtime audit is restored, first record a baseline, classify legitimate inline
exceptions, then promote standalone/menu/toolbar target violations to hard failures.
Do not globally demand 44px for inline text links or controls whose larger hit area is
provided by a labelled wrapper.

Verification:

Known-good `Button` density variants remain green; deliberately shrinking a standalone
test control below its threshold must fail the runtime audit.

### P2 — The temporary runtime route matrix covered only a subset of the current app

Status: verified coverage finding.

Evidence:

The temporary matrix rendered twelve routes such as `/reader`, `/hsk`,
`/daily-reading`, `/dictation`, `/humanities`, `/personal-learning`, `/translation` and
`/tts`. The current authenticated app route tree contains additional surfaces including
`/conversation`, `/dictionary`, `/grammar`, `/memory-tips`, `/data-quality`,
`/api-docs` and others.

Why it matters:

A hard-coded route list can give false confidence while newly added or less frequently
visited surfaces never receive runtime responsive/a11y evidence.

Authoritative owner:

Route inventory + UI verification tooling.

Recommendation:

Maintain an explicit critical-route registry with ownership and required states, or
derive route discovery and keep a small allowlist for routes that need fixtures/auth.
Do not attempt to render every possible dynamic route on every commit.

Verification:

Adding a new user-facing route should either place it in the critical matrix or require
an explicit documented exemption.

### P2 — WCAG AA is a stated target, but current automated UI guards do not verify rendered contrast

Status: verified automation gap; no claim that current colors fail contrast.

Evidence:

- `PRODUCT.md` targets readable WCAG AA contrast.
- The upstream audit model uses 4.5:1 normal-text contrast as a critical baseline.
- `scripts/check-ui-standards.mjs` validates token/style ownership and banned color
  recipes, but does not compute the actual rendered foreground/background contrast.
- The temporary browser matrix toggled light/dark state but did not calculate contrast.

Why it matters:

Correct semantic tokens can still combine into a low-contrast rendered state,
especially across hover, selected, disabled, dark-mode and palette combinations.

Authoritative owner:

Theme tokens/components + rendered accessibility verification.

Recommendation:

Add a targeted rendered accessibility pass for critical surfaces/palettes. Prefer an
established accessibility engine when available; if a custom contrast check is used,
make the composited foreground/background calculation explicit and test it.

Verification:

Critical light/dark states pass normal-text/large-text contrast requirements; a seeded
low-contrast fixture fails deterministically.

### P2 — Performance checks are architecture guards, not runtime UX performance evidence

Status: verified boundary finding; no claim that the app is currently slow.

Evidence:

`scripts/check-hanzihome-performance.mjs` checks known source boundaries such as
catalog fetch shape, stale-time misuse and legacy endpoints. It does not measure layout
shift, paint timing, media dimensions or interaction responsiveness.

Why it matters:

The upstream model correctly separates runtime performance from source architecture.
A source guard can prevent known regressions while still missing CLS or an interaction
that becomes visibly sluggish on a real route.

Authoritative owner:

Existing source performance guard + future targeted runtime performance evidence.

Recommendation:

Keep the current source checker. Add runtime budgets only for a few critical reading and
study flows where user-visible latency/layout stability matters; avoid turning every UI
commit into a heavyweight Lighthouse suite.

Verification:

A critical route can be measured repeatedly with stable budgets, while the normal fast
source feedback loop remains unchanged.

### P3 — Generic upstream design intelligence could conflict with the established local system if installed unqualified

Status: resolved by this audit change.

Evidence:

The upstream skill can generate/persist product-wide style, palette, typography and
layout recommendations. `chines-app` already has authoritative product rules, semantic
tokens, component contracts and a project-specific `frontend-ui-system` skill.

Why it matters:

Treating generic generated design output as authoritative could reintroduce exactly the
second component/style dialect that the repository has spent effort eliminating.

Resolution:

Added `.agents/skills/ui-ux-pro-max/SKILL.md` as a project adapter and updated
`AGENTS.md` so broad UI audits read `frontend-ui-system` first. The adapted skill keeps
upstream audit priorities but explicitly subordinates generic design suggestions to
local owners.

## Priority order from here

1. Keep the new adapted skill and local authority routing.
2. Restore a reusable rendered critical-route audit outside temporary YAML.
3. Promote touch-target violations from warning to enforceable invariant after a clean
   baseline.
4. Add targeted rendered contrast checks for theme/palette-critical surfaces.
5. Expand runtime route coverage deliberately as user-facing surfaces become critical.
6. Add runtime performance budgets only where they protect an actual study flow.

## Verification performed for this audit

Verified from current `main` source/contracts:

- repository/agent authority model;
- product UI principles;
- local UI skill and component ownership contracts;
- UI static checker behavior;
- Button density owner;
- HanziHome source performance checker;
- current CI workflow shape;
- current route-tree breadth;
- current shared scroll-helper usage in the inspected lesson-text surface;
- historical temporary rendered-audit implementation and its later removal.

Not executed in this audit session:

- `npm run ui:check`;
- `npm run check`;
- authenticated browser rendering;
- keyboard/touch interaction playback;
- computed runtime contrast;
- runtime CLS/performance measurement.

Those remain explicitly unverified rather than being inferred from source inspection.
