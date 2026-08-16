# UI Verification Contract

A visual or interaction task is not complete after typecheck.

Use the smallest applicable tier:

- Fast: render the affected state and viewport for a local regression.
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
- dark mode when theme-sensitive.

## 2. Required viewports

At minimum:

```text
Desktop: 1440 × 900
iPad portrait: approximately 820 × 1180
Mobile: approximately 390 × 844
```

HanziHome study and Notes surfaces prioritize iPad portrait behavior.

Check:

- horizontal overflow;
- neutral canvas, opaque surfaces and 1px border hierarchy;
- controls at `rounded-lg`; cards/panels/overlays at `rounded-xl`;
- no accidental `rounded-2xl/3xl`, arbitrary radius or 2px+ feature borders;
- no decorative product gradients, feature raw-palette utilities, pixel font sizes, or fit-content layout patches;
- theme foundations use explicit numeric OKLCH/decimal alpha with no percentage color-mix recipes;
- focus-visible treatment is the same across Button/Input/Textarea/Select/Checkbox/Radio/Switch/Chip;
- no feature-owned ring or z-index repair;
- sibling rhythm is parent `gap`/padding rather than child margins or `space-x/space-y`;
- no feature surface recreates canonical Card/Button/Select recipes;
- toolbar wrapping and consistent control heights;
- Header alignment and route-context replacement;
- split-panel width;
- touch targets;
- visual icon/avatar size is allowed to be smaller than its 44px phone hit area;
- dynamic viewport height and safe area;
- popup collision/clipping;
- command/editor rows use the 36px toolbar family;
- feature workspaces inherit shell height instead of subtracting guessed Header/navigation heights;
- global and contextual navigation remain distinct.

## 3. Keyboard

### Dialog

- trigger opens;
- focus moves inside;
- Tab/Shift+Tab remain within modal;
- Escape closes when allowed;
- focus returns to trigger;
- title is exposed;
- destructive pending state blocks duplicate confirmation.

### Menu

- trigger is a button;
- Enter/Space opens;
- focus reaches menu items;
- Arrow navigation follows primitive behavior;
- selection closes when appropriate;
- Escape closes;
- focus returns to trigger;
- checkbox/radio state is announced;
- destructive item opens confirmation intentionally.

### Toggle / exclusive choice

- Switch/Checkbox state is announced;
- SegmentedControl exposes exactly the selected pressed choice;
- Space/Enter matches the control;
- visible label matches state.

### Search/command

- Cmd/Ctrl+K opens;
- input receives focus;
- ArrowUp/ArrowDown moves active result;
- Enter activates the correct result;
- Escape closes;
- empty/loading/error states remain readable;
- direct actions are not nested incorrectly inside listbox options;
- closing restores focus.

## 4. Overlay stacking

Verify:

- app Header stays below transient overlays;
- Dialog/Sheet/Popover/Menu appears above shell;
- Select inside Dialog/Popover appears above parent overlay;
- no feature-local z-index repair is required;
- nested overlays return focus correctly.

## 5. Refactor regression flows

### Shared shell boundary

- `Header.tsx` remains feature-neutral and imports no HanziHome implementation;
- simple route breadcrumb renders while no feature context is registered;
- HanziHome lesson breadcrumb replaces the simple context after feature
  registration and returns cleanly when leaving the workspace;
- owner cleanup from an old feature instance cannot clear a newer Header context;
- repeated lesson/search-param changes do not cause clear/set flicker loops;
- Cmd/Ctrl+K and Header search field use `globalSearchStore` only for open/query;
- HanziHome search result/course/lesson data remain in feature-owned Query/bridge logic.

### Global Sidebar and Home

- Sidebar shows Học, Luyện, Năng lực and Cá nhân on desktop;
- navigating to a route in another group exposes the active route without closing unrelated user-opened groups;
- collapsed rail preserves direct route access and accessible names;
- phone quick navigation is icon-only, each destination keeps an accessible name and the active destination keeps `aria-current`;
- phone quick-navigation targets remain 44px even though labels are visually hidden;
- `Thêm` exposes every non-primary route plus the Settings destination so hiding the phone Header gear never makes Settings unreachable;
- bottom navigation clears device safe-area without reserving obsolete label height;
- Home contains continuation/recent-work content and does not duplicate the global sitemap as large navigation cards;
- Home loading skeleton matches current hierarchy.

### Gear, profile and settings hub

- Gear and avatar triggers work with mouse, keyboard and touch where rendered;
- phone Header may hide Gear to preserve route context; Settings remains reachable through `Thêm`;
- phone profile keeps a 44px target even when the visible avatar is smaller;
- Gear contains global Theme, route-scoped lookup, Focus and the full Settings link only;
- reader controls are not duplicated in global Gear;
- `/settings?section=app|reading|ai` deep-links, preserves selected section after refresh and rejects invalid section to `app`;
- full Reader settings show loading, sync error and retry without hiding current local preference;
- Avatar contains identity/provider context and logout only;
- logout is visually/semantically destructive.

### HanziHome reader quick settings

