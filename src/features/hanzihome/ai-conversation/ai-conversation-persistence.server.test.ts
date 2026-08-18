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
 loadLatestAiConversationSession,
 updateAiConversationSettings,
} from "./ai-conversation-persistence.server";

const conversationId = "11111111-1111-4111-8111-111111111111";
const characterId = "22222222-2222-4222-8222-222222222222";

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
      id: conversationId,
      character_id: characterId,
      title: "",
      mode: "grammar-coach",
      correction_style: "strict",
      reply_mode: "chinese",
      memory_policy: "inherit",
     },
    ]),
   )
   .mockResolvedValueOnce(
    Response.json([
     {
      default_mode: "natural",
      default_correction_style: "balanced",
      default_reply_mode: "adaptive",
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
  expect(conversationRequest).toEqual(
   expect.objectContaining({
    method: "PATCH",
   }),
  );

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
