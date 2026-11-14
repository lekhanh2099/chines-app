import type { AiTaskId } from "@/lib/ai/ai-task-contract";

export function getAiTaskCopyKey(taskId: AiTaskId) {
 if (taskId === "conversation.reply") return "conversationReply";
 if (taskId === "lookup.quick") return "lookupQuick";
 if (taskId === "lookup.deep") return "lookupDeep";
 if (taskId === "daily-reading.translation") return "dailyReadingTranslation";
 if (taskId === "daily-reading.vocabulary") return "dailyReadingVocabulary";
 if (taskId === "daily-reading.grammar") return "dailyReadingGrammar";
 if (taskId === "daily-reading.questions") return "dailyReadingQuestions";
 if (taskId === "conversation.summary") return "conversationSummary";
 if (taskId === "conversation.memory-extraction") return "conversationMemoryExtraction";
 if (taskId === "conversation.semantic-memory") return "conversationSemanticMemory";
 throw new Error(`Missing AI task copy for ${taskId}`);
}
