# UI Verification Contract

A visual or interaction task is not complete after typecheck.

Use the smallest applicable tier:

- Fast: render the affected state and viewport for a local visual regression.
- Subsystem: verify affected responsive, keyboard and state variants.
- Full: verify shared primitive or multi-surface consumers and run the full
  repository gate.

Logic-only work that makes no visual or interaction claim does not require the
full viewport matrix.

## 1. Required states

Inspect every affected surface in relevant states:

- default;
- hover;
- focus-visible;
- active/pressed/selected;
- disabled;
- loading;
- empty;
- error;
- stale/refetching when applicable;
- long text;
- narrow viewport;
- dark mode when the surface is theme-sensitive.

## 2. Required viewports

At minimum:

```text
Desktop: 1440 × 900
iPad portrait: approximately 820 × 1180
Mobile: approximately 390 × 844
```

HanziHome study and note surfaces prioritize iPad portrait behavior.

Check:

- horizontal overflow;
- neutral canvas, opaque surface and 1px border hierarchy remain legible;
- controls render at `rounded-lg`; cards, panels and overlays at `rounded-xl`;
- no feature surface recreates a canonical Card/Button/Select recipe;
- toolbar wrapping and consistent control height;
- Header height and content alignment;
- split-panel width;
- touch targets;
- dynamic viewport height and safe area;
- popup collision and clipping;
- command/editor toolbar controls use the 36px toolbar family;
- feature workspaces inherit shell height rather than subtracting guessed Header/navigation heights;
- global and contextual navigation remain distinct.

## 3. Keyboard

### Dialog

- trigger opens dialog;
- focus moves inside;
- Tab/Shift+Tab remain within a modal;
- Escape closes when allowed;
- focus returns to the trigger;
- title is exposed;
- destructive pending state prevents duplicate confirmation.

### Menu

- trigger is a button;
- Enter/Space opens;
- focus reaches menu items;
- Arrow navigation works according to the primitive contract;
- selection closes when appropriate;
- Escape closes;
- focus returns to trigger;
- radio/checkbox state is announced;
- destructive actions are identifiable and confirmation opens intentionally.

### Toggle / exclusive choice

- Switch/Checkbox state is announced;
- SegmentedControl exposes one pressed choice;
- Space/Enter behavior matches the control;
- visible label does not misrepresent state.

### Search/command

- shortcut opens;
- input receives focus;
- ArrowUp/ArrowDown changes active result;
- Enter activates the correct item;
- Escape closes;
- empty/loading/error states remain readable;
- direct actions are not incorrectly nested inside listbox options.

## 4. Overlay stacking

Verify:

- app header stays below transient overlays;
- Dialog/Sheet/Popover/Menu appears above the shell;
- Select opened inside Dialog/Popover appears above the parent overlay;
- no feature-local z-index patch is required;
- nested overlays return focus correctly.

## 5. Refactor regression flows

### Global Sidebar and Home

- Sidebar shows Học, Luyện, Năng lực and Cá nhân on desktop;
- navigating to a route in another group automatically exposes the active route without closing unrelated groups the user opened;
- collapsed rail preserves direct route access and accessible names;
- mobile navigation exposes the active route with `aria-current`;
- Home contains continuation/recent-work content and does not duplicate the global sitemap as large navigation cards;
- Home loading skeleton matches the current information hierarchy.

### Gear, profile and settings hub

- Gear and avatar triggers work with mouse, keyboard and touch;
- Theme, lookup and Focus remain available globally;
- reader font/size/reveal/visibility groups appear only in an active HanziHome lesson workspace;
- leaving lesson context clears any open reader subsection without a render/update loop;
- font radio items visually preview the represented Hanzi font;
- Gear menu does not overflow viewport and checkbox/radio state is announced;
- `/settings?section=app|reading|ai` deep-links, preserves the selected section after refresh and rejects an invalid section to `app`;
- Reader settings show loading, sync error and retry states without hiding the current local preference;
- Avatar contains identity/provider context and logout only; logout is visually destructive.

