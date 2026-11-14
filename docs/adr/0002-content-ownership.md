# ADR 0002: Content ownership and editing

Status: accepted

## Decision

Built-in seed rows remain shared. User-created rows are custom content. A normal user edit of shared seed content must use an explicit copy-on-write user override; direct seed edits are admin-only and require server-side authorization.

Normal edit routes accept a stable entity ID and node-owned fields only. They verify the session identity, ownership/editability, and parent relationship before writing.

## Consequences

- The client never supplies a trusted owner ID.
- Small edits are single-row or smallest-node updates.
- Replace-all child operations require a separately named bulk action, explicit UI copy, and a transaction.
