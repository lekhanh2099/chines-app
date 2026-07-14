---
name: hanzihome-code-standardization
description: Standardize HanziHome source changes across React, TypeScript, data loading, forms, state ownership, edit contracts, and verification. Use when a task mentions refactoring, cleanup, architecture, code quality, hooks, TanStack Query, TanStack Form, Zod schemas, Supabase routes, editable content, renderer flow, or preventing Codex from adding inconsistent code patterns.
---

# HanziHome Code Standardization

## Overview

Use this skill before non-trivial HanziHome source edits. It turns `AGENTS.md` into a concrete workflow: identify the code surface, preserve the study flow, keep data/state ownership clear, and verify the exact behavior touched.

## Preflight

Start with the repo contract and current state:

```bash
sed -n '1,780p' AGENTS.md
git status --short
```

Then classify the request before editing:

- Study render
- Debug/audit render
- Edit UI
- API route
- DB/Supabase persistence
- Import/normalization
- Data loading/query/cache
- General React/TypeScript cleanup

If the task is visual/design-token work, also read `.codex/skills/hanzihome-ui-system-audit/SKILL.md`. If it touches shadcn components or `components.json`, also read `.agents/skills/shadcn/SKILL.md`.

## Source Map

Use the existing ownership boundaries instead of inventing a new layer:

- Route pages compose feature components and stay thin.
- Feature state lives under `src/features/hanzihome/context`, local hooks, or existing stores.
- Query/data contracts live in hooks, repositories, schemas, or route handlers, not in route pages.
- Edit UI flows through `src/features/hanzihome/editing` adapters, forms, wrappers, and direct-save helpers.
- Renderers stay shaped by their lesson/resource data and must not mutate props.
- Static JSON is seed/fallback content and must not be mutated by app routes.

## Implementation Rules

Prefer small, boring changes:

- Read current call sites before changing a component, hook, schema, or route.
- Keep strong types at the edge. Use `unknown` plus schema/helper parsing for raw data instead of spreading `any`.
- Do not store derived data in React state. Compute it from query/store/form state.
- Keep loading, empty, error, disabled, and stale states explicit.
- Use stable TanStack Query keys that include every variable affecting returned data.
- Invalidate the smallest correct query scope after mutations.
- Use TanStack Form + Zod for non-trivial editable forms.
- Save the smallest editable field/node. Never replace child arrays for normal edits.
- Verify ownership and parent-child relationships server-side in API routes.
- Do not mix UI redesign, data migration, and backend persistence in one cleanup unless the user explicitly asks.

## Stop Conditions

Stop and ask before coding when:

- The change would mutate static JSON from the app.
- Seed DB editing policy is unclear.
- A normal small edit would require delete/reinsert of child rows.
- A dashboard/library screen would fetch full lesson/content detail.
- Exercise or renderer shape is unknown and cannot be inspected.
- A DB schema change is needed but no migration is part of the task.
- The requested change would break Study Mode.

## Verification

For app-code changes, run the required checks from `AGENTS.md`:

```bash
npm run check
```

Husky runs the same command before commit, and GitHub Actions uses it as the shared CI gate.
Do not bypass the hook unless the user explicitly authorizes an emergency exception.

Add targeted checks when relevant:

- Import/parser/data changes: run the relevant `data:hanzihome:*` script from `package.json`.
- Query or UI state changes: manually inspect first render, loading, empty, error, and selected-item state.
- Renderer changes: inspect exact source payload shape and a representative lesson/module.
- Edit changes: verify one field/node save does not touch sibling nodes.

## Report Format

End with the contract you preserved, files changed, checks run, and any unsupported shapes or residual risks.
