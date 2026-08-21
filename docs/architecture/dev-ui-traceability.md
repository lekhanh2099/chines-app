# Development UI Traceability

`chines-app` keeps learner-facing production markup free of debug metadata, but
local `next dev` builds expose the JSX callsite for rendered UI.

## Contract

During Turbopack development, JSX under `src/**/*.tsx` and `src/**/*.jsx` is
transformed to include:

```html
<p data-ui-source="src/features/hanzihome/reader/ReaderWorkspace.tsx:241:7">
  ...
</p>
```

The value is always:

```text
project-relative-file:line:column
```

The coordinate points to the original JSX opening element before the debug
attribute is injected.

This attribute is development instrumentation only. It is not product data,
not a test selector, not an analytics identifier, and not a persisted contract.
Production builds use the existing Webpack build path and do not execute this
Turbopack development rule.

## Why this exists

The application intentionally renders most interface copy through shared
components and `next-intl`. The DOM therefore contains the final translated
text, while source code contains semantic translation keys and component
composition. Searching the rendered Vietnamese/English/Chinese sentence in
TSX is not a reliable way to find the owner.

Traceability resolves that mismatch without flattening the component system or
renaming translation keys around rendered copy.

## Debug workflow

1. Inspect the problematic DOM node in browser DevTools.
2. Read `data-ui-source` and open that file/line.
3. Use existing `data-slot` metadata to identify the canonical primitive when
   relevant.
4. For translated text, resolve the key from the callsite:

```tsx
const t = useTranslations("Reader.home");

<Typography>{t("header.title")}</Typography>
```

The message owner is therefore:

```text
Reader.home.header.title
```

The locale files remain split by their current semantic feature owner. Do not
rename keys to source-language text and do not add `reader_home_*` aliases just
to make DOM search easier.

## Component propagation

The loader decorates both intrinsic elements and normal component callsites.
Canonical components that forward DOM props (for example `Typography`,
`Button`, and `Card`) naturally carry the feature callsite marker to their
rendered DOM node. Components that intentionally do not forward arbitrary DOM
props may expose their implementation source on an inner node instead; inspect
an ancestor when necessary.

React infrastructure nodes such as fragments, strict mode, suspense, profiler,
and context providers/consumers are deliberately skipped because debug DOM
attributes are not meaningful props for those contracts.

## Ownership rules

- Do not hand-author `data-ui-source` in application source.
- Do not use `data-ui-source` in CSS, tests, product behavior, analytics, or
  persistence.
- Do not expose absolute local filesystem paths; the loader normalizes to the
  repository-relative path.
- Do not move this instrumentation into production merely to support debugging.
- Stable product semantics still belong in component names, feature paths,
  `data-slot`, accessible roles/names, and typed domain contracts.

Implementation owner:

```text
scripts/dev/ui-source-trace-loader.cjs
next.config.ts -> turbopack.rules (development only)
```
