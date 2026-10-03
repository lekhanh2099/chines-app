import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 createServiceRoleSupabaseClient: vi.fn(),
 loggerWarn: vi.fn(),
 processDueAiConversationPostTurnJobs: vi.fn(),
 sleep: vi.fn(),
 start: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("workflow", () => ({ sleep: mocks.sleep }));
vi.mock("workflow/api", () => ({ start: mocks.start }));
vi.mock("@/lib/logger", () => ({ logger: { warn: mocks.loggerWarn } }));
vi.mock("@/lib/supabase/service-role.server", () => ({
 createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));
vi.mock("./ai-conversation-post-turn.server", () => ({
 processDueAiConversationPostTurnJobs: mocks.processDueAiConversationPostTurnJobs,
}));

import {
 aiConversationPostTurnWorkflow,
 dispatchAiConversationPostTurnWorkflow,
} from "./ai-conversation-post-turn.workflow";

const input = {
 userId: "11111111-1111-4111-8111-111111111111",
 conversationId: "22222222-2222-4222-8222-222222222222",
};

describe("AI conversation post-turn workflow", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.createServiceRoleSupabaseClient.mockReturnValue({ scope: "service-role" });
  mocks.sleep.mockResolvedValue(undefined);
 });

 it("sleeps until the database retry is due and then reclaims the job", async () => {
  mocks.processDueAiConversationPostTurnJobs
   .mockResolvedValueOnce({ processed: 0, ready: true, retryDelaySeconds: 30 })
   .mockResolvedValueOnce({ processed: 1, ready: true, retryDelaySeconds: 0 });

  await aiConversationPostTurnWorkflow(input);

  expect(mocks.sleep).toHaveBeenCalledWith(30_000);
  expect(mocks.processDueAiConversationPostTurnJobs).toHaveBeenCalledTimes(2);
 });

 it("keeps the database job pending when workflow dispatch is unavailable", async () => {
  mocks.start.mockRejectedValue(new Error("workflow unavailable"));

  await expect(dispatchAiConversationPostTurnWorkflow(input)).resolves.toBeUndefined();

  expect(mocks.loggerWarn).toHaveBeenCalledWith(
   "[AI Conversation] post-turn workflow dispatch deferred",
  );
 });
});
