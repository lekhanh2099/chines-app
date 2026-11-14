import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: {
  url: "https://example.supabase.co",
  key: "test-publishable-key",
 },
}));

const authContext = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 verifyExpectedAuthenticatedOwner: vi.fn(),
}));

const repo = vi.hoisted(() => ({
 countPracticeAttempts: vi.fn(),
 listPracticeAttempts: vi.fn(),
 listRecentPracticeAttempts: vi.fn(),
 savePracticeAttempt: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", async (importOriginal) => {
 const actual = await importOriginal<typeof import("@/lib/api/authenticated-route")>();
 return {
  ...actual,
  requireAuthenticatedRoute: authContext.requireAuthenticatedRoute,
  verifyExpectedAuthenticatedOwner: authContext.verifyExpectedAuthenticatedOwner,
 };
});

vi.mock("@/features/hanzihome/practice/practice-attempt-repository.server", () => ({
 countPracticeAttempts: repo.countPracticeAttempts,
 listPracticeAttempts: repo.listPracticeAttempts,
 listRecentPracticeAttempts: repo.listRecentPracticeAttempts,
 savePracticeAttempt: repo.savePracticeAttempt,
}));

import { POST } from "./route";

const samplePayload = {
 attemptId: "af84c8d0-aa7f-4af7-a4b7-71ff6e887a35",
 surface: "review",
 contentId: "vocab:word-1",
 direction: null,
 answer: { kind: "review", itemType: "vocab", result: "known" },
 scorePercent: 100,
 responseMs: 1200,
};

function practicePostRequest(options?: { ownerHeader?: string; body?: object }) {
 const headers: Record<string, string> = {
  "Content-Type": "application/json",
 };
 if (options?.ownerHeader !== undefined) {
  headers["X-HanziHome-Owner-Id"] = options.ownerHeader;
 }

 return new Request("https://app.example/api/hanzihome/practice/attempts", {
  method: "POST",
  headers,
  body: JSON.stringify(options?.body ?? samplePayload),
 });
}

describe("POST /api/hanzihome/practice/attempts", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  authContext.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: {
    user: { id: "user-1" },
    supabase: {},
   },
  });
  authContext.verifyExpectedAuthenticatedOwner.mockReturnValue(null);
  repo.savePracticeAttempt.mockResolvedValue({
   id: "attempt-1",
   user_id: "user-1",
   attempt_id: samplePayload.attemptId,
   surface: "review",
   content_id: "vocab:word-1",
   direction: null,
   answer: samplePayload.answer,
   score_percent: 100,
   response_ms: 1200,
   created_at: "2026-08-20T00:00:00.000Z",
  });
 });

 it("rejects unauthenticated attempts", async () => {
  const { apiError } = await import("@/lib/api/authenticated-route");
  authContext.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: apiError("Unauthorized", 401, "UNAUTHORIZED"),
  });

  const response = await POST(practicePostRequest());

  expect(response.status).toBe(401);
  expect(repo.savePracticeAttempt).not.toHaveBeenCalled();
 });

 it("accepts requests without expected-owner header for backward compatibility", async () => {
  const response = await POST(practicePostRequest());

  expect(response.status).toBe(200);
  expect(authContext.verifyExpectedAuthenticatedOwner).not.toHaveBeenCalled();
  expect(repo.savePracticeAttempt).toHaveBeenCalledWith(samplePayload, "user-1");
 });

 it("verifies expected owner when header is present and proceeds on match", async () => {
  const response = await POST(practicePostRequest({ ownerHeader: "user-1" }));

  expect(response.status).toBe(200);
  expect(authContext.verifyExpectedAuthenticatedOwner).toHaveBeenCalledOnce();
  expect(repo.savePracticeAttempt).toHaveBeenCalledWith(samplePayload, "user-1");
 });

 it("rejects with 412 and does not save when owner header mismatches", async () => {
  const { apiError } = await import("@/lib/api/authenticated-route");
  authContext.verifyExpectedAuthenticatedOwner.mockReturnValue(
   apiError(
    "Request owner no longer matches the authenticated session",
    412,
    "AUTH_OWNER_MISMATCH",
   ),
  );

  const response = await POST(practicePostRequest({ ownerHeader: "user-2" }));

  expect(response.status).toBe(412);
  await expect(response.json()).resolves.toMatchObject({ code: "AUTH_OWNER_MISMATCH" });
  expect(repo.savePracticeAttempt).not.toHaveBeenCalled();
 });
});
