import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiConversationStoredMemory } from "./ai-conversation-memory.schemas";

const {
 generateAiConversationMemoryEmbedding,
 loadActiveAiConversationMemories,
 loadUnembeddedAiConversationMemories,
 matchAiConversationMemoriesExact,
 setAiConversationMemoryEmbedding,
} = vi.hoisted(() => ({
 generateAiConversationMemoryEmbedding: vi.fn(),
 loadActiveAiConversationMemories: vi.fn(),
 loadUnembeddedAiConversationMemories: vi.fn(),
 matchAiConversationMemoriesExact: vi.fn(),
 setAiConversationMemoryEmbedding: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./ai-conversation-embedding.server", () => ({
 AI_CONVERSATION_MEMORY_EMBEDDING_MODEL: "gemini-embedding-001",
 AI_CONVERSATION_MEMORY_EMBEDDING_VERSION: 1,
 generateAiConversationMemoryEmbedding,
 serializeAiConversationMemoryEmbedding: (values: number[]) => `[${values.join(",")}]`,
}));
vi.mock("./ai-conversation-memory-persistence.server", () => ({
 AiConversationMemoryPipelineNotReadyError: class AiConversationMemoryPipelineNotReadyError extends Error {},
 loadActiveAiConversationMemories,
 loadUnembeddedAiConversationMemories,
 matchAiConversationMemoriesExact,
 setAiConversationMemoryEmbedding,
}));

import {
 enrichMissingAiConversationMemoryEmbeddings,
 isAiConversationLongTermMemoryEnabled,
 isExplicitAiConversationForgetIntent,
 retrieveRelevantAiConversationMemories,
} from "./ai-conversation-memory.server";

const badmintonMemory: AiConversationStoredMemory = {
 id: "11111111-1111-4111-8111-111111111111",
 characterId: null,
 kind: "preference",
 memoryKey: "user.sport.badminton",
 content: "我喜欢打羽毛球，每周会打几次。",
 importance: 0.8,
 confidence: 0.95,
 reinforcementCount: 2,
 updatedAt: "2026-08-18T01:00:00+00:00",
};
const coffeeMemory: AiConversationStoredMemory = {
 id: "22222222-2222-4222-8222-222222222222",
 characterId: null,
 kind: "preference",
 memoryKey: "user.drink.coffee",
 content: "我平时喜欢喝咖啡。",
 importance: 0.6,
 confidence: 0.9,
 reinforcementCount: 1,
 updatedAt: "2026-08-18T00:00:00+00:00",
};

const baseInput = {
 userId: "user-1",
 characterId: "33333333-3333-4333-8333-333333333333",
 query: "你还记得我喜欢打什么球吗？我以前说过羽毛球。",
 enabled: true,
 suppressForForget: false,
};

describe("AI conversation long-term memory retrieval", () => {
 beforeEach(() => {
  generateAiConversationMemoryEmbedding.mockReset();
  loadActiveAiConversationMemories.mockReset();
  loadUnembeddedAiConversationMemories.mockReset();
  matchAiConversationMemoriesExact.mockReset();
  setAiConversationMemoryEmbedding.mockReset();
 });

 it("resolves effective no-memory policy deterministically", () => {
  expect(
   isAiConversationLongTermMemoryEnabled({ conversationPolicy: "inherit", userPreference: true }),
  ).toBe(true);
  expect(
   isAiConversationLongTermMemoryEnabled({ conversationPolicy: "inherit", userPreference: false }),
  ).toBe(false);
  expect(
   isAiConversationLongTermMemoryEnabled({ conversationPolicy: "disabled", userPreference: true }),
  ).toBe(false);
  expect(
   isAiConversationLongTermMemoryEnabled({ conversationPolicy: "enabled", userPreference: false }),
  ).toBe(true);
 });

 it("skips all retrieval when memory is disabled or suppressed by explicit forget", async () => {
  expect(
   await retrieveRelevantAiConversationMemories({ ...baseInput, enabled: false }),
  ).toEqual([]);
  expect(
   await retrieveRelevantAiConversationMemories({ ...baseInput, suppressForForget: true }),
  ).toEqual([]);
  expect(loadActiveAiConversationMemories).not.toHaveBeenCalled();
  expect(generateAiConversationMemoryEmbedding).not.toHaveBeenCalled();
 });

 it("recalls an obvious Chinese memory through lexical fallback when embeddings are unavailable", async () => {
  loadActiveAiConversationMemories.mockResolvedValue([coffeeMemory, badmintonMemory]);
  generateAiConversationMemoryEmbedding.mockResolvedValue({ available: false, reason: "missing-key" });

  const result = await retrieveRelevantAiConversationMemories(baseInput);

  expect(result[0]?.id).toBe(badmintonMemory.id);
  expect(result.some((memory) => memory.id === badmintonMemory.id)).toBe(true);
  expect(matchAiConversationMemoriesExact).not.toHaveBeenCalled();
 });

 it("fuses semantic and lexical candidates without duplicating one stored memory", async () => {
  loadActiveAiConversationMemories.mockResolvedValue([badmintonMemory, coffeeMemory]);
  generateAiConversationMemoryEmbedding.mockResolvedValue({ available: true, values: [0.1, 0.2] });
  matchAiConversationMemoriesExact.mockResolvedValue([
   { ...badmintonMemory, similarity: 0.9 },
   { ...coffeeMemory, similarity: 0.72 },
  ]);

  const result = await retrieveRelevantAiConversationMemories(baseInput);

  expect(result.filter((memory) => memory.id === badmintonMemory.id)).toHaveLength(1);
  expect(result[0]?.id).toBe(badmintonMemory.id);
 });

 it("recognizes explicit forget wording before prompt construction", () => {
  expect(isExplicitAiConversationForgetIntent("忘掉我刚才说喜欢羽毛球的事。" )).toBe(true);
  expect(isExplicitAiConversationForgetIntent("Đừng nhớ chuyện tôi vừa kể nha." )).toBe(true);
  expect(isExplicitAiConversationForgetIntent("今天想聊羽毛球。" )).toBe(false);
 });

 it("enriches a bounded set of missing memory embeddings opportunistically", async () => {
  loadUnembeddedAiConversationMemories.mockResolvedValue([badmintonMemory]);
  generateAiConversationMemoryEmbedding.mockResolvedValue({ available: true, values: [0.25, 0.5] });
  setAiConversationMemoryEmbedding.mockResolvedValue(true);

  const result = await enrichMissingAiConversationMemoryEmbeddings({
   userId: "user-1",
   characterId: baseInput.characterId,
  });

  expect(result).toBe(1);
  expect(setAiConversationMemoryEmbedding).toHaveBeenCalledWith(
   expect.objectContaining({
    memoryId: badmintonMemory.id,
    model: "gemini-embedding-001",
    version: 1,
   }),
  );
 });
});
