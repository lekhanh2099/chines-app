import { describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.hoisted(() => vi.fn(() => ({ marker: "browser-client" })));

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: {
  url: "https://example.supabase.co",
  key: "publishable-test-key",
 },
}));

import { createClient } from "./client";

describe("browser Supabase client", () => {
 it("reuses one client so auth listeners and login/logout flows share one session source", () => {
  const first = createClient();
  const second = createClient();

  expect(first).toBe(second);
  expect(createBrowserClient).toHaveBeenCalledOnce();
  expect(createBrowserClient).toHaveBeenCalledWith(
   "https://example.supabase.co",
   "publishable-test-key",
  );
 });
});
