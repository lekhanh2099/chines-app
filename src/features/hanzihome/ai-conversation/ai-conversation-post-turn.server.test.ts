import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";

import type { AiConversationContextState } from "./ai-conversation-context.server";

const {
 PipelineNotReadyError,
 applyAiConversationMemoryChanges,
 applyAiConversationSummaryForJob,
 buildAiConversationSummaryUpdate,
 claimAiConversationPostTurnJobs,
 enrichMissingAiConversationMemoryEmbeddings,
 evolveAiConversationRelationshipForJob,
 extractAiConversationMemoryChanges,
 finishAiConversationPostTurnJob,
 loadActiveAiConversationMemories,
 loadAiConversationContextState,
 loadAiConversationPostTurnEvidence,
} = vi.hoisted(() => {
 class PipelineNotReadyError extends Error {}
 return {
  PipelineNotReadyError,
  applyAiConversationMemoryChanges: vi.fn(),
  applyAiConversationSummaryForJob: vi.fn(),
  buildAiConversationSummaryUpdate: vi.fn(),
  claimAiConversationPostTurnJobs: vi.fn(),
  enrichMissingAiConversationMemoryEmbeddings: vi.fn(),
  evolveAiConversationRelationshipForJob: vi.fn(),
  extractAiConversationMemoryChanges: vi.fn(),
  finishAiConversationPostTurnJob: vi.fn(),
  loadActiveAiConversationMemories: vi.fn(),
  loadAiConversationContextState: vi.fn(),
  loadAiConversationPostTurnEvidence: vi.fn(),
 };
});

vi.mock("server-only", () => ({}));
vi.mock("./ai-conversation-persistence.server", () => ({ loadAiConversationContextState }));
vi.mock("./ai-conversation-memory-persistence.server", () => ({
 AiConversationMemoryPipelineNotReadyError: PipelineNotReadyError,
 applyAiConversationMemoryChanges,
 applyAiConversationSummaryForJob,
 claimAiConversationPostTurnJobs,
 evolveAiConversationRelationshipForJob,
 finishAiConversationPostTurnJob,
 loadActiveAiConversationMemories,
 loadAiConversationPostTurnEvidence,
}));
vi.mock("./ai-conversation-memory-extraction.server", () => ({ extractAiConversationMemoryChanges }));
vi.mock("./ai-conversation-memory.server", () => ({
 enrichMissingAiConversationMemoryEmbeddings,
 isAiConversationLongTermMemoryEnabled: ({
  conversationPolicy,
  userPreference,
 }: {
  conversationPolicy: "inherit" | "enabled" | "disabled";
  userPreference: boolean;
 }) => {
  if (conversationPolicy === "disabled") return false;
  if (conversationPolicy === "enabled") return true;
  return userPreference;
 },
}));
vi.mock("./ai-conversation-summary.server", () => ({ buildAiConversationSummaryUpdate }));

import { processDueAiConversationPostTurnJobs } from "./ai-conversation-post-turn.server";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});
const job = {
 id: "11111111-1111-4111-8111-111111111111",
 user_id: "22222222-2222-4222-8222-222222222222",
 conversation_id: "33333333-3333-4333-8333-333333333333",
 assistant_message_id: "44444444-4444-4444-8444-444444444444",
 status: "processing",
 attempt_count: 1,
 memory_applied_at: null,
 relationship_applied_at: null,
 summary_applied_at: null,
};
const evidence = {
 userMessage: {
  id: "55555555-5555-4555-8555-555555555555",
  conversation_id: job.conversation_id,
  role: "user",
  content: "我每周打三次羽毛球。",
  reply_to_message_id: null,
  seq: 1,
 },
 assistantMessage: {
  id: job.assistant_message_id,
  conversation_id: job.conversation_id,
  role: "assistant",
  content: "原来你常打羽毛球！",
  reply_to_message_id: "55555555-5555-4555-8555-555555555555",
  seq: 2,
 },
 conversation: {
  id: job.conversation_id,
  character_id: "66666666-6666-4666-8666-666666666666",
  memory_policy: "inherit",
  summary: "",
  summary_until_seq: 0,
  summary_version: 1,
  last_message_seq: 2,
 },
 userMemoryEnabled: true,
};
const contextState: AiConversationContextState = {
 conversation: {
  id: job.conversation_id,
  characterId: evidence.conversation.character_id,
  mode: "natural",
  correctionStyle: "balanced",
  replyMode: "adaptive",
  memoryPolicy: "inherit",
  summary: "",
  summaryUntilSeq: 0,
 },
 character: {
  id: evidence.conversation.character_id,
  displayName: "小林",
  city: "上海",
  age: null,
  background: "",
  personality: "自然",
  speakingStyle: "自然普通话",
  interests: [],
  identityNotes: "",
 },
 relationship: null,
 learnerLevel: "intermediate",
};

