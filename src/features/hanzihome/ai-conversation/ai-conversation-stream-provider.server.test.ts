import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import {
 AiConversationProviderStreamError,
 streamAiConversationProviderReply,
} from "./ai-conversation-stream-provider.server";

const groqRuntime: ResolvedUserAiRuntime = {
 keyId: "11111111-1111-4111-8111-111111111111",
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq cá nhân",
 maskedKey: "gsk_****1234",
 model: "openai/gpt-oss-20b",
 priority: 0,
 apiKey: "user-groq-key",
 capabilities: [
  "conversation",
  "daily-reading-translation",
  "daily-reading-learning",
  "lookup",
  "structured-memory",
 ],
};

const geminiRuntime: ResolvedUserAiRuntime = {
 ...groqRuntime,
 provider: "gemini",
 providerLabel: "Google Gemini",
 label: "Gemini cá nhân",
 maskedKey: "AIza****1234",
 model: "models/gemini-2.5-flash",
 apiKey: "user-gemini-key",
 capabilities: [...groqRuntime.capabilities, "semantic-memory"],
};

function sseResponse(chunks: readonly string[]) {
 const encoder = new TextEncoder();
 let index = 0;
 const body = new ReadableStream<Uint8Array>({
  pull(controller) {
   const chunk = chunks[index];
   if (chunk === undefined) {
    controller.close();
    return;
   }
   index += 1;
   controller.enqueue(encoder.encode(chunk));
  },
 });
 return new Response(body, {
  status: 200,
  headers: { "Content-Type": "text/event-stream" },
 });
}

async function collect(input: Parameters<typeof streamAiConversationProviderReply>[0]) {
 const chunks: string[] = [];
 for await (const chunk of streamAiConversationProviderReply(input)) chunks.push(chunk);
 return chunks.join("");
}

describe("AI conversation provider stream", () => {
 beforeEach(() => {
  process.env.GEMINI_API_KEY = "system-key-that-must-not-be-used";
  vi.stubGlobal("fetch", vi.fn());
 });

 afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  vi.unstubAllGlobals();
 });

 it("streams only visible Groq content and uses the resolved personal key", async () => {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(
   sseResponse([
    'data: {"choices":[{"delta":{"reasoning_content":"secret","content":"你好"}}]}\r',
    '\n\r\ndata: {"choices":[{"delta":{"content":"！"}}]}\r\n\r\n',
    "data: [DONE]\r\n\r\n",
   ]),
  );

  const text = await collect({
   runtime: groqRuntime,
   messages: [{ role: "user", content: "你好" }],
   systemPrompt: "Stay in Chinese.",
  });

  expect(text).toBe("你好！");
  expect(text).not.toContain("secret");
  const init = fetchMock.mock.calls[0]?.[1];
  expect(init?.headers).toMatchObject({ Authorization: "Bearer user-groq-key" });
  const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
  expect(body).toMatchObject({ model: groqRuntime.model, stream: true });
 });

 it("classifies an invalid personal key without leaking provider response detail", async () => {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(
   new Response('{"error":"sensitive provider detail"}', {
    status: 401,
    headers: { "Content-Type": "application/json" },
   }),
  );

  let caught: Error | null = null;
  try {
   await collect({
    runtime: groqRuntime,
    messages: [{ role: "user", content: "你好" }],
    systemPrompt: "Stay in Chinese.",
   });
  } catch (error) {
   caught = error instanceof Error ? error : new Error("unexpected error");
  }

  expect(caught).toBeInstanceOf(AiConversationProviderStreamError);
  expect(caught).toMatchObject({ code: "invalid-key", status: 401 });
  expect(caught?.message).not.toContain("sensitive provider detail");
 });

 it("uses only the resolved personal Gemini key and yields streamed model text", async () => {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(
   sseResponse([
    'data: {"candidates":[{"content":{"parts":[{"text":"当然"}]}}]}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"可以。"}]}}]}\n\n',
   ]),
  );

  const text = await collect({
   runtime: geminiRuntime,
   messages: [{ role: "user", content: "可以聊聊吗？" }],
   systemPrompt: "Stay natural.",
  });

  expect(text).toBe("当然可以。");
  const url = String(fetchMock.mock.calls[0]?.[0] ?? "");
  const init = fetchMock.mock.calls[0]?.[1];
  expect(url).not.toContain("user-gemini-key");
  expect(url).not.toContain("system-key-that-must-not-be-used");
  expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("user-gemini-key");
 });
});
