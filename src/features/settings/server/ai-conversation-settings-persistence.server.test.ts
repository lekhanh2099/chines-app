import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseServerSecret } = vi.hoisted(() => ({
 getSupabaseServerSecret: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: { url: "https://example.supabase.co", key: "sb_publishable_test" },
}));
vi.mock("@/lib/env/server", () => ({ getSupabaseServerSecret }));

import {
 editAiConversationManagedMemory,
 forgetAiConversationManagedMemory,
 listAiConversationManagedMemories,
 loadAiConversationSettingsOverview,
 resolveAiConversationManagedOpenLoop,
 updateAiConversationAccountPreferences,
} from "./ai-conversation-settings-persistence.server";

const userId = "11111111-1111-4111-8111-111111111111";
const characterId = "22222222-2222-4222-8222-222222222222";
const memoryId = "33333333-3333-4333-8333-333333333333";
const timestamp = "2026-08-18T08:00:00+00:00";

const preferenceRow = {
 default_character_id: characterId,
 default_mode: "natural",
 default_correction_style: "balanced",
 default_reply_mode: "adaptive",
 learner_level: "intermediate",
 memory_enabled: true,
};

const memoryRow = {
 id: memoryId,
 character_id: characterId,
 kind: "preference",
 content: "我喜欢打羽毛球。",
 updated_at: timestamp,
};

describe("Phase 6 AI settings persistence", () => {
 beforeEach(() => {
  getSupabaseServerSecret.mockReset();
  getSupabaseServerSecret.mockReturnValue("sb_secret_test");
  vi.unstubAllGlobals();
 });

 it("loads account defaults with the owned character and relationship", async () => {
  const fetchMock = vi
   .fn()
   .mockResolvedValueOnce(Response.json([preferenceRow]))
   .mockResolvedValueOnce(Response.json([{ id: characterId, display_name: "小林", city: "上海" }]))
   .mockResolvedValueOnce(Response.json([{ nickname: "", familiarity_score: 0.61 }]));
  vi.stubGlobal("fetch", fetchMock);

  await expect(loadAiConversationSettingsOverview(userId)).resolves.toEqual({
   preferences: {
    defaultMode: "natural",
    defaultCorrectionStyle: "balanced",
    defaultReplyMode: "adaptive",
    learnerLevel: "intermediate",
    memoryEnabled: true,
   },
   character: { id: characterId, displayName: "小林", city: "上海" },
   relationship: { nickname: "", familiarityScore: 0.61 },
  });

  for (const call of fetchMock.mock.calls) {
   expect(String(call[0])).toContain(`user_id=eq.${userId}`);
  }
 });

 it("upserts only the authenticated user's account defaults", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json([
    {
     ...preferenceRow,
     default_mode: "grammar-coach",
     default_correction_style: "strict",
     default_reply_mode: "chinese",
     learner_level: "advanced",
     memory_enabled: false,
    },
   ]),
  );
  vi.stubGlobal("fetch", fetchMock);

  await updateAiConversationAccountPreferences({
   userId,
   preferences: {
    defaultMode: "grammar-coach",
    defaultCorrectionStyle: "strict",
    defaultReplyMode: "chinese",
    learnerLevel: "advanced",
    memoryEnabled: false,
   },
  });

  const request = fetchMock.mock.calls[0]?.[1];
  expect(request).toEqual(expect.objectContaining({ method: "POST" }));
  expect(JSON.parse(String(request?.body))).toEqual(
   expect.objectContaining({
    user_id: userId,
    default_mode: "grammar-coach",
    learner_level: "advanced",
    memory_enabled: false,
   }),
  );
 });

 it("lists active memories and resolves character names without exposing technical scores", async () => {
  const fetchMock = vi
   .fn()
   .mockResolvedValueOnce(
    Response.json([
     memoryRow,
     {
      ...memoryRow,
      id: "44444444-4444-4444-8444-444444444444",
      character_id: null,
      kind: "goal",
      content: "今年想通过HSKK。",
     },
    ]),
   )
   .mockResolvedValueOnce(Response.json([{ id: characterId, display_name: "小林", city: "上海" }]));
  vi.stubGlobal("fetch", fetchMock);

  const memories = await listAiConversationManagedMemories(userId);

  expect(memories).toEqual([
   {
    id: memoryId,
    characterId,
    characterName: "小林",
    kind: "preference",
    content: "我喜欢打羽毛球。",
    updatedAt: timestamp,
   },
   {
    id: "44444444-4444-4444-8444-444444444444",
    characterId: null,
    characterName: null,
    kind: "goal",
    content: "今年想通过HSKK。",
    updatedAt: timestamp,
   },
  ]);
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("status=eq.active");
 });

 it("edits only an active owned memory and clears stale embedding metadata", async () => {
  const fetchMock = vi
   .fn()
   .mockResolvedValue(Response.json([{ ...memoryRow, content: "我现在更喜欢打排球。" }]));
  vi.stubGlobal("fetch", fetchMock);

  await editAiConversationManagedMemory({
   userId,
   memoryId,
   content: " 我现在更喜欢打排球。 ",
  });

  const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
  const request = fetchMock.mock.calls[0]?.[1];
  expect(requestUrl.searchParams.get("user_id")).toBe(`eq.${userId}`);
  expect(requestUrl.searchParams.get("id")).toBe(`eq.${memoryId}`);
  expect(requestUrl.searchParams.get("status")).toBe("eq.active");
  expect(JSON.parse(String(request?.body))).toEqual(
   expect.objectContaining({
    content: "我现在更喜欢打排球。",
    embedding: null,
    embedding_model: null,
    embedding_version: null,
   }),
  );
 });

 it("resolves only active open loops", async () => {
  const fetchMock = vi
   .fn()
   .mockResolvedValue(
    Response.json([{ ...memoryRow, kind: "open_loop", content: "下周参加HSKK。" }]),
   );
  vi.stubGlobal("fetch", fetchMock);

  await expect(resolveAiConversationManagedOpenLoop({ userId, memoryId })).resolves.toEqual({
   memoryId,
   resolved: true,
  });

  const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(requestUrl.searchParams.get("kind")).toBe("eq.open_loop");
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(
   expect.objectContaining({ status: "resolved" }),
  );
 });

 it("forgets one active owned memory with a server-side delete", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([memoryRow]));
  vi.stubGlobal("fetch", fetchMock);

  await expect(forgetAiConversationManagedMemory({ userId, memoryId })).resolves.toEqual({
   memoryId,
   forgotten: true,
  });

  const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
  const request = fetchMock.mock.calls[0]?.[1];
  expect(request).toEqual(expect.objectContaining({ method: "DELETE" }));
  expect(requestUrl.searchParams.get("user_id")).toBe(`eq.${userId}`);
  expect(requestUrl.searchParams.get("id")).toBe(`eq.${memoryId}`);
  expect(requestUrl.searchParams.get("status")).toBe("eq.active");
 });
});
