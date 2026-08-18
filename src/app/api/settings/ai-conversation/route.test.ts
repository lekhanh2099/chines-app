import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 createClient,
 loadAiConversationSettingsOverview,
 listAiConversationManagedMemories,
 updateAiConversationAccountPreferences,
 editAiConversationManagedMemory,
 resolveAiConversationManagedOpenLoop,
 forgetAiConversationManagedMemory,
} = vi.hoisted(() => ({
 createClient: vi.fn(),
 loadAiConversationSettingsOverview: vi.fn(),
 listAiConversationManagedMemories: vi.fn(),
 updateAiConversationAccountPreferences: vi.fn(),
 editAiConversationManagedMemory: vi.fn(),
 resolveAiConversationManagedOpenLoop: vi.fn(),
 forgetAiConversationManagedMemory: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/features/settings/ai-conversation-settings-persistence.server", async () => {
 const actual = await vi.importActual<
  typeof import("@/features/settings/ai-conversation-settings-persistence.server")
 >("@/features/settings/ai-conversation-settings-persistence.server");
 return {
  ...actual,
  loadAiConversationSettingsOverview,
  listAiConversationManagedMemories,
  updateAiConversationAccountPreferences,
  editAiConversationManagedMemory,
  resolveAiConversationManagedOpenLoop,
  forgetAiConversationManagedMemory,
 };
});

import { DELETE, GET, PATCH, PUT } from "./route";

const userId = "11111111-1111-4111-8111-111111111111";
const memoryId = "33333333-3333-4333-8333-333333333333";
const preferences = {
 defaultMode: "natural" as const,
 defaultCorrectionStyle: "balanced" as const,
 defaultReplyMode: "adaptive" as const,
 learnerLevel: "intermediate" as const,
 memoryEnabled: true,
};

function authenticatedClient() {
 return {
  auth: {
   getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }),
  },
 };
}

describe("Phase 6 AI settings route", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue(authenticatedClient());
 });

 it("loads only overview on the base GET", async () => {
  loadAiConversationSettingsOverview.mockResolvedValue({
   preferences,
   character: null,
   relationship: null,
  });

  const response = await GET(new NextRequest("http://localhost/api/settings/ai-conversation"));

  expect(response.status).toBe(200);
  expect(loadAiConversationSettingsOverview).toHaveBeenCalledWith(userId);
  expect(listAiConversationManagedMemories).not.toHaveBeenCalled();
 });

 it("loads memories only when the memory resource is requested", async () => {
  listAiConversationManagedMemories.mockResolvedValue([]);

  const response = await GET(
   new NextRequest("http://localhost/api/settings/ai-conversation?resource=memories"),
  );

  expect(response.status).toBe(200);
  expect(listAiConversationManagedMemories).toHaveBeenCalledWith(userId);
  expect(loadAiConversationSettingsOverview).not.toHaveBeenCalled();
 });

 it("rejects invalid account preference payloads before persistence", async () => {
  const response = await PUT(
   new NextRequest("http://localhost/api/settings/ai-conversation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...preferences, learnerLevel: "expert" }),
   }),
  );

  expect(response.status).toBe(400);
  expect(updateAiConversationAccountPreferences).not.toHaveBeenCalled();
 });

 it("updates account defaults through the authenticated user id", async () => {
  updateAiConversationAccountPreferences.mockResolvedValue(preferences);
  const response = await PUT(
   new NextRequest("http://localhost/api/settings/ai-conversation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
   }),
  );

  expect(response.status).toBe(200);
  expect(updateAiConversationAccountPreferences).toHaveBeenCalledWith({ userId, preferences });
 });

 it("routes edit and resolve as distinct memory mutations", async () => {
  editAiConversationManagedMemory.mockResolvedValue({
   id: memoryId,
   characterId: null,
   characterName: null,
   kind: "preference",
   content: "我喜欢排球。",
   updatedAt: "2026-08-18T08:00:00+00:00",
  });
  resolveAiConversationManagedOpenLoop.mockResolvedValue({ memoryId, resolved: true });

  const editResponse = await PATCH(
   new NextRequest("http://localhost/api/settings/ai-conversation", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "edit", memoryId, content: "我喜欢排球。" }),
   }),
  );
  const resolveResponse = await PATCH(
   new NextRequest("http://localhost/api/settings/ai-conversation", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "resolve", memoryId }),
   }),
  );

  expect(editResponse.status).toBe(200);
  expect(resolveResponse.status).toBe(200);
  expect(editAiConversationManagedMemory).toHaveBeenCalledWith({
   userId,
   memoryId,
   content: "我喜欢排球。",
  });
  expect(resolveAiConversationManagedOpenLoop).toHaveBeenCalledWith({ userId, memoryId });
 });

 it("forgets one memory only through an explicit DELETE", async () => {
  forgetAiConversationManagedMemory.mockResolvedValue({ memoryId, forgotten: true });

  const response = await DELETE(
   new NextRequest("http://localhost/api/settings/ai-conversation", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memoryId }),
   }),
  );

  expect(response.status).toBe(200);
  expect(forgetAiConversationManagedMemory).toHaveBeenCalledWith({ userId, memoryId });
 });

 it("rejects unauthenticated settings access", async () => {
  createClient.mockResolvedValue({
   auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  });

  const response = await GET(new NextRequest("http://localhost/api/settings/ai-conversation"));

  expect(response.status).toBe(401);
  expect(loadAiConversationSettingsOverview).not.toHaveBeenCalled();
 });
});
