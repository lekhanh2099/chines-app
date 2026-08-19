# Supabase instructions

The repository root `AGENTS.md` remains authoritative.

- Every schema, policy, grant, function, trigger, or index change is a timestamped migration.
- State the exact local, branch, staging, or production target before applying a migration.
- Inspect migration drift, existing-row safety, lock/rewrite risk, and choose either rollback or
  forward-fix before approval.
- Resolve identity from `auth.uid()`/server session; never trust a client owner ID.
- Verify ownership/editability and parent-child relationships inside policies, functions, or server routes.
- Normal node edits must not delete/reinsert child arrays.
- Multi-step destructive bulk operations require an explicit transaction and separately named action.
- After a migration, refresh `src/types/supabase.generated.ts` and run the relevant verification script.
- Report the environment actually touched. Production application, schema, auth, RLS, or data
  mutation requires explicit confirmation.
- Preserve `hanzihome_vocab_items` as the single canonical vocabulary parent.
  `hanzihome_vocab_examples` and `hanzihome_vocab_detail_sections` are canonical
  child tables; `hanzihome_lesson_sections.payload.items` is not a vocabulary
  store and MUST remain empty for vocabulary sections.
- Preserve active vocabulary uniqueness within a lesson by
  `(lesson_id, word, pinyin)`. Do not make vocabulary globally unique across
  lessons.
