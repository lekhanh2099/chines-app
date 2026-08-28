import { sleep } from "workflow";
import { start } from "workflow/api";

import { logger } from "@/lib/logger";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

import { processDueAiConversationPostTurnJobs } from "./ai-conversation-post-turn.server";

type AiConversationPostTurnWorkflowInput = {
 userId: string;
 conversationId: string;
};

async function processAiConversationPostTurnStep(input: AiConversationPostTurnWorkflowInput) {
 "use step";

 return processDueAiConversationPostTurnJobs({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  conversationId: input.conversationId,
  limit: 1,
 });
}

processAiConversationPostTurnStep.maxRetries = 0;

export async function aiConversationPostTurnWorkflow(input: AiConversationPostTurnWorkflowInput) {
 "use workflow";

 for (let attempt = 0; attempt < 5; attempt += 1) {
  const result = await processAiConversationPostTurnStep(input);
  if (!result.ready || result.processed > 0 || result.retryDelaySeconds === 0) return;
  await sleep(result.retryDelaySeconds * 1_000);
 }
}

export async function dispatchAiConversationPostTurnWorkflow(
 input: AiConversationPostTurnWorkflowInput,
) {
 try {
  await start(aiConversationPostTurnWorkflow, [input]);
 } catch {
  logger.warn("[AI Conversation] post-turn workflow dispatch deferred");
 }
}
