# Migration review checklist

- Reproducible timestamped migration; no dashboard-only drift.
- Existing rows and nullability handled before constraints are enforced.
- Exact target environment and current migration drift recorded before apply.
- Lock/rewrite risk classified for populated tables.
- Stable IDs and foreign keys cover every editable parent-child relation.
- RLS is enabled where user data exists; policies use authenticated identity.
- Grants do not bypass intended RPC/policy boundaries.
- Security-definer functions set a safe search path and validate ownership.
- Indexes support new foreign-key, filter, order, and policy predicates.
- No normal edit route deletes/reinserts sibling arrays.
- Generated types and Zod network schemas refreshed.
- Local/remote target and production-write authorization are explicit.
- Forward verification and one executable rollback or forward-fix strategy are documented.
- Live environment actually touched is reported; production authorization is explicit.
