# HanziHome documentation

## Current source of truth

- [Current system architecture](architecture/current-system.md)
- [AI runtime and BYOK contract](architecture/ai-runtime-byok.md)
- [Daily Reading generation handoff](architecture/daily-reading-generation-handoff.md)
- [Supabase runtime source ADR](adr/0001-supabase-runtime-source.md)
- [Content ownership ADR](adr/0002-content-ownership.md)
- [UI primitive policy ADR](adr/0003-ui-primitive-policy.md)
- [Lesson resource boundaries ADR](adr/0004-lesson-resource-boundaries.md)
- [Contribution and verification workflow](../CONTRIBUTING.md)
- [Frontend user-flow coverage](testing/frontend-flow-coverage.md)
- [Repository skill inventory and audit scorecard](agent/skill-inventory.md)
- [Developer API v1 guide](developer-api.md)

## Active implementation plan

- [Immediate interaction, durable local-first learning and offline lesson cache](refactors/immediate-interaction-local-first.md)
  — approved scope, mandatory clean-code rules, checkpoint checklist and execution evidence.

## Historical product context

The documents under `docs/hanzihome/` describe earlier local JSON product directions. They remain useful for UX intent, but they do not override `AGENTS.md`, the current architecture, migrations, or runtime contracts.

## Historical implementation records

Apart from the explicitly active plan above, documents under `docs/refactors/` record named implementation checkpoints.
Their branch names, status lines, command results, and file lists describe
those checkpoints rather than the current checkout. Use `AGENTS.md`, the
current architecture documents above, current source, and migrations for
current behavior.
