import { describe, expect, it, vi } from "vitest";

import { getClientSessionUser } from "./client-session";

describe("getClientSessionUser", () => {
 it("returns null when the browser has no session", async () => {
  const supabase = {
   auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
   },
  } satisfies Parameters<typeof getClientSessionUser>[0];

  await expect(getClientSessionUser(supabase)).resolves.toBeNull();
 });

 it("fails closed when the session probe cannot reach Supabase", async () => {
  const getSession = vi.fn(async () => {
   throw new TypeError("Failed to fetch");
  });
  const supabase = {
   auth: { getSession },
  } satisfies Parameters<typeof getClientSessionUser>[0];

  await expect(getClientSessionUser(supabase)).resolves.toBeNull();
  expect(getSession).toHaveBeenCalledOnce();
 });
});