describe("AI conversation durable post-turn processor", () => {
 beforeEach(() => {
  applyAiConversationMemoryChanges.mockReset();
  applyAiConversationSummaryForJob.mockReset();
  buildAiConversationSummaryUpdate.mockReset();
  claimAiConversationPostTurnJobs.mockReset();
  enrichMissingAiConversationMemoryEmbeddings.mockReset();
  evolveAiConversationRelationshipForJob.mockReset();
  extractAiConversationMemoryChanges.mockReset();
  finishAiConversationPostTurnJob.mockReset();
  loadActiveAiConversationMemories.mockReset();
  loadAiConversationContextState.mockReset();
  loadAiConversationPostTurnEvidence.mockReset();

  claimAiConversationPostTurnJobs.mockResolvedValue([job]);
  loadAiConversationPostTurnEvidence.mockResolvedValue(evidence);
  loadAiConversationContextState.mockResolvedValue(contextState);
  loadActiveAiConversationMemories.mockResolvedValue([]);
  extractAiConversationMemoryChanges.mockResolvedValue({ data: { changes: [] }, error: null });
  applyAiConversationMemoryChanges.mockResolvedValue(0);
  enrichMissingAiConversationMemoryEmbeddings.mockResolvedValue(0);
  evolveAiConversationRelationshipForJob.mockResolvedValue(true);
  buildAiConversationSummaryUpdate.mockResolvedValue(null);
  applyAiConversationSummaryForJob.mockResolvedValue(false);
  finishAiConversationPostTurnJob.mockResolvedValue(true);
 });

 it("applies memory relationship and summary stages before marking the job succeeded", async () => {
  const result = await processDueAiConversationPostTurnJobs({
   supabase,
   userId: job.user_id,
   conversationId: job.conversation_id,
  });

  expect(result).toEqual({ processed: 1, ready: true });
  expect(extractAiConversationMemoryChanges).toHaveBeenCalledWith(
   expect.objectContaining({
    userMessage: evidence.userMessage.content,
    assistantMessage: evidence.assistantMessage.content,
   }),
  );
  expect(applyAiConversationMemoryChanges).toHaveBeenCalledWith(
   expect.objectContaining({ jobId: job.id, userMessageId: evidence.userMessage.id, changes: [] }),
  );
  expect(evolveAiConversationRelationshipForJob).toHaveBeenCalledWith({
   userId: job.user_id,
   jobId: job.id,
   increment: 0.006,
  });
  expect(applyAiConversationSummaryForJob).toHaveBeenCalledWith(
   expect.objectContaining({ jobId: job.id, summary: null }),
  );
  expect(finishAiConversationPostTurnJob).toHaveBeenCalledWith({
   userId: job.user_id,
   jobId: job.id,
   succeeded: true,
  });
 });

 it("skips memory extraction and relationship evolution in no-memory mode while preserving thread summary", async () => {
  loadAiConversationPostTurnEvidence.mockResolvedValue({
   ...evidence,
   conversation: { ...evidence.conversation, memory_policy: "disabled" },
  });

  await processDueAiConversationPostTurnJobs({
   supabase,
   userId: job.user_id,
   conversationId: job.conversation_id,
  });

  expect(extractAiConversationMemoryChanges).not.toHaveBeenCalled();
  expect(loadActiveAiConversationMemories).not.toHaveBeenCalled();
  expect(applyAiConversationMemoryChanges).toHaveBeenCalledWith(
   expect.objectContaining({ changes: [] }),
  );
  expect(evolveAiConversationRelationshipForJob).toHaveBeenCalledWith({
   userId: job.user_id,
   jobId: job.id,
   increment: 0,
  });
  expect(buildAiConversationSummaryUpdate).toHaveBeenCalledTimes(1);
 });

 it("degrades cleanly when the Phase 4 migration is not applied", async () => {
  claimAiConversationPostTurnJobs.mockRejectedValue(new PipelineNotReadyError());

  await expect(
   processDueAiConversationPostTurnJobs({
    supabase,
    userId: job.user_id,
    conversationId: job.conversation_id,
   }),
  ).resolves.toEqual({ processed: 0, ready: false });
  expect(loadAiConversationPostTurnEvidence).not.toHaveBeenCalled();
 });

 it("persists retry state instead of losing a failed durable job", async () => {
  extractAiConversationMemoryChanges.mockResolvedValue({ data: null, error: "provider failed" });
  finishAiConversationPostTurnJob.mockResolvedValue(false);

  const result = await processDueAiConversationPostTurnJobs({
   supabase,
   userId: job.user_id,
   conversationId: job.conversation_id,
  });

  expect(result).toEqual({ processed: 0, ready: true });
  expect(finishAiConversationPostTurnJob).toHaveBeenCalledWith({
   userId: job.user_id,
   jobId: job.id,
   succeeded: false,
   error: "provider failed",
  });
 });
});
