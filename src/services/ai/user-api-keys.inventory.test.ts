import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/security/encryption", async (importOriginal) => ({
 ...(await importOriginal<typeof import("@/lib/security/encryption")>()),
 isByokEncryptionConfigured: () => true,
 decryptApiKey: (value: string) => `decrypted:${value}`,
}));

import { loadUserAiRuntimeInventory } from "./ai-runtime.service";

const ownerId = "00000000-0000-4000-8000-000000000001";
const keyRow = {
 id: "11111111-1111-4111-8111-111111111111",
 user_id: ownerId,
 provider: "groq",
 label: "Groq",
 masked_key: "gsk_***",
 encrypted_key: "cipher",
 is_active: true,
 priority: 0,
 default_model: "openai/gpt-oss-20b",
 last_validated_at: null,
 created_at: "2026-08-19T00:00:00.000Z",
 updated_at: "2026-08-19T00:00:00.000Z",
};

describe("loadUserAiRuntimeInventory", () => {
 afterEach(() => vi.unstubAllGlobals());

 it("reads user_api_keys once, scoped to the owner, for schema status, keys and credentials", async () => {
  const requests: string[] = [];
  vi.stubGlobal(
   "fetch",
   vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    requests.push(`${url.pathname}?${url.searchParams.toString()}`);
    return Response.json([keyRow]);
   }),
  );
  const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
   auth: { autoRefreshToken: false, persistSession: false },
  });

  const inventory = await loadUserAiRuntimeInventory(supabase, ownerId);

  const keyReads = requests.filter((request) => request.startsWith("/rest/v1/user_api_keys"));
  expect(keyReads).toHaveLength(1);
  expect(keyReads[0]).toContain(`user_id=eq.${ownerId}`);
  expect(inventory).toMatchObject({
   storageIssue: null,
   activeKeys: [{ id: keyRow.id }],
   credentials: [{ id: keyRow.id, apiKey: "decrypted:cipher" }],
  });
 });
});