- the quick reader control is available from the lesson workspace toolbar only;
- font/size/reveal/visibility menu groups expose current state;
- font radio items visually preview the represented Hanzi font;
- phone/iPad use one modal Sheet rather than parent + lateral submenu panels;
- menu keyboard navigation and Escape/focus return work on desktop;
- loading/sync-error state is observable;
- full reading settings link routes to `/settings?section=reading`;
- leaving lesson workspace unmounts the contextual control without persisting local menu-open state.

### HanziHome Library

- page uses App Shell scrolling; no second page-level inner scroll;
- collection → course → book hierarchy is clear without bordered nesting at every level;
- ordinary count metadata does not compete with status Badges;
- Select and adjacent Open button use the same 36px toolbar family;
- edit mode exposes one action menu per course/book/lesson instead of permanent icon clusters;
- action menu supports edit, reorder and delete by keyboard;
- delete opens confirmation, reports pending state and describes recoverability accurately;
- course/book/lesson Query invalidation refreshes affected library data.

### HanziHome workspace

- module choice behaves as a pressed single-choice group;
- mobile split-pane choice is touch-sized and announces selected pane;
- mobile/tablet Select and desktop SegmentedControl represent the same active module;
- offline/sync-error status uses semantic status presentation and retry is keyboard reachable;
- split orientation follows existing responsive contract;
- resizing persists without update loops;
- developer actions remain contextual and do not alter learner state accidentally.

### Aggregate vocab/grammar library

- PageHeader, lesson-selection tools and filter bar remain readable at all viewports;
- keyword Input + filter Selects + reset action align without mixed density;
- loading, fetch error and no-results are distinct;
- per-lesson Open/Ôn actions are keyboard reachable;
- vocab review preserves selected lesson URL state;
- grammar review enters/leaves active review without losing filter state.

### Notes

- Notes workspace fills available shell height without hard-coded subtraction;
- desktop library pane and mobile Sheet remain usable after Header/mobile-nav size changes;
- search, filters and create/import actions wrap without horizontal overflow;
- loading/error states occupy a usable route surface;
- phone note Header preserves title/quick-select width while showing only high-value contextual actions plus search/profile;
- successful autosave does not permanently consume a phone Header slot, while saving and save-error states remain visible;
- phone note action overflow opens one modal bottom Sheet with touch-sized rows rather than a long floating Popover;
- read-only phone rendering normalizes imported inline font sizes without mutating stored note content;
- switching to edit mode restores the stored formatting contract rather than persisting the mobile presentation override;
- body/heading/quote rhythm fits the phone width without globally shrinking text to an unreadable size;
- long code/preformatted teaching content wraps on phone and does not widen the document;
- tables, when wider than the phone, scroll inside their own content region rather than causing page-level horizontal overflow;
- phone reading surface removes redundant desktop card/inset padding while tablet/desktop keep their stronger frame.

### Notebook

- PageContainer gutters match other routes;
- view mode uses one SegmentedControl contract in normal and compact toolbar states;
- compact enter/exit thresholds do not flicker;
- section/group filters remain keyboard reachable and horizontally scrollable when narrow.

### Dictionary / SRS

- route stays thin and feature owns query-normalization/UI composition;
- saved vocabulary, legacy fallback and missing-table behavior remain distinct;
- search no-results differs from a genuinely empty SRS;
- interactive SRS Card/Link has visible focus;
- long pinyin/meaning/note content does not create horizontal page overflow.

### Memory Tips

- loading, query error and empty state remain distinct;
- edit/pin/delete actions live in overflow menu;
- edit dialog opens controlled from menu and preserves form behavior;
- delete requires confirmation and reports soft-delete/archive behavior;
- tags/status remain readable without overwhelming title/body hierarchy.

### Settings

- app/reading/AI tabs preserve URL section state;
- settings rows use canonical Card/Switch anatomy;
- AI status/category indicators use Badge rather than hand-built pills;
- prompt dirty/saved state remains correct after reset/save/error fallback;
- model Select and save/reset controls work with keyboard and disabled states.

### Global search

- `Cmd/Ctrl+K` opens from any authenticated route;
- Header search field and mobile icon open the same search state;
- HanziHome feature bridge receives current course/lesson context when available;
- Focus mode blocks opening a different lesson result as before;
- Chinese direct lookup still opens inspector;
- initial/loading/results/no-results/error states remain distinct;
- close clears/retains query according to current product contract and restores focus.

### Developer API page

- endpoint labels, method badges and curl samples remain readable without horizontal page overflow;
- each endpoint starts collapsed and summary toggles by keyboard;
- every operation has explicit query/no-body, request and response state;
- raw integration key is reveal-once and browser/Supabase access token is never rendered/copied;
- Copy curl reports success/failure;
- key create/revoke dialogs preserve focus/Escape/focus return;
- mobile code samples scroll inside card rather than widening page.

## 6. Evidence in handoff

For UI tasks report:

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
Deployment/build status:
Known unverified states:
```

A successful deploy/build is compile evidence, not proof of the responsive or
keyboard matrix. Do not claim a UI issue is fixed when only JSX/CSS was
inspected.
