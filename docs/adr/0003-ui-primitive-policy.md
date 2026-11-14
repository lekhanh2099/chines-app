# ADR 0003: Shared UI and overlay primitives

Status: accepted

## Decision

The configured shadcn `radix-nova` system and shared components under `src/components/ui/` own reusable visual recipes, focus behavior, and overlay layering. Feature code composes these primitives and must not introduce arbitrary z-index values or copied Button/Card/Select recipes.

Base UI remains allowed where an existing feature depends on its API, but its positioning and popup layers must be wrapped by a shared primitive. A Radix-to-Base migration is a separate explicit project, not incidental cleanup.

## Consequences

- Overlay layer changes are made once in shared primitives.
- Feature CSS expresses layout and state, not hidden design tokens.
- Keyboard, focus, scroll-lock, and nested-overlay behavior are verified when a primitive changes.
