# UI micro-consistency audit — border, radius, focus, spacing

Date: 2026-08-12

## Scope

Final design-system pass focused on the details that make otherwise-correct screens feel inconsistent: border hierarchy, radius scale, focus/ring treatment, overlay layering and component spacing rhythm.

## Changes

- Standardized control geometry around `rounded-lg` and Card/panel/overlay geometry around `rounded-xl`.
- Removed feature-owned `rounded-2xl`, `rounded-3xl`, arbitrary radii and 2px+ borders from the audited application surface.
- Kept pill geometry only for semantic pill controls/status such as Badge, Chip, Switch and Radio; Checkbox retains its compact owner-defined square radius.
- Centralized focus-visible and focus-within recipes in `src/components/ui/focus-ring.ts` and migrated form controls plus audited custom focus surfaces to the shared contract.
- Normalized structural borders to 1px `border-border-default`, form control borders to `border-input`, and semantic borders to semantic state tokens.
- Normalized overlay layers: modal backdrop `100`, modal content `101`, menu/select/popover/floating content `120`, tooltip `130`.
- Removed dark-mode hard-coded active text color so active controls inherit the selected palette through `--primary`.
- Converted component/sibling rhythm from child margins and `space-x/space-y` to parent `gap` and container padding across Home, Settings, forms, Notes, Dictionary, HanziHome, Notebook, search, listening and review surfaces.
- Retained auto margins as alignment mechanics and a narrow inline-text exception for horizontal separation where no layout parent can own a `gap`.
- Tightened `scripts/check-ui-standards.mjs` to prevent regression for fixed-margin composition, `space-x/space-y`, feature-owned rings, thick borders, arbitrary/oversized radii, while avoiding broad rules that would reject legitimate stable feature composition.
- Updated `frontend-ui-system` to v3.11 plus component and verification contracts with the final micro-geometry rules.

## Design contract

```text
control / input / select / menu item -> rounded-lg
card / panel / popover / dialog      -> rounded-xl
pill semantics                       -> rounded-full
structural/card border               -> 1px border-border-default
form control border                  -> 1px border-input
focus                                -> shared owner/helper
sibling spacing                      -> parent gap / container padding
```

## Verification

The authoritative completion gate is the pull-request `npm run check` run on the final branch HEAD after this log is committed. Browser screenshots remain the source of truth for purely visual perception, while the UI guard prevents the audited geometry/spacing patterns from drifting back into source.
