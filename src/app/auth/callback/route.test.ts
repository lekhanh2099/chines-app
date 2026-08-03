import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession } = vi.hoisted(() => ({
 exchangeCodeForSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { exchangeCodeForSession } })),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
 beforeEach(() => {
  exchangeCodeForSession.mockReset();
 });

 it("rejects a callback without a code before contacting Supabase", async () => {
  const response = await GET(new Request("https://app.example/auth/callback?next=%2Fhanzihome"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example/login?authError=missing_code");
  expect(exchangeCodeForSession).not.toHaveBeenCalled();
 });

 it("exchanges the code and keeps a safe next path", async () => {
  exchangeCodeForSession.mockResolvedValue({ error: null });

  const response = await GET(
   new Request("https://app.example/auth/callback?code=code-1&next=%2Fhanzihome"),
  );

  expect(exchangeCodeForSession).toHaveBeenCalledWith("code-1");
  expect(response.headers.get("location")).toBe("https://app.example/hanzihome");
 });

 it("returns to login when code exchange fails", async () => {
  exchangeCodeForSession.mockResolvedValue({ error: new Error("expired") });

  const response = await GET(new Request("https://app.example/auth/callback?code=expired"));

  expect(response.headers.get("location")).toBe(
   "https://app.example/login?authError=code_exchange",
  );
 });

 it("does not redirect an exchanged session to an external origin", async () => {
  exchangeCodeForSession.mockResolvedValue({ error: null });

  const response = await GET(
   new Request("https://app.example/auth/callback?code=code-1&next=%2F%2Fevil.example"),
  );

  expect(response.headers.get("location")).toBe("https://app.example/");
 });
});
