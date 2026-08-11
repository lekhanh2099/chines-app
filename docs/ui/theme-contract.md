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

A palette is an accent system, not a page skin.

Palette MAY own:

- `--primary` and its foreground;
- `--accent` and its foreground;
- `--ring`;
- active Sidebar/navigation emphasis;
- brand-oriented chart accent.

Palette MUST NOT own:

- page/canvas background;
- Card background;
- Popover/Dialog background;
- neutral elevated/subtle surfaces;
- border hierarchy;
- normal text hierarchy.

Those neutral surfaces remain owned by the light/dark theme in `globals.css`.
Changing from Editorial to Plum or Tea must therefore change selected controls,
focus, primary actions and active navigation without tinting the entire page.

## 2. Semantic color independence

Semantic colors keep the same meaning in every palette:

```text
success -> success tokens
warning -> warning tokens
danger  -> danger tokens
info    -> info tokens
purple  -> semantic purple/category tokens
```

A Jade palette must not turn a purple category badge green. A Plum palette must
not turn the page canvas pink. Theme palettes must never redefine success,
warning, danger or info simply to make the screen feel more coordinated.

## 3. Light and dark pairs

Every palette requires both a light and dark token set. Dark mode is not a
simple inversion of the light accent: foreground contrast and subtle accent
surfaces must be selected independently for the dark neutral canvas.

`system` mode resolves from `prefers-color-scheme`; the stored palette remains
unchanged when the operating system switches between light and dark.

## 4. Settings UX

Appearance settings expose:

- one direct light/dark/system choice;
- the complete palette set with a visual swatch;
- a selected-state check;
- a short description of the current palette.

Palette choices are standalone touch targets. They must not be represented as
small toolbar controls.

## 5. Adding a palette

To add a palette:

1. Add its key to `ThemePaletteSchema`.
2. Add user-facing metadata to `THEME_PALETTE_META`.
3. Define light and dark selectors in `theme-palettes.css`.
4. Override only the palette-owned emphasis tokens above.
5. Add/keep a swatch selector.
6. Run `theme-contract.test.ts` and the normal UI gate.
7. Render at least Settings plus one content-heavy learning surface in light and
   dark mode before claiming visual verification.

Do not add feature-local palette classes or a second theme store.
