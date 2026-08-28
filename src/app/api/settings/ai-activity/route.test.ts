import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 clearUserAiActivityEvents: vi.fn(),
 listUserAiActivityEvents: vi.fn(),
 listUserAiActivitySummary: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: object, init?: ResponseInit) => Response.json(body, init),
}));
vi.mock("@/services/ai-task-routing.service", () => ({
 AiTaskStorageNotReadyError: class AiTaskStorageNotReadyError extends Error {},
 clearUserAiActivityEvents: mocks.clearUserAiActivityEvents,
 listUserAiActivityEvents: mocks.listUserAiActivityEvents,
 listUserAiActivitySummary: mocks.listUserAiActivitySummary,
}));

import { DELETE, GET } from "./route";

describe("AI activity settings route", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { user: { id: "user-1" } },
  });
  mocks.listUserAiActivityEvents.mockResolvedValue({ events: [], nextCursor: null });
  mocks.listUserAiActivitySummary.mockResolvedValue([]);
  mocks.clearUserAiActivityEvents.mockResolvedValue(undefined);
 });

 it("requires authentication before reading activity", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await GET(new Request("https://app.example/api/settings/ai-activity"));

  expect(response.status).toBe(401);
  expect(mocks.listUserAiActivityEvents).not.toHaveBeenCalled();
 });

 it("validates cursor pairs before querying storage", async () => {
  const response = await GET(
   new Request(
    "https://app.example/api/settings/ai-activity?cursorId=11111111-1111-4111-8111-111111111111",
   ),
  );

  expect(response.status).toBe(400);
  expect(mocks.listUserAiActivityEvents).not.toHaveBeenCalled();
 });

 it("passes safe task, provider, status and cursor filters with a fixed page contract", async () => {
  const response = await GET(
   new Request(
    "https://app.example/api/settings/ai-activity?taskId=lookup.quick&provider=gemini&status=success&cursorCreatedAt=2026-08-26T00%3A00%3A00.000Z&cursorId=11111111-1111-4111-8111-111111111111",
   ),
  );

  expect(response.status).toBe(200);
  expect(mocks.listUserAiActivityEvents).toHaveBeenCalledWith({
   userId: "user-1",
   taskId: "lookup.quick",
   provider: "gemini",
   status: "success",
   cursor: {
    createdAt: "2026-08-26T00:00:00.000Z",
    id: "11111111-1111-4111-8111-111111111111",
   },
  });
  expect(mocks.listUserAiActivitySummary).toHaveBeenCalledWith({
   userId: "user-1",
   taskId: "lookup.quick",
   provider: "gemini",
  });
 });

 it("clears only the authenticated user's activity", async () => {
  const response = await DELETE();

  expect(response.status).toBe(200);
  expect(mocks.clearUserAiActivityEvents).toHaveBeenCalledWith("user-1");
  await expect(response.json()).resolves.toEqual({ success: true });
 });
});
