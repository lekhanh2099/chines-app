# UI/UX follow-up — Home responsive + themed Card surfaces

Date: 2026-08-11
Branch: `refactor/ui-system-ux-architecture`

## Trigger

Visual review on desktop and narrow mobile exposed four remaining issues:

1. Home used a wide two-column dashboard too early and placed Recent Notes + Recent Activity side by side on very wide screens, leaving a large dead zone below the first viewport.
2. The standalone `Học tiếp` heading created an awkward horizontal gap against the right rail.
3. Review history could expose opaque runtime/database IDs when a vocabulary label was not resolved.
4. Palette changes tinted the page canvas and active controls, but default Card surfaces stayed visually identical.

## Changes

### Home hierarchy

- Home content is capped at a readable `90rem` feature width while `PageContainer` remains fluid.
- Main content and attention rail split only at `xl`; iPad portrait and sidebar-constrained tablet widths stay in one document-flow column.
- Recent Notes and Recent Activity are stacked in the main column instead of being forced side by side.
- The desktop attention rail becomes sticky only once the two-column layout is safe.
- `Học tiếp` is now a self-contained ActionCard with its heading and continuation context inside the interactive surface.
- Home section headers wrap actions instead of letting narrow layouts starve title/description width.
- Recent Activity moves its status badge below the label on mobile.
- Home skeleton mirrors the final responsive structure to avoid loading-layout mismatch.

### Review activity labels

Vocabulary labels are resolved by both `runtimeId` and stable content `id`. If historical learning-state data cannot be resolved, Home uses a human-readable fallback (`Từ vựng đã ôn`, `Điểm ngữ pháp đã ôn`, `Bộ thủ đã ôn`) rather than exposing opaque internal IDs.

### Theme Card surface

Palette ownership now has three levels:

```text
canvas          -> visible restrained palette tint
Card primitive  -> weaker palette tint
active state    -> selected palette primary/accent
```

The new `--theme-card-background` token is consumed only by the shared Card primitive. Raw `--card`, generic `--bg-card`, outline controls, shell chrome, Popover/Dialog/input and borders remain neutral. This prevents theme color from leaking into every control while still making Card surfaces visibly belong to the selected palette.

### Mobile shell polish

Bottom navigation keeps 44px touch targets but uses the Typography `fine` scale for compact labels so `Ghi chú` no longer truncates unnecessarily on narrow phones.

## Guardrails updated

- `docs/ui/theme-contract.md` documents the Card-only palette token.
- `theme-contract.test.ts` verifies Card tint exists while neutral foundation aliases remain untouched.
- `.agents/skills/frontend-ui-system/SKILL.md` is updated to v3.10 with Home dead-zone, sidebar-constrained tablet, mobile list-row and Card-theme rules.

## Verification target

Visual verification should cover:

- narrow phone (~390px);
- iPad portrait (~820px);
- sidebar-constrained landscape/tablet (~1024–1180px);
- desktop (1440px+);
- light and dark mode;
- at least Editorial, Jade/Tea and Plum palettes;
- long note titles and unresolved historical review IDs;
- bottom navigation label fit and full-route access through `Thêm`.
