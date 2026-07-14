# HanziHome historical product docs

> Superseded architecture: these documents preserve early local-JSON product direction. Current implementation rules live in `AGENTS.md`, `docs/architecture/current-system.md`, and `docs/adr/`.

This folder keeps the product direction for the HanziHome learning workspace.

## Documents

- `local-studio-prd.md`: historical PRD for the local JSON-first learning studio.
- `phase-next-prd.md`: historical local-first productization plan.

## Implementation Notes For This App

The current Next/Supabase app is not the local-only studio described in these PRDs. Treat them as UX context only; static data is not a runtime fallback.

Current implementation boundary:

1. Supabase normalized tables own runtime content.
2. Import artifacts are consumed only by explicit scripts.
3. Course → Book → Lesson → Module remains the study model.
4. User edits are stable-ID, field/node-level writes with explicit ownership.
