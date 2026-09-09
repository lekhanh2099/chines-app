import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 createClient: vi.fn(),
 createUserApiKey: vi.fn(),
 deleteUserApiKey: vi.fn(),
 discoverApiKeyModels: vi.fn(),
 getUser: vi.fn(),
 getUserApiKeysSchemaStatus: vi.fn(),
 isUserApiKeysSchemaReady: vi.fn(),
 listActiveDailyReadingJobsForKey: vi.fn(),
 listAssignedTasksForKey: vi.fn(),
 listUserAiTaskAssignments: vi.fn(),
 listUserApiKeys: vi.fn(),
 moveUserApiKey: vi.fn(),
 probeApiKeyModel: vi.fn(),
 updateUserApiKey: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/features/settings/api-key-discovery.server", () => ({
 discoverApiKeyModels: mocks.discoverApiKeyModels,
 probeApiKeyModel: mocks.probeApiKeyModel,
}));
vi.mock("@/services/ai-task-routing.service", () => ({
 AiTaskStorageNotReadyError: class AiTaskStorageNotReadyError extends Error {},
 listAssignedTasksForKey: mocks.listAssignedTasksForKey,
 listUserAiTaskAssignments: mocks.listUserAiTaskAssignments,
}));
vi.mock("@/services/user-api-keys.service", () => ({
 createUserApiKey: mocks.createUserApiKey,
 deleteUserApiKey: mocks.deleteUserApiKey,
 getUserApiKeysSchemaStatus: mocks.getUserApiKeysSchemaStatus,
 isUserApiKeysSchemaReady: mocks.isUserApiKeysSchemaReady,
 listUserApiKeys: mocks.listUserApiKeys,
 moveUserApiKey: mocks.moveUserApiKey,
 updateUserApiKey: mocks.updateUserApiKey,
}));
vi.mock("@/features/daily-reading/daily-reading-enrichment-jobs.server", () => ({
 DailyReadingEnrichmentJobStorageError: class DailyReadingEnrichmentJobStorageError extends Error {},
 listActiveDailyReadingJobsForKey: mocks.listActiveDailyReadingJobsForKey,
}));

import { DELETE, PATCH, POST } from "./route";

function request(method: "POST" | "PATCH" | "DELETE", body: object) {
 return new NextRequest("https://app.example/api/settings/api-keys", {
  method,
  body: JSON.stringify(body),
 });
}

describe("API key assignment protection", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.isUserApiKeysSchemaReady.mockResolvedValue(true);
  mocks.listAssignedTasksForKey.mockResolvedValue(["conversation.reply", "lookup.deep"]);
  mocks.listActiveDailyReadingJobsForKey.mockResolvedValue([]);
 });

 it("returns the assigned task list instead of pausing the key", async () => {
  const response = await PATCH(
   request("PATCH", {
    action: "toggle",
    keyId: "11111111-1111-4111-8111-111111111111",
    isActive: false,
   }),
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
   code: "AI_KEY_ASSIGNED",
   taskIds: ["conversation.reply", "lookup.deep"],
  });
  expect(mocks.updateUserApiKey).not.toHaveBeenCalled();
 });

 it("returns the assigned task list instead of deleting the key", async () => {
  const response = await DELETE(
   request("DELETE", { keyId: "11111111-1111-4111-8111-111111111111" }),
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
   code: "AI_KEY_ASSIGNED",
   taskIds: ["conversation.reply", "lookup.deep"],
  });
  expect(mocks.deleteUserApiKey).not.toHaveBeenCalled();
 });

 it("returns the active Daily Reading job instead of pausing its snapshotted key", async () => {
  mocks.listAssignedTasksForKey.mockResolvedValue([]);
  mocks.listActiveDailyReadingJobsForKey.mockResolvedValue([
   {
    id: "22222222-2222-4222-8222-222222222222",
    runId: "33333333-3333-4333-8333-333333333333",
    taskId: "daily-reading.translation",
    module: "translation",
    status: "running",
   },
  ]);

  const response = await PATCH(
   request("PATCH", {
    action: "toggle",
    keyId: "11111111-1111-4111-8111-111111111111",
    isActive: false,
   }),
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
   code: "AI_KEY_ACTIVE_JOB",
   taskIds: [],
   jobs: [
    {
     runId: "33333333-3333-4333-8333-333333333333",
     jobId: "22222222-2222-4222-8222-222222222222",
     taskId: "daily-reading.translation",
     module: "translation",
     status: "running",
    },
   ],
  });
  expect(mocks.updateUserApiKey).not.toHaveBeenCalled();
 });

 it("does not persist a key when its selected model cannot generate content", async () => {
  mocks.discoverApiKeyModels.mockResolvedValue({
   ok: true,
   value: {
    provider: "gemini",
    providerLabel: "Google Gemini",
    models: ["models/gemini-3.5-flash"],
    recommendedModel: "models/gemini-3.5-flash",
   },
  });
  mocks.probeApiKeyModel.mockResolvedValue({ ok: false });

  const response = await POST(
   request("POST", {
    apiKey: "AIza-valid",
    label: "Gemini",
    provider: "gemini",
    model: "models/gemini-3.5-flash",
   }),
  );

  expect(response.status).toBe(400);
  expect(mocks.probeApiKeyModel).toHaveBeenCalledWith(
   "AIza-valid",
   "gemini",
   "models/gemini-3.5-flash",
   expect.any(AbortSignal),
  );
  expect(mocks.createUserApiKey).not.toHaveBeenCalled();
 });
});
