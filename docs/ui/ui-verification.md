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

### Profile settings

- avatar trigger works with mouse, keyboard and touch;
- menu does not overflow viewport;
- lookup/theme/focus state is announced;
- reading settings dialog opens and returns focus;
- logout remains visually and semantically destructive.

### HanziHome tools

- mode choice behaves as a single-choice group;
- menu section labels are not focusable;
- editing action closes or preserves menu intentionally;
- portaled child actions follow menu semantics.

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
