import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseServerSecret } = vi.hoisted(() => ({
 getSupabaseServerSecret: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: {
  url: "https://example.supabase.co",
  key: "sb_publishable_test",
 },
}));
vi.mock("@/lib/env/server", () => ({ getSupabaseServerSecret }));

import {
 AiConversationPersistenceConfigurationError,
 AiConversationPersistenceNotReadyError,
 AiConversationPersistenceRequestError,
 archiveAiConversation,
 listAiConversationHistory,
 loadLatestAiConversationSession,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
} from "./ai-conversation-persistence.server";

const conversationId = "11111111-1111-4111-8111-111111111111";
const characterId = "22222222-2222-4222-8222-222222222222";

const conversationRow = {
 id: conversationId,
 character_id: characterId,
 title: "",
 mode: "natural",
 correction_style: "balanced",
 reply_mode: "adaptive",
 memory_policy: "inherit",
};

const preferenceRow = {
 default_mode: "natural",
 default_correction_style: "balanced",
 default_reply_mode: "adaptive",
 learner_level: "intermediate",
 memory_enabled: true,
};

describe("AI conversation persistence prerequisites", () => {
 beforeEach(() => {
  getSupabaseServerSecret.mockReset();
  getSupabaseServerSecret.mockReturnValue("sb_secret_test");
  vi.unstubAllGlobals();
 });

 it("classifies a missing AI table as persistence not ready", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(
    Response.json(
     {
      code: "PGRST205",
      message: "Could not find the table 'public.ai_conversations' in the schema cache",
     },
     { status: 404 },
    ),
   ),
  );

  await expect(loadLatestAiConversationSession("user-1")).rejects.toBeInstanceOf(
   AiConversationPersistenceNotReadyError,
  );
 });

 it("also recognizes missing-table responses when PostgREST omits the expected code", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(
    Response.json(
     {
      message: "Could not find the table 'public.ai_conversations' in the schema cache",
     },
     { status: 404 },
    ),
   ),
  );

  await expect(loadLatestAiConversationSession("user-1")).rejects.toBeInstanceOf(
   AiConversationPersistenceNotReadyError,
  );
 });

 it("classifies a missing server secret separately from schema readiness", async () => {
  getSupabaseServerSecret.mockImplementation(() => {
   throw new Error("missing server secret");
  });
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  await expect(loadLatestAiConversationSession("user-1")).rejects.toBeInstanceOf(
   AiConversationPersistenceConfigurationError,
  );
  expect(fetchMock).not.toHaveBeenCalled();
 });
});

