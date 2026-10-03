import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";

import {
 AI_CONVERSATION_MEMORY_EMBEDDING_MODEL,
 AI_CONVERSATION_MEMORY_EMBEDDING_VERSION,
 generateAiConversationMemoryEmbedding,
 serializeAiConversationMemoryEmbedding,
} from "./ai-conversation-embedding.server";
import {
 AiConversationMemoryPipelineNotReadyError,
 loadActiveAiConversationMemories,
 loadUnembeddedAiConversationMemories,
 matchAiConversationMemoriesExact,
 setAiConversationMemoryEmbedding,
} from "./ai-conversation-memory-persistence.server";
import type {
 AiConversationRecalledMemory,
 AiConversationStoredMemory,
} from "./ai-conversation-memory.schemas";

const RRF_K = 60;
const MAX_RECALLED_MEMORIES = 6;
const EXPLICIT_RECALL_PATTERN = /(?:还记得|记得我|你记得|còn nhớ|nhớ không|nhớ tôi|remember)/iu;
const EXPLICIT_FORGET_PATTERN =
 /(?:别记|不要记|别记住|不要记住|忘掉|忘了这个|忘记这个|đừng nhớ|đừng ghi nhớ|quên đi|hãy quên|forget this|don't remember|do not remember)/iu;

function normalizeSearchText(value: string) {
 return value.normalize("NFKC").toLocaleLowerCase("vi-VN").replace(/\s+/g, " ").trim();
}

function collectSearchFeatures(value: string): Set<string> {
 const normalized = normalizeSearchText(value);
 const features = new Set<string>();
 const hanRuns = normalized.match(/[\p{Script=Han}]+/gu) ?? [];

 for (const run of hanRuns) {
  for (let index = 0; index < run.length - 1; index += 1) {
   features.add(run.slice(index, index + 2));
  }
  for (let index = 0; index < run.length - 2; index += 1) {
   features.add(run.slice(index, index + 3));
  }
 }

 const wordRuns = normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
 for (const token of wordRuns) {
  if (/\p{Script=Han}/u.test(token)) continue;
  if (token.length >= 2) features.add(token);
 }

 return features;
}

export function rankAiConversationMemoriesLexically(
 query: string,
 memories: AiConversationStoredMemory[],
) {
 const normalizedQuery = normalizeSearchText(query);
 const queryFeatures = collectSearchFeatures(query);

 return memories
  .map((memory) => {
   const searchable = `${memory.memoryKey ?? ""} ${memory.content}`;
   const normalizedMemory = normalizeSearchText(searchable);
   const normalizedContent = normalizeSearchText(memory.content);
   const memoryFeatures = collectSearchFeatures(searchable);
   let overlap = 0;
   for (const feature of queryFeatures) {
    if (memoryFeatures.has(feature)) overlap += 1;
   }
   const exact =
    normalizedQuery.length >= 2 &&
    (normalizedMemory.includes(normalizedQuery) || normalizedQuery.includes(normalizedContent));
   const ratio = queryFeatures.size > 0 ? overlap / queryFeatures.size : 0;
   return { memory, exact, overlap, ratio };
  })
  .filter((candidate) => candidate.exact || candidate.overlap > 0)
  .sort((left, right) => {
   if (left.exact !== right.exact) return left.exact ? -1 : 1;
   if (left.ratio !== right.ratio) return right.ratio - left.ratio;
   if (left.overlap !== right.overlap) return right.overlap - left.overlap;
   if (left.memory.importance !== right.memory.importance) {
    return right.memory.importance - left.memory.importance;
   }
   return Date.parse(right.memory.updatedAt) - Date.parse(left.memory.updatedAt);
  })
  .map((candidate) => candidate.memory);
}

function mergeWithRrf({
 semantic,
 lexical,
 fallback,
}: {
 semantic: AiConversationRecalledMemory[];
 lexical: AiConversationStoredMemory[];
 fallback: AiConversationStoredMemory[];
}): AiConversationRecalledMemory[] {
 const scores = new Map<string, number>();
 const memories = new Map<string, AiConversationRecalledMemory>();

 const addRanked = (
  ranked: Array<AiConversationStoredMemory | AiConversationRecalledMemory>,
  semanticList: boolean,
 ) => {
  ranked.forEach((memory, index) => {
   scores.set(memory.id, (scores.get(memory.id) ?? 0) + 1 / (RRF_K + index + 1));
   const similarity = semanticList && "similarity" in memory ? memory.similarity : null;
   const previous = memories.get(memory.id);
   memories.set(memory.id, {
    ...memory,
    similarity: previous?.similarity ?? similarity,
   });
  });
 };

 addRanked(semantic, true);
 addRanked(lexical, false);

 if (scores.size === 0) {
  fallback.slice(0, MAX_RECALLED_MEMORIES).forEach((memory, index) => {
   scores.set(memory.id, 1 / (RRF_K + index + 1));
   memories.set(memory.id, { ...memory, similarity: null });
  });
 }

 return [...scores.entries()]
  .sort((left, right) => {
   if (left[1] !== right[1]) return right[1] - left[1];
   const leftMemory = memories.get(left[0]);
   const rightMemory = memories.get(right[0]);
   if (!leftMemory || !rightMemory) return 0;
   if (leftMemory.importance !== rightMemory.importance) {
    return rightMemory.importance - leftMemory.importance;
   }
   return Date.parse(rightMemory.updatedAt) - Date.parse(leftMemory.updatedAt);
  })
  .slice(0, MAX_RECALLED_MEMORIES)
  .flatMap(([id]) => {
   const memory = memories.get(id);
   return memory ? [memory] : [];
  });
}

export function isExplicitAiConversationForgetIntent(content: string) {
 return EXPLICIT_FORGET_PATTERN.test(content.normalize("NFC"));
}

export function isAiConversationLongTermMemoryEnabled({
 conversationPolicy,
 userPreference,
}: {
 conversationPolicy: "inherit" | "enabled" | "disabled";
 userPreference: boolean;
}) {
 if (conversationPolicy === "disabled") return false;
 if (conversationPolicy === "enabled") return true;
 return userPreference;
}

export async function retrieveRelevantAiConversationMemories({
 supabase,
 userId,
 characterId,
 query,
 enabled,
 suppressForForget,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 characterId: string;
 query: string;
 enabled: boolean;
 suppressForForget: boolean;
 signal?: AbortSignal;
}): Promise<AiConversationRecalledMemory[]> {
 if (!enabled || suppressForForget) return [];

 const active = await loadActiveAiConversationMemories({ userId, characterId, limit: 80 });
 if (active.length === 0) return [];

 const lexical = rankAiConversationMemoriesLexically(query, active);
 let semantic: AiConversationRecalledMemory[] = [];
 const embedding = await generateAiConversationMemoryEmbedding({
  supabase,
  userId,
  text: query,
  task: "RETRIEVAL_QUERY",
  signal,
 });

 if (embedding.available) {
  try {
   semantic = await matchAiConversationMemoriesExact({
    userId,
    characterId,
    queryEmbedding: serializeAiConversationMemoryEmbedding(embedding.values),
   });
  } catch (error) {
   if (!(error instanceof AiConversationMemoryPipelineNotReadyError)) throw error;
  }
 }

 const fallback = EXPLICIT_RECALL_PATTERN.test(query.normalize("NFC"))
  ? active.filter((memory) => memory.importance >= 0.65 && memory.confidence >= 0.65)
  : [];

 return mergeWithRrf({ semantic, lexical, fallback });
}

export async function enrichMissingAiConversationMemoryEmbeddings({
 supabase,
 userId,
 characterId,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 characterId: string;
 signal?: AbortSignal;
}) {
 try {
  const memories = await loadUnembeddedAiConversationMemories({
   userId,
   characterId,
   limit: 3,
  });
  let enriched = 0;

  for (const memory of memories) {
   const embedding = await generateAiConversationMemoryEmbedding({
    supabase,
    userId,
    text: memory.content,
    task: "RETRIEVAL_DOCUMENT",
    signal,
   });
   if (!embedding.available) break;

   const updated = await setAiConversationMemoryEmbedding({
    userId,
    memoryId: memory.id,
    embedding: serializeAiConversationMemoryEmbedding(embedding.values),
    model: AI_CONVERSATION_MEMORY_EMBEDDING_MODEL,
    version: AI_CONVERSATION_MEMORY_EMBEDDING_VERSION,
   });
   if (updated) enriched += 1;
  }

  return enriched;
 } catch (error) {
  if (error instanceof AiConversationMemoryPipelineNotReadyError) return 0;
  throw error;
 }
}
