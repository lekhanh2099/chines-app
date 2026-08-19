import fs from "node:fs";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
 "supabase/migrations/20260809153503_add_integration_api_v1.sql",
 "utf8",
);

describe("integration API migration", () => {
 it("keeps integration secrets and privileged bridges server-only", () => {
  expect(migration).toContain("alter table public.integration_api_keys enable row level security;");
  expect(migration).toContain(
   "alter table public.integration_api_tts_windows enable row level security;",
  );
  expect(migration).toContain(
   "revoke all on table public.integration_api_keys from public, anon, authenticated;",
  );
  expect(migration).toContain(
   "revoke all on table public.integration_api_tts_windows from public, anon, authenticated;",
  );
  expect(migration).toContain("and api_key.revoked_at is null");
  expect(migration).toContain("Integration API key does not have the required scope");
  expect(migration).toContain("HanziHome editor role is required");
  expect(migration).toContain("Only soft_delete and restore are available to integration API keys");
  expect(migration).toContain(
   "revoke all on function private.integration_api_require_actor(uuid, text, boolean)",
  );
  expect(migration).toContain(
   "revoke all on function private.integration_api_set_actor(uuid, text, boolean)",
  );
  expect(migration).toContain(
   "grant execute on function private.integration_api_require_actor(uuid, text, boolean)",
  );
  expect(migration).toContain(
   "grant execute on function private.integration_api_set_actor(uuid, text, boolean)",
  );
  expect(migration).toContain("or quota_window.request_count < 10");
  expect(migration).toContain("to service_role;");
  expect(migration).not.toContain("to authenticated;");
 });
});
