import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
 AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS,
 AI_CONVERSATION_MEMORY_EMBEDDING_MODEL,
 generateAiConversationMemoryEmbedding,
} from "./ai-conversation-embedding.server";

describe("AI conversation memory embedding adapter", () => {
 const originalGeminiKey = process.env.GEMINI_API_KEY;

 beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-gemini-key";
  vi.unstubAllGlobals();
 });

 afterEach(() => {
  if (originalGeminiKey === undefined) {
   delete process.env.GEMINI_API_KEY;
  } else {
   process.env.GEMINI_API_KEY = originalGeminiKey;
  }
 });

 it("uses a stable retrieval task and 768-dimensional Gemini embedding contract", async () => {
  const values = Array.from(
   { length: AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS },
   (_, index) => index / AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS,
  );
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ embedding: { values } }));
  vi.stubGlobal("fetch", fetchMock);

  const result = await generateAiConversationMemoryEmbedding({
   text: "我喜欢打羽毛球。",
   task: "RETRIEVAL_DOCUMENT",
  });

  expect(result).toMatchObject({ available: true });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain(`models/${AI_CONVERSATION_MEMORY_EMBEDDING_MODEL}:embedContent`);
  const body = JSON.parse(init.body);
  expect(body).toMatchObject({
   model: `models/${AI_CONVERSATION_MEMORY_EMBEDDING_MODEL}`,
   embedContentConfig: {
    taskType: "RETRIEVAL_DOCUMENT",
    outputDimensionality: 768,
    autoTruncate: true,
   },
  });
 });

 it("does not require an embedding runtime for lexical-only memory continuity", async () => {
  delete process.env.GEMINI_API_KEY;
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  await expect(
   generateAiConversationMemoryEmbedding({ text: "羽毛球", task: "RETRIEVAL_QUERY" }),
  ).resolves.toEqual({ available: false, reason: "missing-key" });
  expect(fetchMock).not.toHaveBeenCalled();
 });
});
