# Migration review checklist

- Reproducible timestamped migration; no dashboard-only drift.
- Existing rows and nullability handled before constraints are enforced.
- Stable IDs and foreign keys cover every editable parent-child relation.
- RLS is enabled where user data exists; policies use authenticated identity.
- Grants do not bypass intended RPC/policy boundaries.
- Security-definer functions set a safe search path and validate ownership.
- Indexes support new foreign-key, filter, order, and policy predicates.
- No normal edit route deletes/reinserts sibling arrays.
- Generated types and Zod network schemas refreshed.
- Local/remote target and production-write authorization are explicit.
- Forward verification and rollback/forward-fix plan are documented.
