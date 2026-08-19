import { afterEach, describe, expect, it, vi } from "vitest";

import {
 editAiConversationManagedMemory,
 fetchAiConversationManagedMemories,
 fetchAiConversationSettingsOverview,
 forgetAiConversationManagedMemory,
 resolveAiConversationManagedOpenLoop,
 updateAiConversationAccountPreferences,
} from "./ai-conversation-settings.client";
import { aiConversationAccountPreferencesSchema } from "./ai-conversation-settings.schema";

const memoryId = "33333333-3333-4333-8333-333333333333";

afterEach(() => {
 vi.unstubAllGlobals();
});

describe("Phase 6 AI settings client", () => {
 it("loads overview without eagerly loading memories", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    preferences: {
     defaultMode: "natural",
     defaultCorrectionStyle: "balanced",
     defaultReplyMode: "adaptive",
     learnerLevel: "intermediate",
     memoryEnabled: true,
    },
    character: null,
    relationship: null,
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await fetchAiConversationSettingsOverview();

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/settings/ai-conversation");
 });

 it("loads memories only through the explicit memory resource", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
  vi.stubGlobal("fetch", fetchMock);

  await fetchAiConversationManagedMemories();

  expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
   "/api/settings/ai-conversation?resource=memories",
  );
 });

 it("persists account defaults with PUT", async () => {
  const preferences = aiConversationAccountPreferencesSchema.parse({
   defaultMode: "grammar-coach",
   defaultCorrectionStyle: "strict",
   defaultReplyMode: "chinese",
   learnerLevel: "advanced",
   memoryEnabled: false,
  });
  const fetchMock = vi.fn().mockResolvedValue(Response.json(preferences));
  vi.stubGlobal("fetch", fetchMock);

  await updateAiConversationAccountPreferences(preferences);

  expect(fetchMock.mock.calls[0]?.[1]).toEqual(
   expect.objectContaining({ method: "PUT", body: JSON.stringify(preferences) }),
  );
 });

 it("uses explicit memory actions for edit, resolve and forget", async () => {
  const fetchMock = vi
   .fn()
   .mockResolvedValueOnce(
    Response.json({
     id: memoryId,
     characterId: null,
     characterName: null,
     kind: "preference",
     content: "我喜欢排球。",
     updatedAt: "2026-08-18T08:00:00+00:00",
    }),
   )
   .mockResolvedValueOnce(Response.json({ memoryId, resolved: true }))
   .mockResolvedValueOnce(Response.json({ memoryId, forgotten: true }));
  vi.stubGlobal("fetch", fetchMock);

  await editAiConversationManagedMemory({ memoryId, content: "我喜欢排球。" });
  await resolveAiConversationManagedOpenLoop(memoryId);
  await forgetAiConversationManagedMemory(memoryId);

  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
   action: "edit",
   memoryId,
   content: "我喜欢排球。",
  });
  expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
   action: "resolve",
   memoryId,
  });
  expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({ memoryId });
 });
});
