# Theme and color contract

The application separates **appearance mode** from **accent palette**.

```text
mode    -> system | light | dark
palette -> editorial | jade | warm | plum | mono | tea
```

The authoritative runtime contract lives in
`src/components/layout/theme-contract.ts`. `ThemeProvider` owns persistence and
root attributes. `src/app/theme-palettes.css` owns palette token overrides.

## 1. Surface ownership

A palette is a restrained product tint, not a full page skin.

Palette MAY own:

- the page canvas alias `--bg-primary` through a palette-specific `--canvas-background`;
- the Card-only token `--theme-card-background` as a low-percentage mix of the neutral
  `--card` foundation and the selected `--primary`;
- `--primary` and its foreground;
- `--accent` and its foreground;
- `--ring`;
- active Sidebar/navigation emphasis;
- brand-oriented chart accent.

Palette MUST NOT own:

- the neutral `--background` foundation token;
- the neutral `--card` foundation token itself;
- the generic `--bg-card` alias used by controls/shell chrome;
- Popover/Dialog background;
- neutral elevated surfaces;
- input surface;
- border hierarchy;
- normal text hierarchy.

Light/dark mode therefore still owns the structural surface family. The palette can
make the product perceptibly themed in two controlled layers: the outer canvas has
the clearest tint and the shared Card primitive receives a much lighter tint. Shell
chrome, outline controls, Popover, Dialog, input, borders and text stay neutral so
learning content keeps stable contrast.

The active interaction contract uses the selected palette color for both the active
surface emphasis and active text/icon color. Nested `Typography` inside an active
Button must inherit that interaction color rather than resetting itself to normal
body text.

## 2. Semantic color independence

Semantic colors keep the same meaning in every palette:

```text
success -> success tokens
warning -> warning tokens
danger  -> danger tokens
info    -> info tokens
purple  -> semantic purple/category tokens
```

A Jade palette must not turn a purple category badge green. A Plum palette may tint
canvas and default cards, but it must not redefine semantic state colors. Theme palettes
must never redefine success, warning, danger or info simply to make the screen feel
more coordinated.

## 3. Light and dark pairs

Every palette requires both a light and dark token set. Dark mode is not a simple
inversion of the light accent: foreground contrast, active text, canvas tint and Card
tint must remain legible against the dark foundation.

`system` mode resolves from `prefers-color-scheme`; the stored palette remains
unchanged when the operating system switches between light and dark.

## 4. Settings UX

Appearance settings expose:

- one direct light/dark/system choice;
- the complete palette set with a visual swatch;
- a selected-state check;
- a short description of the current palette.

Palette choices are standalone touch targets. They must not be represented as small
toolbar controls. Changing palette should visibly change the outer page canvas, lightly
change Card surfaces and change selected/active emphasis without tinting generic controls
or reducing reading contrast inside content-heavy surfaces.

## 5. Adding a palette

To add a palette:

1. Add its key to `ThemePaletteSchema`.
2. Add user-facing metadata to `THEME_PALETTE_META`.
3. Define light and dark selectors in `theme-palettes.css`.
4. Define a restrained `--canvas-background` plus the palette-owned emphasis tokens.
5. Keep raw `--card` and generic `--bg-card` neutral; derive only
   `--theme-card-background` through the shared low-percentage palette mix.
6. Keep Popover/Dialog/input/border/text foundation tokens neutral.
7. Add/keep a swatch selector.
8. Run `theme-contract.test.ts` and the normal UI gate.
9. Render at least Settings plus one content-heavy learning surface in light and dark
   mode before claiming visual verification.

Do not add feature-local palette classes or a second theme store.
