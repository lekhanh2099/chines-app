---
name: frontend-feature-workflow
description: Resolve state/query/cache ownership, feature boundaries, server/client architecture and requested CPU/render/network/resource performance investigations in chines-app. Skip styling, copy-only edits, isolated tests and local fixes that preserve these contracts and make no performance claim.
metadata:
  author: chines-app
  compatibility: chines-app; npm; Node.js 22+; Next.js App Router; React; TypeScript; TanStack Query/Form/Store
  version: "3.0"
---

# Frontend Architecture Workflow

Use the affected sections of
[`frontend-structure.md`](../../../docs/architecture/frontend-structure.md) for
canonical boundaries, test ownership and performance evidence. Root and nearest
`AGENTS.md` govern scope, types, risk and verification; this skill is not general
app preflight.

## Trace the owner

Follow the affected path from route/entry through feature, query/form/store,
service/API and authoritative schema to consumers. Identify the current owner,
the conflicting write/read path and the smallest boundary that reproduces the
problem. Include loading/empty/error behavior and external boundaries.

- Query/cache: inspect key variables, producer, consumers and invalidation;
  changing cache scope must not conceal a second state owner.
- Form/state: inspect the authoritative inputs and any explicit editable-draft
  or browser/subscription bridge before adding another state writer.
- Feature/shared boundary: inspect direct consumers and server/client imports
  before moving behavior. Routes stay thin; transport/domain behavior belongs
  to the existing feature owner.
- External data/IDs: inspect the existing owning validation/normalization
  boundary; do not add internal conversions to hide incompatible contracts.

Use the smallest coherent change that addresses the owner. Keep unrelated
categories and speculative shared abstractions outside the task.

## Concern-specific context

Read only when affected:

- responsibility/test separation or performance claims: sections 8 and 9 of
  [`frontend-structure.md`](../../../docs/architecture/frontend-structure.md);
- navigation, locale or interface copy:
  [`i18n.md`](../../../docs/architecture/i18n.md);
- user flow or shared UI semantics:
  [`component-contracts.md`](../../../docs/ui/component-contracts.md);
- framework behavior: relevant installed `node_modules/next/dist/docs/` pages;
- high-risk mutation:
  [`risk-confirmation.md`](../../../docs/agent/risk-confirmation.md).

## Evidence

Select the tier from [root verification](../../../AGENTS.md#6-working-method)
and the proof boundary from the linked concern owner. Report the traced owner,
protected invariant and remaining limits. Performance investigations use
[section 9](../../../docs/architecture/frontend-structure.md#9-performance-evidence)
for measurement and claim limits.
