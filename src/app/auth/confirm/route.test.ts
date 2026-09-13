import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyOtp } = vi.hoisted(() => ({ verifyOtp: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { verifyOtp } })),
}));

import { GET } from "./route";

describe("GET /auth/confirm", () => {
 beforeEach(() => {
  verifyOtp.mockReset();
 });

 it("rejects malformed confirmation links before token verification", async () => {
  const response = await GET(
   new Request("https://app.example/auth/confirm?token_hash=token&type=unknown"),
  );

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
   "https://app.example/vi/login?authError=invalid_confirmation",
  );
  expect(verifyOtp).not.toHaveBeenCalled();
 });

 it("verifies a signup token and preserves a safe next path", async () => {
  verifyOtp.mockResolvedValue({ error: null });

  const response = await GET(
   new Request("https://app.example/auth/confirm?token_hash=token&type=signup&next=%2Fhanzihome"),
  );

  expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "token", type: "signup" });
  expect(response.headers.get("location")).toBe("https://app.example/hanzihome");
 });

 it("does not redirect outside the app after verification", async () => {
  verifyOtp.mockResolvedValue({ error: null });

  const response = await GET(
   new Request(
    "https://app.example/auth/confirm?token_hash=token&type=signup&next=%2F%2Fevil.test",
   ),
  );

  expect(response.headers.get("location")).toBe("https://app.example/");
 });

 it("returns to login when token verification fails", async () => {
  verifyOtp.mockResolvedValue({ error: new Error("expired") });

  const response = await GET(
   new Request("https://app.example/auth/confirm?token_hash=expired&type=signup"),
  );

  expect(response.headers.get("location")).toBe(
   "https://app.example/vi/login?authError=confirmation_failed",
  );
 });

 it("preserves the session-limit reason after email verification", async () => {
  verifyOtp.mockResolvedValue({ error: new Error("HANZIHOME_SESSION_LIMIT_REACHED") });
  const response = await GET(
   new Request("https://app.example/auth/confirm?token_hash=limited&type=magiclink&next=%2Fzh-CN"),
  );
  expect(response.headers.get("location")).toBe(
   "https://app.example/zh-CN/login?authError=session_limit",
  );
 });
});
