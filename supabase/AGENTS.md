# Supabase instructions

The repository root `AGENTS.md` remains authoritative.

- Every schema, policy, grant, function, trigger, or index change is a timestamped migration.
- State the exact local, branch, staging, or production target before applying a migration.
- Inspect migration drift, existing-row safety and lock/rewrite risk on populated tables before
  approval. Choose one executable rollback or forward-fix strategy and its forward verification.
- Handle existing rows and nullability before enforcing constraints. Prefer additive/backfill/enforce
  sequencing for populated tables; use transactions where partial application would be unsafe.
- Resolve identity from `auth.uid()`/server session; never trust a client owner ID.
- Verify ownership/editability and parent-child relationships inside policies, functions, or server routes.
- Stable IDs and foreign keys must cover editable parent-child relationships. Indexes must support
  the affected foreign-key, filter, order and policy predicates.
- Enable RLS where user data exists; grants must not bypass intended policy/RPC boundaries.
- Security-definer functions must set a safe search path and validate ownership.
- Normal node edits must not delete/reinsert child arrays.
- Multi-step destructive bulk operations require an explicit transaction and separately named action.
- After a migration, refresh `src/types/supabase.generated.ts` and affected Zod/API contracts.
  Schema/RLS/RPC or generated-contract changes require the full repository gate and relevant
  database checks; static checks alone do not prove a live environment.
- Report the environment actually touched. Production application, schema, auth, RLS, or data
  mutation requires explicit confirmation.
- Preserve `hanzihome_vocab_items` as the single canonical vocabulary parent.
  `hanzihome_vocab_examples` and `hanzihome_vocab_detail_sections` are canonical
  child tables; `hanzihome_lesson_sections.payload.items` is not a vocabulary
  store and MUST remain empty for vocabulary sections.
- Preserve active vocabulary uniqueness within a lesson by
  `(lesson_id, word, pinyin)`. Do not make vocabulary globally unique across
  lessons.

Migration review records the precedent/invariant, migration path, exact target and drift,
existing-row/nullability and lock risk, authorization/ownership and affected read/write contracts,
chosen rollback or forward-fix, and forward verification. Stop before mutation when target,
authorization, strategy or existing-row impact is unclear. Read-only review reports inspected
evidence without applying changes; credentialed probes are explicit live operations.
