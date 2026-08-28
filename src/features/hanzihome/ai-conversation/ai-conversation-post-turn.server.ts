import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { logger } from "@/lib/logger";
import type { JsonObject } from "@/types/json";
import { resolveUserAiTaskRuntime } from "@/services/ai-runtime.service";

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
 loadUnembeddedAiConversationMemories,
} from "./ai-conversation-memory-persistence.server";
import { extractAiConversationMemoryChanges } from "./ai-conversation-memory-extraction.server";
import {
 enrichMissingAiConversationMemoryEmbeddings,
 isAiConversationLongTermMemoryEnabled,
} from "./ai-conversation-memory.server";
import type { AiConversationMemoryCandidate } from "./ai-conversation-memory.schemas";
import { buildAiConversationSummaryUpdate } from "./ai-conversation-summary.server";

const RELATIONSHIP_INCREMENT_PER_REMEMBERED_TURN = 0.006;

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
}): Promise<{ processed: number; ready: boolean; retryDelaySeconds: number }> {
 let jobs;
 try {
  jobs = await claimAiConversationPostTurnJobs({ userId, conversationId, limit });
 } catch (error) {
  if (error instanceof AiConversationMemoryPipelineNotReadyError) {
   return { processed: 0, ready: false, retryDelaySeconds: 0 };
  }
  throw error;
 }

 let processed = 0;
 let retryDelaySeconds = 0;
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

   let stageFailed = false;
   if (job.memory_applied_at === null) {
    if (memoryEnabled) {
     const memoryRuntime = await resolveUserAiTaskRuntime({
      supabase,
      userId,
      taskId: "conversation.memory-extraction",
     });
     if (!memoryRuntime.ok && memoryRuntime.status === "task-disabled") {
      await applyAiConversationMemoryChanges({
       userId,
       jobId: job.id,
       userMessageId: evidence.userMessage.id,
       changes: [],
      });
     } else {
      try {
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
       if (!extraction.data) throw new Error("memory-extraction-failed");
       await applyAiConversationMemoryChanges({
        userId,
        jobId: job.id,
        userMessageId: evidence.userMessage.id,
        changes: extraction.data.changes.map(toMemoryChangeJson),
       });
      } catch {
       stageFailed = true;
       logger.warn("[AI Conversation] memory extraction stage deferred");
      }
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
    try {
     await evolveAiConversationRelationshipForJob({
      userId,
      jobId: job.id,
      increment: memoryEnabled ? RELATIONSHIP_INCREMENT_PER_REMEMBERED_TURN : 0,
     });
    } catch {
     stageFailed = true;
     logger.warn("[AI Conversation] relationship stage deferred");
    }
   }

   if (job.summary_applied_at === null) {
    const summaryRuntime = await resolveUserAiTaskRuntime({
     supabase,
     userId,
     taskId: "conversation.summary",
    });
    if (!summaryRuntime.ok && summaryRuntime.status === "task-disabled") {
     await applyAiConversationSummaryForJob({
      userId,
      jobId: job.id,
      summary: null,
      summaryUntilSeq: null,
      expectedSummaryVersion: null,
     });
    } else {
     try {
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
     } catch {
      stageFailed = true;
      logger.warn("[AI Conversation] summary stage deferred");
     }
    }
   }

   if (memoryEnabled) {
    const semanticRuntime = await resolveUserAiTaskRuntime({
     supabase,
     userId,
     taskId: "conversation.semantic-memory",
    });
    if (semanticRuntime.ok) {
     try {
      const pendingEmbeddings = await loadUnembeddedAiConversationMemories({
       userId,
       characterId: evidence.conversation.character_id,
       limit: 3,
      });
      const enriched = await enrichMissingAiConversationMemoryEmbeddings({
       supabase,
       userId,
       characterId: evidence.conversation.character_id,
       signal,
      });
      if (pendingEmbeddings.length > 0 && enriched === 0) {
       stageFailed = true;
       logger.warn("[AI Conversation] semantic memory stage deferred");
      }
     } catch {
      stageFailed = true;
      logger.warn("[AI Conversation] semantic memory stage deferred");
     }
    } else if (semanticRuntime.status !== "task-disabled") {
     stageFailed = true;
     logger.warn("[AI Conversation] semantic memory runtime unavailable");
    }
   }

   await finishAiConversationPostTurnJob({
    userId,
    jobId: job.id,
    succeeded: !stageFailed,
    ...(stageFailed ? { error: "post-turn-processing-failed" } : {}),
   });
   if (stageFailed) {
    retryDelaySeconds =
     job.attempt_count >= 5 ? 0 : Math.min(3600, 30 * 2 ** Math.max(job.attempt_count - 1, 0));
   } else {
    processed += 1;
   }
  } catch {
   logger.warn("[AI Conversation] post-turn job failed and will retry");
   try {
    await finishAiConversationPostTurnJob({
     userId,
     jobId: job.id,
     succeeded: false,
     error: "post-turn-processing-failed",
    });
    retryDelaySeconds =
     job.attempt_count >= 5 ? 0 : Math.min(3600, 30 * 2 ** Math.max(job.attempt_count - 1, 0));
   } catch {
    logger.error("[AI Conversation] failed to persist post-turn retry state");
   }
  }
 }

 return { processed, ready: true, retryDelaySeconds };
}
