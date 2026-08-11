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

A palette is an accent system with a restrained canvas tint, not a full page skin.

Palette MAY own:

- the page canvas alias `--bg-primary` through a palette-specific `--canvas-background`;
- `--primary` and its foreground;
- `--accent` and its foreground;
- `--ring`;
- active Sidebar/navigation emphasis;
- brand-oriented chart accent.

Palette MUST NOT own:

- the neutral `--background` foundation token;
- Card background;
- Popover/Dialog background;
- neutral elevated/subtle surfaces;
- input surface;
- border hierarchy;
- normal text hierarchy.

Light/dark mode therefore owns the neutral surface family while the selected palette
may tint only the outer page canvas enough to make the theme perceptible. A Plum
palette may give the page a restrained plum cast and Plum active controls, but Card,
Popover, Dialog and borders remain on the neutral light/dark hierarchy.

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
the outer canvas but must not turn every card or semantic state purple. Theme palettes
must never redefine success, warning, danger or info simply to make the screen feel
more coordinated.

## 3. Light and dark pairs

Every palette requires both a light and dark token set. Dark mode is not a simple
inversion of the light accent: foreground contrast, active text and canvas tint must
be selected independently for the dark neutral surface family.

`system` mode resolves from `prefers-color-scheme`; the stored palette remains
unchanged when the operating system switches between light and dark.

## 4. Settings UX

Appearance settings expose:

- one direct light/dark/system choice;
- the complete palette set with a visual swatch;
- a selected-state check;
- a short description of the current palette.

Palette choices are standalone touch targets. They must not be represented as small
toolbar controls. Changing palette should visibly change the outer page canvas plus
selected/active emphasis without reducing reading contrast inside content surfaces.

## 5. Adding a palette

To add a palette:

1. Add its key to `ThemePaletteSchema`.
2. Add user-facing metadata to `THEME_PALETTE_META`.
3. Define light and dark selectors in `theme-palettes.css`.
4. Define a restrained `--canvas-background` plus the palette-owned emphasis tokens.
5. Keep Card/Popover/Dialog/input/border/text foundation tokens neutral.
6. Add/keep a swatch selector.
7. Run `theme-contract.test.ts` and the normal UI gate.
8. Render at least Settings plus one content-heavy learning surface in light and dark
   mode before claiming visual verification.

Do not add feature-local palette classes or a second theme store.
