---
name: frontend-feature-workflow
description: Resolve frontend state, query/cache ownership, feature boundaries and server/client architecture in chines-app. Use when investigating or changing these contracts. Do not use for styling, copy-only edits, isolated tests, or local fixes that preserve architecture.
metadata:
  author: chines-app
  compatibility: chines-app; npm; Node.js 22+; Next.js App Router; React; TypeScript; TanStack Query/Form/Store
  version: "3.0"
---

# Frontend Architecture Workflow

Use the affected sections of
[`frontend-structure.md`](../../../docs/architecture/frontend-structure.md) for
canonical boundaries and state ownership. Root and nearest `AGENTS.md` govern
scope, types, risk and verification; this skill is not general app preflight.

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

- navigation, locale or interface copy:
  [`i18n.md`](../../../docs/architecture/i18n.md);
- user flow or shared UI semantics:
  [`component-contracts.md`](../../../docs/ui/component-contracts.md);
- framework behavior: relevant installed `node_modules/next/dist/docs/` pages;
- high-risk mutation:
  [`risk-confirmation.md`](../../../docs/agent/risk-confirmation.md).

## Evidence

Use root verification tiers. Reproduce regressions at the lowest boundary that
still fails, then verify affected consumers. Shared migrations, breaking
contracts and release work require the full gate; an application-file edit
alone does not. UI/copy claims require the rendered evidence in their owning
docs. Report the owner, protected invariant and remaining limits alongside the
root handoff evidence.
