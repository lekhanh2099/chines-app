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
- toolbar wrapping;
- header height;
- split-panel width;
- touch targets;
- dynamic viewport height;
- safe area where relevant;
- popup collision and clipping.
- command/editor toolbar controls use the compact toolbar density rather than
  standalone 44px action density;
- global and contextual sidebars retain their distinct information scope while
  sharing selected and inactive navigation-row treatment.

## 3. Keyboard

### Dialog

- trigger opens dialog;
- focus moves inside;
- Tab/Shift+Tab remain within a modal;
- Escape closes when allowed;
- focus returns to the trigger;
- title is exposed.

### Menu

- trigger is a button;
- Enter/Space opens;
- focus reaches menu items;
- Arrow navigation works according to the primitive contract;
- selection closes when appropriate;
- Escape closes;
- focus returns to trigger;
- radio/checkbox state is announced.

### Toggle

- state is available to assistive technology;
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
- Dialog/Sheet/Popover appears above the shell;
- Select opened inside Dialog/Popover appears above the parent overlay;
- no feature-local z-index patch is required;
- nested overlays return focus correctly.

## 5. Screenshot-specific regression flows

### Gear, profile and settings hub

- Gear and avatar triggers work with mouse, keyboard and touch;
- Gear menu does not overflow viewport and checkbox state is announced;
- Gear reader panel exposes the current font, size, reveal, Pinyin, meaning and answer choices
  without routing away; its Button selected states remain announced, Escape returns focus to the
  Gear and the loading/sync-error state is observable;
- lookup keeps global and Notes scopes independent; theme and focus mode update
  without a Button-toggle semantic shortcut;
- `/settings?section=app|reading|ai` deep-links, preserves the selected section
  after refresh and rejects an invalid section to `app`;
- Reader settings show loading, sync error and retry states without hiding the
  current local preference;
- avatar contains identity/provider context and logout only; logout remains
  visually and semantically destructive.

### HanziHome tools

- mode choice behaves as a single-choice group and announces its pressed state;
- panel section labels are not focusable;
- editing action closes or preserves the panel intentionally;
- portaled child actions remain buttons within the contextual panel.

### Global search

- `Cmd/Ctrl+K` opens;
- initial state is not a blank tall panel;
- close button and loading indicator do not collide;
- query results can be navigated;
- direct dictionary action is reachable;
- result count and no-results state are correct;
- closing restores focus.

## 6. Evidence in handoff

For UI tasks, report:

```text
Environment:
Authentication state:
Rendered routes:
Viewports:
Mouse/touch interactions:
Keyboard interactions:
Loading/empty/error states:
Console warnings/errors:
Failed network requests:
Known unverified states:
```

Do not claim a UI issue is fixed when only JSX or CSS was inspected.
