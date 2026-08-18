import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { logger } from "@/lib/logger";
import type { JsonObject } from "@/types/json";

import { loadAiConversationContextState } from "./ai-conversation-persistence.server";
import {
 applyAiConversationMemoryChanges,
 applyAiConversationSummaryForJob,
 AiConversationMemoryPipelineNotReadyError,
 claimAiConversationPostTurnJobs,
 evolveAiConversationRelationshipForJob,
 finishAiConversationPostTurnJob,
 loadActiveAiConversationMemories,
 loadAiConversationPostTurnEvidence,
} from "./ai-conversation-memory-persistence.server";
import { extractAiConversationMemoryChanges } from "./ai-conversation-memory-extraction.server";
import { enrichMissingAiConversationMemoryEmbeddings, isAiConversationLongTermMemoryEnabled } from "./ai-conversation-memory.server";
import type { AiConversationMemoryCandidate } from "./ai-conversation-memory.schemas";
import { buildAiConversationSummaryUpdate } from "./ai-conversation-summary.server";

function toMemoryChangeJson(candidate: AiConversationMemoryCandidate): JsonObject {
 return {
  action: candidate.action,
  kind: candidate.kind,
  targetMemoryId: candidate.targetMemoryId,
  memoryKey: candidate.memoryKey,
  content: candidate.content,
  importance: candidate.importance,
  confidence: candidate.confidence,
  scope: candidate.scope,
 };
}

function relationshipIncrement(appliedMemoryChanges: number) {
 return Math.min(0.018, 0.004 + Math.min(appliedMemoryChanges, 4) * 0.0035);
}

export async function processDueAiConversationPostTurnJobs({
 supabase,
 userId,
 conversationId,
 signal,
 limit = 2,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 conversationId: string;
 signal?: AbortSignal;
 limit?: number;
}): Promise<{ processed: number; ready: boolean }> {
 let jobs;
 try {
  jobs = await claimAiConversationPostTurnJobs({ userId, conversationId, limit });
 } catch (error) {
  if (error instanceof AiConversationMemoryPipelineNotReadyError) {
   return { processed: 0, ready: false };
  }
  throw error;
 }

 let processed = 0;
 for (const job of jobs) {
  try {
   const [evidence, contextState] = await Promise.all([
    loadAiConversationPostTurnEvidence({ userId, job }),
    loadAiConversationContextState({ userId, conversationId: job.conversation_id }),
   ]);
   const memoryEnabled = isAiConversationLongTermMemoryEnabled({
    conversationPolicy: evidence.conversation.memory_policy,
    userPreference: evidence.userMemoryEnabled,
   });

   let appliedMemoryChanges = 0;
   if (job.memory_applied_at === null) {
    if (memoryEnabled) {
     const activeMemories = await loadActiveAiConversationMemories({
      userId,
      characterId: evidence.conversation.character_id,
      limit: 80,
     });
     const extraction = await extractAiConversationMemoryChanges({
      supabase,
      userId,
      characterId: evidence.conversation.character_id,
      characterName: contextState.character.displayName,
      mode: contextState.conversation.mode,
      userMessage: evidence.userMessage.content,
      assistantMessage: evidence.assistantMessage.content,
      activeMemories,
      signal,
     });
     if (!extraction.data) {
      throw new Error(extraction.error || "AI memory extraction failed");
     }

     appliedMemoryChanges = await applyAiConversationMemoryChanges({
      userId,
      jobId: job.id,
      userMessageId: evidence.userMessage.id,
      changes: extraction.data.changes.map(toMemoryChangeJson),
     });

     try {
      await enrichMissingAiConversationMemoryEmbeddings({
       userId,
       characterId: evidence.conversation.character_id,
       signal,
      });
     } catch (embeddingError) {
      logger.warn("[AI Conversation] memory embedding enrichment deferred", embeddingError);
     }
    } else {
     await applyAiConversationMemoryChanges({
      userId,
      jobId: job.id,
      userMessageId: evidence.userMessage.id,
      changes: [],
     });
    }
   }

   if (job.relationship_applied_at === null) {
    await evolveAiConversationRelationshipForJob({
     userId,
     jobId: job.id,
     increment: memoryEnabled ? relationshipIncrement(appliedMemoryChanges) : 0,
    });
   }

   if (job.summary_applied_at === null) {
    const summaryUpdate = await buildAiConversationSummaryUpdate({
     supabase,
     userId,
     conversation: evidence.conversation,
     signal,
    });
    await applyAiConversationSummaryForJob({
     userId,
     jobId: job.id,
     summary: summaryUpdate?.summary ?? null,
     summaryUntilSeq: summaryUpdate?.summaryUntilSeq ?? null,
     expectedSummaryVersion: summaryUpdate?.expectedSummaryVersion ?? null,
    });
   }

   await finishAiConversationPostTurnJob({
    userId,
    jobId: job.id,
    succeeded: true,
   });
   processed += 1;
  } catch (error) {
   logger.warn("[AI Conversation] post-turn job failed and will retry", error);
   try {
    await finishAiConversationPostTurnJob({
     userId,
     jobId: job.id,
     succeeded: false,
     error: error instanceof Error ? error.message : "Unknown post-turn processing error",
    });
   } catch (finishError) {
    logger.error("[AI Conversation] failed to persist post-turn retry state", finishError);
   }
  }
 }

 return { processed, ready: true };
}
