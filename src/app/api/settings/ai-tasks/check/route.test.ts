import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 generateAiConversationMemoryEmbedding: vi.fn(),
 getAiRuntimeReceipt: vi.fn(),
 probeApiKeyModel: vi.fn(),
 recordUserAiRuntimeActivity: vi.fn(),
 recordUserAiTaskBlockedActivity: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 resolveUserAiTaskRuntime: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: object, init?: ResponseInit) => Response.json(body, init),
}));
vi.mock("@/features/settings/api-key-discovery.server", () => ({
 probeApiKeyModel: mocks.probeApiKeyModel,
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-embedding.server", () => ({
 generateAiConversationMemoryEmbedding: mocks.generateAiConversationMemoryEmbedding,
}));
vi.mock("@/services/ai-runtime.service", () => ({
 getAiRuntimeReceipt: mocks.getAiRuntimeReceipt,
 recordUserAiRuntimeActivity: mocks.recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity: mocks.recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime: mocks.resolveUserAiTaskRuntime,
}));

import { POST } from "./route";

const receipt = {
 taskId: "lookup.deep",
 provider: "gemini",
 model: "models/gemini-3.5-flash",
 keyId: "11111111-1111-4111-8111-111111111111",
 keyLabel: "Gemini",
 resolutionSource: "assigned",
};
const runtime = {
 ...receipt,
 providerLabel: "Google Gemini",
 label: "Gemini",
 maskedKey: "AIza***",
 priority: 0,
 apiKey: "secret",
 capabilities: ["lookup"],
};
const semanticReceipt = {
 ...receipt,
 taskId: "conversation.semantic-memory",
 model: "gemini-embedding-001",
};
const semanticRuntime = {
 ...runtime,
 ...semanticReceipt,
 capabilities: ["semantic-memory"],
};

function post(taskId: string) {
 return POST(
  new Request("https://app.example/api/settings/ai-tasks/check", {
   method: "POST",
   body: JSON.stringify({ taskId }),
  }),
 );
}

describe("AI task runtime check route", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { scope: "session" }, user: { id: "user-1" } },
  });
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime });
  mocks.getAiRuntimeReceipt.mockReturnValue(receipt);
  mocks.probeApiKeyModel.mockResolvedValue({ ok: true });
  mocks.recordUserAiRuntimeActivity.mockResolvedValue(undefined);
 });

 it("probes only the resolved generative runtime and records a probe activity", async () => {
  const response = await post("lookup.deep");

  expect(response.status).toBe(200);
  expect(mocks.probeApiKeyModel).toHaveBeenCalledWith(
   "secret",
   "gemini",
   "models/gemini-3.5-flash",
  );
  expect(mocks.recordUserAiRuntimeActivity).toHaveBeenCalledWith(
   expect.objectContaining({
    userId: "user-1",
    runtime,
    status: "success",
    resourceType: "ai-runtime-check",
   }),
  );
  await expect(response.json()).resolves.toMatchObject({ ok: true, receipt });
 });

 it("does not fallback or probe when the assigned task runtime is blocked", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({
   ok: false,
   status: "task-disabled",
   reason: "task-disabled",
  });

  const response = await post("lookup.deep");

  expect(response.status).toBe(200);
  expect(mocks.probeApiKeyModel).not.toHaveBeenCalled();
  expect(mocks.recordUserAiTaskBlockedActivity).toHaveBeenCalledWith({
   userId: "user-1",
   taskId: "lookup.deep",
   errorCode: "task-disabled",
   resourceType: "ai-runtime-check",
  });
  await expect(response.json()).resolves.toMatchObject({ ok: false, errorCode: "task-disabled" });
 });

 it("uses the embedding probe for semantic memory", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime: semanticRuntime });
  mocks.getAiRuntimeReceipt.mockReturnValue(semanticReceipt);
  mocks.generateAiConversationMemoryEmbedding.mockResolvedValue({
   available: true,
   values: [],
  });

  const response = await post("conversation.semantic-memory");

  expect(response.status).toBe(200);
  expect(mocks.generateAiConversationMemoryEmbedding).toHaveBeenCalledWith({
   supabase: { scope: "session" },
   userId: "user-1",
   text: "HanziHome runtime check",
   task: "RETRIEVAL_QUERY",
   resourceType: "ai-runtime-check",
   runtime: semanticRuntime,
  });
  expect(mocks.probeApiKeyModel).not.toHaveBeenCalled();
 });
});
