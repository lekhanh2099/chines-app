import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 getAiTaskRuntimePreviewsFromInventory: vi.fn(),
 getUserAiTaskRuntimePreview: vi.fn(),
 listUserAiTaskAssignments: vi.fn(),
 listUserApiKeys: vi.fn(),
 loadUserAiRuntimeInventory: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 upsertUserAiTaskAssignment: vi.fn(),
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
 listUserAiTaskAssignments: mocks.listUserAiTaskAssignments,
 upsertUserAiTaskAssignment: mocks.upsertUserAiTaskAssignment,
}));
vi.mock("@/services/user-api-keys.service", () => ({
 listUserApiKeys: mocks.listUserApiKeys,
}));
vi.mock("@/services/ai-runtime.service", async (importOriginal) => {
 const original = await importOriginal<typeof import("@/services/ai-runtime.service")>();
 return {
  ...original,
  getAiTaskRuntimePreviewsFromInventory: mocks.getAiTaskRuntimePreviewsFromInventory,
  getUserAiTaskRuntimePreview: mocks.getUserAiTaskRuntimePreview,
  loadUserAiRuntimeInventory: mocks.loadUserAiRuntimeInventory,
 };
});

import { GET, PUT } from "./route";

const key = {
 id: "11111111-1111-4111-8111-111111111111",
 userId: "user-1",
 provider: "groq",
 label: "Groq chính",
 maskedKey: "gsk_***",
 isActive: true,
 priority: 0,
 defaultModel: "openai/gpt-oss-20b",
 lastValidatedAt: "2026-08-26T00:00:00.000Z",
 createdAt: "2026-08-26T00:00:00.000Z",
 updatedAt: "2026-08-26T00:00:00.000Z",
};

const receipt = {
 taskId: "conversation.reply",
 provider: "groq",
 model: "openai/gpt-oss-20b",
 keyId: key.id,
 keyLabel: key.label,
 resolutionSource: "auto",
};

function put(body: object) {
 return PUT(
  new Request("https://app.example/api/settings/ai-tasks", {
   method: "PUT",
   body: JSON.stringify(body),
  }),
 );
}

describe("AI task settings route", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { scope: "session" }, user: { id: "user-1" } },
  });
  mocks.listUserAiTaskAssignments.mockResolvedValue([]);
  mocks.listUserApiKeys.mockResolvedValue([key]);
  mocks.loadUserAiRuntimeInventory.mockResolvedValue({
   storageIssue: null,
   activeKeys: [key],
   credentials: [{ id: key.id }],
  });
  mocks.getAiTaskRuntimePreviewsFromInventory.mockImplementation((_inventory, _assignments) =>
   [
    "conversation.reply",
    "lookup.quick",
    "lookup.deep",
    "daily-reading.translation",
    "daily-reading.vocabulary",
    "daily-reading.grammar",
    "daily-reading.questions",
    "conversation.summary",
    "conversation.memory-extraction",
    "conversation.semantic-memory",
   ].map((taskId) => ({
    taskId,
    status: "ready",
    reason: "ok",
    receipt: { ...receipt, taskId },
   })),
  );
  mocks.getUserAiTaskRuntimePreview.mockResolvedValue({
   taskId: "conversation.reply",
   status: "ready",
   reason: "ok",
   receipt: { ...receipt, resolutionSource: "assigned" },
  });
 });

 it("requires authentication before exposing task or key metadata", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await GET();

  expect(response.status).toBe(401);
  expect(mocks.listUserAiTaskAssignments).not.toHaveBeenCalled();
  expect(mocks.listUserApiKeys).not.toHaveBeenCalled();
 });

 it("returns the full catalog with Auto defaults and safe key options", async () => {
  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.tasks).toHaveLength(10);
  expect(body.tasks).toContainEqual(
   expect.objectContaining({
    id: "conversation.reply",
    assignment: {
     taskId: "conversation.reply",
     mode: "auto",
     keyId: null,
     model: null,
    },
   }),
  );
  expect(body.keys[0]).toMatchObject({
   keyId: key.id,
   provider: "groq",
   label: key.label,
   maskedKey: key.maskedKey,
   availability: "ready",
  });
  expect(JSON.stringify(body)).not.toContain("apiKey");
  expect(JSON.stringify(body)).not.toContain("encryptedKey");
 });

 it("saves one compatible active owned key and exact model assignment", async () => {
  const assignment = {
   taskId: "conversation.reply",
   mode: "assigned",
   keyId: key.id,
   model: "openai/gpt-oss-20b",
  };
  mocks.upsertUserAiTaskAssignment.mockResolvedValue(assignment);

  const response = await put(assignment);

  expect(response.status).toBe(200);
  expect(mocks.upsertUserAiTaskAssignment).toHaveBeenCalledWith("user-1", assignment);
  await expect(response.json()).resolves.toEqual({
   assignment,
   runtimePreview: {
    taskId: "conversation.reply",
    status: "ready",
    reason: "ok",
    receipt: { ...receipt, resolutionSource: "assigned" },
   },
  });
 });

 it("rejects a key outside the authenticated user's inventory", async () => {
  const response = await put({
   taskId: "lookup.quick",
   mode: "assigned",
   keyId: "22222222-2222-4222-8222-222222222222",
   model: "openai/gpt-oss-20b",
  });

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toMatchObject({ code: "AI_KEY_NOT_FOUND" });
  expect(mocks.upsertUserAiTaskAssignment).not.toHaveBeenCalled();
 });
});
