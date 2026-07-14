# Supabase instructions

The repository root `AGENTS.md` remains authoritative.

- Every schema, policy, grant, function, trigger, or index change is a timestamped migration.
- Resolve identity from `auth.uid()`/server session; never trust a client owner ID.
- Verify ownership/editability and parent-child relationships inside policies, functions, or server routes.
- Normal node edits must not delete/reinsert child arrays.
- Multi-step destructive bulk operations require an explicit transaction and separately named action.
- After a migration, refresh `src/types/supabase.generated.ts` and run the relevant verification script.
