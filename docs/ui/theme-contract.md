# Theme and color contract

`chines-app` implements Hanzi Studio's **Editorial Study Workspace** visual system while
preserving the local shadcn primitive boundary and existing persisted theme keys.

Source visual reference for this consolidation:

```text
lekhanh2099/hanzi-studio
commit 0568e6cd15d868ac968dfe03533d99429a4e9fcf
src/styles/theme.css
docs/STYLE_GUIDE.md
docs/engineering/UI_SYSTEM.md
.agents/skills/hanzi-frontend-quality/SKILL.md
```

Local runtime ownership remains authoritative:

```text
ThemeProvider                  -> mode/palette persistence + root attributes
src/app/globals.css            -> canonical light/dark foundations + shadcn aliases
src/app/theme-palettes.css     -> palette overrides
src/app/surface-system.css     -> surface-role aliases and transitions
src/components/ui/**           -> visual primitive anatomy
```

## 1. Product visual hierarchy

Hanzi and the current learning unit dominate. Immediate study actions come second.
Pinyin, Vietnamese meaning, metadata, source and settings are supporting layers.

The app is a reading/practice workspace, not an analytics dashboard. Prefer authored
document composition, whitespace and a small number of meaningful surfaces over grids
of equal-weight cards, KPI tiles, decorative hero panels or nested card stacks.

Primary indigo is for the current primary action, active location, selection and
playback progress. Accent teal supports audio and secondary learning state. It is not a
second brand fill for large surfaces.

## 2. Canonical surface roles

```text
canvas          -> --theme-background
work/document   -> --theme-surface / --theme-reading-canvas
grouped support -> --theme-surface-muted
overlay         -> --theme-surface-raised
hover           -> --theme-surface-hover
selected        -> --theme-primary-soft + --theme-primary emphasis
```

Existing aliases (`bg-card`, `bg-subtle`, `surface-base`, etc.) resolve to these roles.
Feature code never invents another palette or card recipe.

## 3. Color syntax

Authoritative theme colors use numeric `oklch()` channels and decimal alpha only.

Forbidden in `globals.css` theme foundations, `theme-palettes.css` and
`surface-system.css`:

- HSL/HSLA percentage channels;
- `color-mix(... N%, ...)` recipes;
- raw RGB/hex theme definitions;
- decorative gradients.

This keeps the palette explicit and auditable. Tool-owned content colors such as a PDF
annotation pen or rich-text authored color are data, not app-theme tokens, and stay
inside their dedicated tool owner.

## 4. Palette compatibility

Persisted palette keys remain:

```text
editorial | jade | warm | plum | mono | tea
```

`editorial`, `jade`, `plum` and `mono` use the Hanzi Studio palette directly. The stored
key `warm` renders the Hanzi Studio sepia palette without breaking existing localStorage.
`tea` remains as a backwards-compatible extra palette but follows the same Editorial
Study Workspace hierarchy.

Every palette defines light and dark states. Palette changes may alter the canonical
source theme roles, but semantic warning/success/danger meaning must remain legible and
interaction state may not depend on color alone.

## 5. Geometry and motion

```text
control radius -> 0.625rem
panel/card     -> 0.875rem
dialog         -> 1rem
touch target   -> 2.75rem minimum
```

Borders establish normal hierarchy. Shadows are restrained and reserved for focus or
elevated/transient surfaces. Feature hover styles never translate or scale the hit
target under the pointer. Theme transition is short and limited to major structural
surfaces; reduced motion disables it.

## 6. Typography and learning content

Font sizes use semantic Tailwind/rem values, never pixel declarations. Chinese learner
content uses the feature-owned Hanzi/Pinyin/translation typography contracts. Reading
support text never competes with canonical Hanzi.

Do not use `w-fit`, `h-fit`, `fit-content`, `min-content` or `max-content` as layout
repairs. Use wrapping, `min-w-0`, parent alignment, inline layout where intrinsically
semantic, and bounded grid/flex composition.

## 7. Settings and verification

Appearance settings expose system/light/dark plus every persisted palette. Theme work is
not complete from source inspection alone. Render Settings and a content-heavy learning
surface in light and dark, switch every palette, and verify mobile, iPad portrait and
desktop when the environment supports browser rendering.

`npm run ui:check` enforces the machine-detectable subset. `npm run check` remains the
complete repository gate.
