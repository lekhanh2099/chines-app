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
 loadLatestAiConversationSession,
} from "./ai-conversation-persistence.server";

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
