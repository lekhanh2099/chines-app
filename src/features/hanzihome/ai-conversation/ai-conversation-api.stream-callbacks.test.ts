import { afterEach, describe, expect, it, vi } from "vitest";

import { sendPersistedAiConversationMessage } from "./ai-conversation-api";

const conversationId = "11111111-1111-4111-8111-111111111111";
const clientMessageId = "22222222-2222-4222-8222-222222222222";

function ndjsonResponse(events: object[]) {
 return new Response(`${events.map((event) => JSON.stringify(event)).join("\n")}\n`, {
  headers: { "Content-Type": "application/x-ndjson" },
 });
}

describe("conversation stream callback lifecycle", () => {
 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("exposes a stop handle, forwards visible deltas and always closes presentation state", async () => {
  const userMessage = {
   id: "33333333-3333-4333-8333-333333333333",
   seq: 1,
   role: "user",
   content: "你好",
   createdAt: "2026-08-19T08:00:00+00:00",
  };
  const assistantMessage = {
   id: "44444444-4444-4444-8444-444444444444",
   seq: 2,
   role: "assistant",
   content: "你好，今天怎么样？",
   createdAt: "2026-08-19T08:00:01+00:00",
  };
  const turn = {
   conversationId,
   userMessage,
   assistantMessage,
   provider: "Groq",
   model: "openai/gpt-oss-20b",
   apiKeyId: "55555555-5555-4555-8555-555555555555",
   usage: null,
  };
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(
    ndjsonResponse([
     { type: "start", conversationId, userMessage },
     { type: "delta", text: "你好，" },
     { type: "delta", text: "今天怎么样？" },
     { type: "final", turn },
    ]),
   ),
  );
  const onDelta = vi.fn();
  const onStreamReady = vi.fn();
  const onStreamEnd = vi.fn();

  const result = await sendPersistedAiConversationMessage(
   conversationId,
   { clientMessageId, content: "你好" },
   { onDelta, onStreamReady, onStreamEnd },
  );

  expect(result).toEqual(turn);
  expect(onStreamReady).toHaveBeenCalledTimes(1);
  expect(onStreamReady.mock.calls[0]?.[0]).toEqual(expect.any(Function));
  expect(onDelta.mock.calls.flat()).toEqual(["你好，", "今天怎么样？"]);
  expect(onStreamEnd).toHaveBeenCalledTimes(1);
 });

 it("calls the presentation cleanup callback even when the stream request fails", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(Response.json({ error: "unavailable" }, { status: 503 })),
  );
  const onStreamEnd = vi.fn();

  await expect(
   sendPersistedAiConversationMessage(
    conversationId,
    { clientMessageId, content: "你好" },
    { onStreamEnd },
   ),
  ).rejects.toThrow();

  expect(onStreamEnd).toHaveBeenCalledTimes(1);
 });
});
