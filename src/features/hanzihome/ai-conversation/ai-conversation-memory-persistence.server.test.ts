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
 AiConversationMemoryPipelineNotReadyError,
 applyAiConversationMemoryChanges,
 claimAiConversationPostTurnJobs,
 loadActiveAiConversationMemories,
} from "./ai-conversation-memory-persistence.server";

const userId = "11111111-1111-4111-8111-111111111111";
const characterId = "22222222-2222-4222-8222-222222222222";
const conversationId = "33333333-3333-4333-8333-333333333333";
const jobId = "44444444-4444-4444-8444-444444444444";
const userMessageId = "55555555-5555-4555-8555-555555555555";

describe("AI conversation memory persistence boundary", () => {
 beforeEach(() => {
  getSupabaseServerSecret.mockReset();
  getSupabaseServerSecret.mockReturnValue("sb_secret_test");
  vi.unstubAllGlobals();
 });

 it("loads only the authenticated user's global/current-character active memories", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json([
    {
     id: "66666666-6666-4666-8666-666666666666",
     character_id: null,
     kind: "preference",
     memory_key: "user.sport.badminton",
     content: "我喜欢打羽毛球。",
     importance: 0.8,
     confidence: 0.95,
     reinforcement_count: 1,
     updated_at: "2026-08-18T03:00:00+00:00",
     valid_until: null,
    },
   ]),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await loadActiveAiConversationMemories({ userId, characterId });

  expect(result).toHaveLength(1);
  const requestUrl = new URL(fetchMock.mock.calls[0]?.[0]);
  expect(requestUrl.pathname).toBe("/rest/v1/ai_memories");
  expect(requestUrl.searchParams.get("user_id")).toBe(`eq.${userId}`);
  expect(requestUrl.searchParams.get("status")).toBe("eq.active");
  expect(requestUrl.searchParams.get("or")).toBe(
   `(character_id.is.null,character_id.eq.${characterId})`,
  );
 });

 it("calls the scoped lifecycle RPC contract with authenticated ownership inputs", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(1));
  vi.stubGlobal("fetch", fetchMock);

  await applyAiConversationMemoryChanges({
   userId,
   jobId,
   userMessageId,
   changes: [],
  });

  const [url, init] = fetchMock.mock.calls[0];
  expect(url.toString()).toContain("/rest/v1/rpc/ai_apply_memory_changes");
  expect(init.method).toBe("POST");
  expect(JSON.parse(init.body)).toEqual({
   p_user_id: userId,
   p_job_id: jobId,
   p_user_message_id: userMessageId,
   p_changes: [],
  });
 });

 it("claims only due jobs for the authenticated user and current conversation", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
  vi.stubGlobal("fetch", fetchMock);

  await claimAiConversationPostTurnJobs({ userId, conversationId, limit: 2 });

  const [, init] = fetchMock.mock.calls[0];
  expect(JSON.parse(init.body)).toEqual({
   p_user_id: userId,
   p_conversation_id: conversationId,
   p_limit: 2,
  });
 });

 it("classifies a missing Phase 4 RPC separately so persisted chat can degrade without memory", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(
    Response.json(
     {
      code: "PGRST202",
      message: "Could not find the function public.ai_claim_post_turn_jobs",
     },
     { status: 404 },
    ),
   ),
  );

  await expect(
   claimAiConversationPostTurnJobs({ userId, conversationId }),
  ).rejects.toBeInstanceOf(AiConversationMemoryPipelineNotReadyError);
 });
});
