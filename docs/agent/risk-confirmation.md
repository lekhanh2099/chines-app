# Risk and Confirmation Policy

The goal is not to ask permission for every edit. The goal is to stop before
changes whose consequences are broad, destructive, ambiguous or difficult to
reverse.

## 1. Low risk — proceed

Examples:

- read-only audit;
- documentation;
- targeted tests;
- additive non-breaking primitive variant;
- accessibility attribute with no product behavior change;
- local refactor with proven consumers and tests;
- formatting and dead-import cleanup;
- baseline reporting that does not fail existing code.

Report the work after execution.

## 2. Medium risk — investigate and state risk before proceeding

Examples:

- changing state ownership inside one feature;
- changing a shared component in an additive way;
- migrating several consumers in one surface;
- changing menu keyboard behavior;
- changing Dialog placement/scroll behavior;
- renaming a legacy adapter with compatibility exports;
- changing query key or invalidation scope;
- changing persisted UI settings with an explicit migration.

Proceed only when:

- the requirement has one clear interpretation;
- affected consumers are known;
- rollback is clear;
- verification is executable.

Otherwise STOP AND CONFIRM.

## 3. High risk — mandatory confirmation

- dependency add/remove/major upgrade;
- shadcn overwrite;
- broad Radix/Base migration;
- breaking shared component API;
- global design-token change;
- repository-wide automated migration;
- route/public API contract change;
- persisted-state change without safe migration;
- DB schema, RLS, auth or production-data mutation;
- destructive replace-all persistence;
- deleting uncertain legacy/data compatibility code;
- commit, push, merge, force-push or PR creation;
- work that cannot be adequately verified.

## 4. Confirmation format

Use exactly one decision per block.

```text
CONFIRMATION REQUIRED

Decision:
The concrete choice the user must make.

Evidence:
Exact files, consumers, behavior and current contract.

Risk:
What can break and why.

Affected scope:
Routes, components, data, users or workflows.

Option A — smallest compatible change:
Scope, trade-off and verification.

Option B — broader cleaner migration:
Scope, trade-off and verification.

Recommendation:
Choose one option and explain why.

Rollback:
How the change can be reverted.

Verification:
Commands and UI flows that will prove the result.
```

Do not ask:

```text
This is risky. Should I continue?
```

Do ask:

```text
The current `Select` has two public import paths and 17 consumers.
Option A keeps a compatibility export and migrates one feature.
Option B deletes the legacy adapter and requires an atomic repository migration.
I recommend A because it is reversible and keeps this task scoped.
Confirm A or B.
```

## 5. No-confirmation anti-pattern

Do not request confirmation because:

- the source has not been inspected;
- the agent does not want to search consumers;
- a normal low-risk edit has several implementation details;
- a check can answer the uncertainty;
- the user already made the product decision.

Investigate first. Ask only for a decision that cannot be resolved safely from
the repository and task.