describe("AI conversation persisted settings ownership", () => {
 beforeEach(() => {
  getSupabaseServerSecret.mockReset();
  getSupabaseServerSecret.mockReturnValue("sb_secret_test");
  vi.unstubAllGlobals();
 });

 it("filters the conversation mutation by authenticated user before writing learner preference", async () => {
  const fetchMock = vi
   .fn()
   .mockResolvedValueOnce(
    Response.json([
     {
      ...conversationRow,
      mode: "grammar-coach",
      correction_style: "strict",
      reply_mode: "chinese",
     },
    ]),
   )
   .mockResolvedValueOnce(
    Response.json([
     {
      ...preferenceRow,
      learner_level: "advanced",
     },
    ]),
   );
  vi.stubGlobal("fetch", fetchMock);

  const result = await updateAiConversationSettings({
   userId: "user-1",
   conversationId,
   settings: {
    mode: "grammar-coach",
    correctionStyle: "strict",
    replyMode: "chinese",
    learnerLevel: "advanced",
   },
  });

  expect(result).toEqual({
   conversationId,
   characterId,
   mode: "grammar-coach",
   correctionStyle: "strict",
   replyMode: "chinese",
   learnerLevel: "advanced",
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);

  const conversationUrl = String(fetchMock.mock.calls[0]?.[0]);
  const conversationRequest = fetchMock.mock.calls[0]?.[1];
  expect(conversationUrl).toContain("/rest/v1/ai_conversations");
  expect(conversationUrl).toContain("user_id=eq.user-1");
  expect(conversationUrl).toContain(`id=eq.${conversationId}`);
  expect(conversationRequest).toEqual(expect.objectContaining({ method: "PATCH" }));

  const preferenceUrl = String(fetchMock.mock.calls[1]?.[0]);
  const preferenceRequest = fetchMock.mock.calls[1]?.[1];
  expect(preferenceUrl).toContain("/rest/v1/ai_conversation_preferences");
  expect(preferenceUrl).toContain("on_conflict=user_id");
  expect(preferenceRequest).toEqual(
   expect.objectContaining({
    method: "POST",
    body: expect.stringContaining('"user_id":"user-1"'),
   }),
  );
 });

 it("does not write learner preference when the owned conversation row is absent", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
  vi.stubGlobal("fetch", fetchMock);

  const error = await updateAiConversationSettings({
   userId: "user-1",
   conversationId,
   settings: {
    mode: "natural",
    correctionStyle: "balanced",
    replyMode: "adaptive",
    learnerLevel: "intermediate",
   },
  }).catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(AiConversationPersistenceRequestError);
  expect(error).toMatchObject({ code: "AI_CONVERSATION_NOT_FOUND", status: 404 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });
});

describe("AI conversation Phase 5 lifecycle ownership", () => {
 beforeEach(() => {
  getSupabaseServerSecret.mockReset();
  getSupabaseServerSecret.mockReturnValue("sb_secret_test");
  vi.unstubAllGlobals();
 });

 it("lists a bounded active history owned by the authenticated user", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json([
    {
     ...conversationRow,
     title: "周末计划",
     last_message_at: "2026-08-18T03:30:00+00:00",
     created_at: "2026-08-18T03:00:00+00:00",
     updated_at: "2026-08-18T03:30:00+00:00",
    },
   ]),
  );
  vi.stubGlobal("fetch", fetchMock);

  const history = await listAiConversationHistory("user-1", 30);

  expect(history).toHaveLength(1);
  expect(history[0]?.title).toBe("周末计划");
  const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(requestUrl.pathname).toBe("/rest/v1/ai_conversations");
  expect(requestUrl.searchParams.get("user_id")).toBe("eq.user-1");
  expect(requestUrl.searchParams.get("archived_at")).toBe("is.null");
  expect(requestUrl.searchParams.get("limit")).toBe("30");
 });

 it("updates per-conversation memory policy only through the owned conversation row", async () => {
  const fetchMock = vi
   .fn()
   .mockResolvedValueOnce(Response.json([{ ...conversationRow, memory_policy: "disabled" }]))
   .mockResolvedValueOnce(Response.json([preferenceRow]));
  vi.stubGlobal("fetch", fetchMock);

  const result = await updateAiConversationMemoryPolicy({
   userId: "user-1",
   conversationId,
   memoryPolicy: "disabled",
  });

  expect(result).toEqual({
   conversationId,
   memoryPolicy: "disabled",
   memoryEnabled: false,
  });
  const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(requestUrl.searchParams.get("user_id")).toBe("eq.user-1");
  expect(requestUrl.searchParams.get("id")).toBe(`eq.${conversationId}`);
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
   memory_policy: "disabled",
  });
 });

 it("archives instead of hard-deleting the owned conversation", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([{ id: conversationId }]));
  vi.stubGlobal("fetch", fetchMock);

  await expect(archiveAiConversation({ userId: "user-1", conversationId })).resolves.toEqual({
   conversationId,
   archived: true,
  });

  const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
  const request = fetchMock.mock.calls[0]?.[1];
  expect(requestUrl.searchParams.get("user_id")).toBe("eq.user-1");
  expect(requestUrl.searchParams.get("id")).toBe(`eq.${conversationId}`);
  expect(request).toEqual(expect.objectContaining({ method: "PATCH" }));
  expect(JSON.parse(String(request?.body))).toEqual(
   expect.objectContaining({ archived_at: expect.any(String) }),
  );
 });
});