### HanziHome Library

- page uses normal App Shell scrolling; there is no second page-level inner scroll area;
- collection → course → book hierarchy remains understandable without nested bordered surfaces at every level;
- count metadata does not compete with status Badges;
- Select and adjacent Open button use the same 36px toolbar family;
- edit mode exposes one action menu per course/book/lesson rather than permanent icon clusters;
- action menu supports edit, reorder and delete with keyboard navigation;
- delete opens a confirmation dialog, reports pending state and keeps recoverability copy accurate;
- course/book/lesson Query invalidation still refreshes the affected library data.

### HanziHome workspace

- module choice behaves as a pressed single-choice group and announces selected state;
- mobile split-pane choice is touch-sized and announces selected pane;
- mobile/tablet module Select and desktop segmented navigation represent the same active module;
- offline/sync-error status uses semantic status presentation and retry remains keyboard reachable;
- split orientation follows the existing responsive contract and resizing persists without update loops;
- developer actions remain contextual and do not alter learner state accidentally.

### Aggregate vocab/grammar library

- PageHeader, lesson-selection tools and filter bar remain readable at all three viewports;
- keyword Input + filter Selects + reset action align without mixed control densities;
- loading, fetch error and no-results states are distinct;
- per-lesson Open/Ôn actions remain reachable by keyboard;
- vocab review routes preserve selected lesson URL state;
- grammar review can enter and leave active review without losing filter state.

### Notes

- Notes workspace fills the available shell height without hard-coded subtraction;
- desktop library pane and mobile Sheet remain usable after Header/mobile-nav size changes;
- search, filters and create/import actions wrap without horizontal overflow;
- loading/error state still occupies a usable route surface.

### Notebook

- PageContainer gutters match other application pages;
- view mode uses one SegmentedControl contract across normal/compact toolbar states;
- scrolling across the compact enter/exit thresholds does not flicker;
- section/group filters remain keyboard reachable and horizontally scrollable when narrow.

### Dictionary / SRS

- route remains thin and feature owns data/query-normalization/UI composition;
- saved vocabulary, legacy fallback and missing-table behavior remain distinct;
- search has a no-results state different from a genuinely empty SRS;
- interactive SRS Card/Link exposes visible focus;
- long pinyin/meaning/note content does not expand the page horizontally.

### Memory Tips

- loading, query error and empty state are distinct;
- edit/pin/delete actions live in the overflow menu;
- edit dialog opens controlled from the menu and preserves form behavior;
- delete requires confirmation and reports the soft-delete/archive behavior;
- tags/status remain readable without overwhelming the title/body hierarchy.

### Global search

- `Cmd/Ctrl+K` opens;
- initial state is not a blank tall panel;
- close button and loading indicator do not collide;
- query results can be navigated;
- direct dictionary action is reachable;
- result count and no-results state are correct;
- closing restores focus.

### Developer API page

- endpoint labels, method badges and curl samples remain readable without horizontal page overflow;
- each endpoint starts collapsed; its native summary is reachable with Tab and toggles with Enter or Space;
- every displayed operation has an explicit query/no-body state, expected request JSON and status/content-type-qualified response sample;
- a raw integration key is revealed only after creation and a Supabase/browser access token is never copied or rendered;
- Copy curl actions are keyboard reachable and report success or failure;
- key-create/revoke dialogs preserve keyboard focus, Escape behavior and focus return;
- mobile command/request/response samples scroll within their card rather than expanding page width.

## 6. Evidence in handoff

For UI tasks, report:

```text
Environment:
Authentication state:
Rendered routes:
Viewports:
Mouse/touch interactions:
Keyboard interactions:
Loading/empty/error/destructive states:
Console warnings/errors:
Failed network requests:
Repository checks:
Known unverified states:
```

Do not claim a UI issue is fixed when only JSX or CSS was inspected.
