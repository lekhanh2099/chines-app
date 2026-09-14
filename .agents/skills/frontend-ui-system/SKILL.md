---
name: frontend-ui-system
description: Implement or review UI composition, interaction, responsive layout, accessibility and design-system ownership in chines-app. Use when these UI contracts change; skip copy-only edits and nonvisual logic that preserves them.
metadata:
  author: chines-app
  compatibility: chines-app local shadcn-style components; Tailwind CSS 4; Radix and Base UI wrappers; TanStack Query/Form/Store
  version: "4.0"
---

# Frontend UI System

Local primitives and product contracts own the UI. This skill selects the
relevant guidance; root and nearest `AGENTS.md` govern scope, types, risk and
verification.

## Select the contract

Read only affected sections; do not load the entire UI library of documents:

| Concern | Canonical source |
| --- | --- |
| Primitive choice, props, visual ownership, flow, touch/keyboard behavior, responsive shell or learner typography | [component-contracts.md](../../../docs/ui/component-contracts.md) |
| Whether a component/pattern exists or is deferred | [component-inventory.md](../../../docs/ui/component-inventory.md) |
| Theme, palette, brand hierarchy or Hanzi Studio visual reference | [theme-contract.md](../../../docs/ui/theme-contract.md) |
| Rendered states, viewports and interaction evidence | [ui-verification.md](../../../docs/ui/ui-verification.md) |
| Interface copy, locale or navigation | [i18n.md](../../../docs/architecture/i18n.md) |
| State ownership or feature/shared boundary change | [frontend-structure.md](../../../docs/architecture/frontend-structure.md) |

## Apply the existing owner

Start with the user's task and the existing rendered surface. Locate the local
primitive, pattern or feature composition and inspect its source/consumers.
Decide whether to use it, extend its semantic API, or identify a missing
contract. Do not turn a styling request into a flow or design-system rewrite.

The component contract owns flow/redesign constraints, density, scroll,
responsive overlays and learner typography. The theme contract owns the pinned
Hanzi Studio reference. When source/reference APIs differ, preserve visual
hierarchy through the existing chines-app owner rather than copying a second
primitive system.

Classify a visual recipe as primitive-owned, token-owned, brand/system,
stable feature composition, legitimate local exception or ad-hoc debt before
changing its owner. Upstream shadcn material is relevant only to requested
registry/upstream work; local component use does not require it.

## Verification

Apply the root tier and the affected portions of `ui-verification.md`. A visual
claim requires rendering at the affected state/viewport; broaden only when
responsive behavior or shared consumers are affected. Use repository UI/source
checks where applicable. Interface copy and theme work retain their dedicated
rendered checks in the linked owners. Report actual routes/viewports/states and
any unavailable authenticated rendering; a build or source inspection does not
prove visual correctness.
