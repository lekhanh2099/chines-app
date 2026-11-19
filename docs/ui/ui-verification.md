# UI Verification Contract

A visual or interaction task is not complete after typecheck.

Select the verification tier from root `AGENTS.md`. For a local regression,
render the affected state/viewport. Broaden to responsive, keyboard and state
variants when affected, and inspect consumers for shared primitive changes.

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

For responsive or multi-surface work, use the affected viewports below. A local
regression uses its affected viewport; this is not a mandatory full matrix for
every visual edit.

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
- one route-level vertical scroll owner (`AppScrollViewport`); section navigation uses the shared app-scroll helper instead of `window`/native `scrollIntoView`;
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
- Dialog/Popover/Menu appears above shell;
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
- phone quick navigation shows icon and short label, each destination keeps an accessible name and the active destination keeps `aria-current`;
- phone quick-navigation targets remain at least 44px with visible labels;
- `Thêm` exposes every non-primary route plus the Settings destination so hiding the phone Header gear never makes Settings unreachable;
- bottom navigation includes device safe-area within its compact labeled bar;
- Home contains continuation/recent-work content and does not duplicate the global sitemap as large navigation cards;
- Home loading skeleton matches current hierarchy.

For Home layout work, verify a narrow phone, iPad portrait, a
Sidebar-constrained tablet/landscape width and desktop.
Check section order, long note/activity labels, bottom navigation clearance and
whether the first viewport has a coherent hierarchy without artificial dead
space. The viewport width alone does not prove usable content width.

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

For touch reader-control changes, render the open settings on a narrow phone
and iPad portrait, and verify the wide-desktop menu separately.

- the quick reader control is available from the lesson workspace toolbar only;
- font/size/reveal/visibility menu groups expose current state;
- font radio items visually preview the represented Hanzi font;
- phone/iPad use one modal Dialog rather than parent + lateral submenu panels;
- menu keyboard navigation and Escape/focus return work on desktop;
- loading/sync-error state is observable;
- full reading settings link routes to `/settings?section=reading`;
- leaving lesson workspace unmounts the contextual control without persisting local menu-open state.

### HanziHome Library

- page uses App Shell scrolling; no second page-level inner scroll;
- collection → course → book hierarchy is clear without bordered nesting at every level;
- ordinary count metadata does not compete with status Badges;
- Select and adjacent Open button use the same 36px toolbar family;
- converted Hán ngữ and Boya books appear as textbook collections and answer the Hán ngữ / Boya filters;
- the library has no course, book or lesson create/rename/delete controls; the edit toggle only unlocks collection covers for editors.

### HanziHome workspace

- module choice behaves as a pressed single-choice group;
- mobile split-pane choice is touch-sized and announces selected pane;
- mobile/tablet Select and desktop SegmentedControl represent the same active module;
- offline/sync-error status uses semantic status presentation and retry is keyboard reachable;
- split orientation follows existing responsive contract;
- resizing persists without update loops;
- developer actions remain contextual and do not alter learner state accidentally.

### Vocabulary store (Tra Hán tự)

- the store shell and its skeleton appear immediately; the list streams in;
- search by Hanzi, toneless pinyin, Hán-Việt and accent-insensitive Vietnamese meaning updates the URL (`q`, `page`) and survives Back;
- a polyphonic written form shows one card per reading and one block per reading on its word page;
- card hover lists the meaning per lesson; the word page is a route, never a dialog;
- the list scrolls inside its own region and never scrolls the page horizontally;
- small card text (Hán-Việt, source, meaning) is at least `bodySmall` and not bold.

### Vocabulary lists and lookup

- a word that occurs in more than one lesson, textbook or note shows the reuse marker; a word that occurs once does not;
- the marker previews meanings on hover or tap and opens the word page on a mouse or keyboard press;
- the lookup drawer shows the learner's lesson meanings ahead of the dictionary, and nothing when the word is not in the store;
- a course word links to its lesson in the textbook reader (`/textbooks/[book]?lesson=N&tab=vocab`).

### Pinyin selection

- a drag that starts on ruby Pinyin selects only Pinyin and copies it as plain text (syllables separated by spaces, one line per block);
- a drag that starts on Hanzi selects Hanzi without Pinyin, and lookup, annotation and Reader copy behave as before;
- a press outside Pinyin leaves Pinyin selection; a Pinyin drag never opens the pronunciation inspector.

### Route changes

- navigating to any route under the signed-in app replaces the content area with a skeleton immediately while the sidebar and header stay interactive;
- routes with their own `loading.tsx` show their own skeleton.

### Notes

- Notes workspace fills available shell height without hard-coded subtraction;
- desktop library pane and mobile Dialog remain usable after Header/mobile-nav size changes;
- search, filters and create/import actions wrap without horizontal overflow;
- loading/error states occupy a usable route surface;
- phone note Header preserves title/quick-select width while showing only high-value contextual actions plus search/profile;
- successful autosave does not permanently consume a phone Header slot, while saving and save-error states remain visible;
- phone note action overflow opens one modal Dialog with touch-sized rows rather than a long floating Popover;
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

For theme work, render Settings and one content-heavy learning surface in both
light and dark mode and switch every palette. Check canvas/base/subtle/raised
separation, hover/selected coherence, palette-independent semantic states,
selected/focus/primary text emphasis and computed contrast separately.

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

Follow the root handoff rule. For each visual claim identify the environment,
authentication, route, viewport and relevant interaction/state actually
rendered. Report console/network issues, checks and remaining unverified states.
Do not require empty fields for interactions outside the changed scope.

A successful deploy/build is compile evidence, not proof of the responsive or
keyboard matrix. Do not claim a UI issue is fixed when only JSX/CSS was
inspected.
