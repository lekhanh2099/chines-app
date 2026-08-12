# Theme and color contract

The application separates **appearance mode** from **accent palette**.

```text
mode    -> system | light | dark
palette -> editorial | jade | warm | plum | mono | tea
```

The authoritative runtime contract lives in `src/components/layout/theme-contract.ts`.
`ThemeProvider` owns persistence/root attributes, `src/app/theme-palettes.css` owns
palette identity, and `src/app/surface-system.css` owns the semantic surface hierarchy.

## 1. Surface hierarchy

Do not theme the app by independently tinting components. All normal application
surfaces resolve through one ladder:

```text
surface-canvas   -> route/page background
surface-subtle   -> grouped or secondary section
surface-base     -> Card, shell chrome, study panel
surface-raised   -> Popover/Dialog/elevated transient content
surface-hover    -> hover on an interactive base surface
surface-selected -> active/selected navigation or choice
```

This hierarchy follows the same design principle used by mature platform systems:
background/surface roles communicate depth and grouping; brand color communicates
selection and priority.

Palette MAY own:

- `--canvas-background`;
- `--primary` and `--primary-foreground`;
- `--accent` and `--accent-foreground`;
- `--ring`;
- Sidebar/navigation emphasis;
- brand-oriented chart accent.

Palette MUST NOT redefine the raw structural foundations:

- `--background`;
- `--card`;
- `--popover`;
- `--border`;
- semantic success/warning/danger/info colors.

`surface-system.css` derives the visible app surfaces from those foundations and the
selected palette. The base surface must receive a **perceptible but restrained** canvas
tint: enough that Card/Header/Sidebar belong to the same theme, but not enough to flatten
the interface into one colored sheet. Subtle surfaces sit between canvas and base.
Raised surfaces remain the mode-owned Popover foundation.

Hover and selected surfaces derive from the low-chroma `--accent` role plus the base
surface. Do not mix high-chroma `--primary` directly into large surface backgrounds;
that creates a hue/chroma jump even when the palette itself is coherent. `--primary`
remains the emphasis color for selected text/icons, focus and selected borders.

## 2. Alias ownership

Existing app aliases resolve through the surface ladder:

```text
--bg-primary       -> --surface-canvas
--bg-card          -> --surface-base
--bg-card-hover    -> --surface-hover
--bg-subtle        -> --surface-subtle
--bg-elevated      -> --surface-raised
--theme-card-background -> --surface-base
```

Learning-specific aliases use the same roles. `study-content-surface`, exercise cards,
study chips and HanziHome liquid panels must not bypass the ladder with raw `--card`.

The result should read as one layered interface:

```text
canvas
  shell / toolbar / Card / study panel
    grouped subtle region
      selected or interactive state
```

A route must not appear as unrelated white blocks floating on a colored canvas, nor as
one uniformly tinted sheet with no depth cues.

## 3. Selection, focus and borders

Selection uses the palette without turning the whole selected surface into the primary
brand color.

```text
selected background -> --surface-selected (accent-derived)
selected text/icon   -> --primary
selected border      -> --surface-selected-border
focus ring           -> --ring
normal border        -> neutral --border
```

Do not recolor every border with the palette. Accent borders are for selected/focus
states only. Normal Card, shell, toolbar and content boundaries stay neutral.

## 4. Semantic color independence

Semantic colors keep the same meaning in every palette:

```text
success -> success tokens
warning -> warning tokens
danger  -> danger tokens
info    -> info tokens
purple  -> semantic purple/category tokens
```

A Jade palette must not turn a purple category badge green. A Plum palette must not
redefine warning/error simply to look coordinated. Theme color is never the only signal
for state.

## 5. Light and dark pairs

Every palette requires both a light and dark token set. Dark mode is not a simple
inversion. The surface ladder must preserve ordering in both modes:

```text
canvas < subtle < base < raised
```

where `<` means visually lower/less elevated, not a literal numeric color comparison.
The selected surface must remain distinguishable without becoming a large saturated
block.

`system` mode resolves from `prefers-color-scheme`; the stored palette remains unchanged
when the operating system switches between light and dark.

## 6. Theme transition

Do not animate every descendant during a theme change. That makes nested panels appear
to repaint independently.

The global contract is:

- nested descendants change immediately;
- only major structural surfaces and active navigation may cross-fade;
- transition is short (about 140ms);
- `prefers-reduced-motion: reduce` disables the transition.

## 7. Settings UX

Appearance settings expose:

- one direct light/dark/system choice;
- the complete palette set with a visual swatch;
- a selected-state check;
- a short description of the current palette;
- a live preview that shows canvas, base surface, subtle grouping, text hierarchy and
  selected state together.

Palette choices are standalone touch targets. Changing palette should visibly affect
canvas, structural base surfaces and selected emphasis while keeping content readability
stable.

## 8. Adding a palette

To add a palette:

1. Add its key to `ThemePaletteSchema`.
2. Add user-facing metadata to `THEME_PALETTE_META`.
3. Define light and dark selectors in `theme-palettes.css`.
4. Define `--canvas-background`, primary/accent/ring and Sidebar emphasis only.
5. Do not create feature-local background recipes.
6. Keep semantic state colors independent.
7. Keep the shared surface ladder intact; do not add a palette-specific Card recipe.
8. Keep hover/selected backgrounds accent-derived; reserve primary for emphasis.
9. Add/keep a swatch selector.
10. Run `theme-contract.test.ts` and the normal UI gate.
11. Render Settings plus at least one content-heavy learning surface in light and dark
    before claiming visual verification.

Do not add a second theme store or feature-local palette classes.
