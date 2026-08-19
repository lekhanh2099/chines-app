import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_GEMINI_QUICK_MODEL } from "@/lib/gemini-models";

import { analyzeHanziBasicDetailed, generateAiConversationReply } from "./ai.service";
import type { UserApiKeyCredential } from "./user-api-keys.service";

const groqCredential: UserApiKeyCredential = {
 id: "groq-key",
 userId: "user-1",
 provider: "groq",
 label: "Groq fast lookup",
 maskedKey: "gsk_****test",
 isActive: true,
 priority: 0,
 defaultModel: "qwen/qwen3.6-27b",
 lastValidatedAt: null,
 createdAt: "2026-07-16T00:00:00.000Z",
 updatedAt: "2026-07-16T00:00:00.000Z",
 apiKey: "gsk_test",
};

const geminiCredential: UserApiKeyCredential = {
 ...groqCredential,
 id: "gemini-key",
 provider: "gemini",
 label: "Gemini secondary",
 defaultModel: "models/gemini-3.5-flash",
 apiKey: "AIza-test",
};

afterEach(() => {
 vi.unstubAllGlobals();
 vi.unstubAllEnvs();
});

describe("Groq lookup routing", () => {
 it("uses an active Groq key first for lookup requests", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     choices: [
      {
       message: {
        content: JSON.stringify({
         hanzi: "学习",
         pinyin: "xuéxí",
         meaning_summary: "học tập",
        }),
       },
      },
     ],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await analyzeHanziBasicDetailed("学习", {
   userApiKeys: [groqCredential],
   allowGroq: true,
  });

  expect(result.data?.meaning_summary).toBe("học tập");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.groq.com/openai/v1/chat/completions");
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
   model: "qwen/qwen3.6-27b",
  });
 });

 it("does not fall back when the selected Groq model fails", async () => {
  vi.stubEnv("GEMINI_API_KEY", "gemini-test");
  const fetchMock = vi
   .fn()
   .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
   .mockResolvedValueOnce(
    new Response(
     JSON.stringify({
      candidates: [
       {
        content: {
         parts: [
          {
           text: JSON.stringify({
            hanzi: "学习",
            pinyin: "xuéxí",
            meaning_summary: "học tập",
           }),
          },
         ],
        },
       },
      ],
     }),
     { status: 200 },
    ),
   );
  vi.stubGlobal("fetch", fetchMock);

  const result = await analyzeHanziBasicDetailed("学习", {
   userApiKeys: [groqCredential, geminiCredential],
   allowGroq: true,
  });

  expect(result.data).toBeNull();
  expect(result.error).toContain("Groq fast lookup");
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });

 it("uses the lightweight system model when no personal key is supplied", async () => {
  vi.stubEnv("GEMINI_API_KEY", "gemini-system-key");
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     candidates: [
      {
       content: {
        parts: [
         {
          text: JSON.stringify({
           hanzi: "学习",
           pinyin: "xuéxí",
           meaning_summary: "học tập",
          }),
         },
        ],
       },
      },
     ],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await analyzeHanziBasicDetailed("学习", {
   geminiModel: DEFAULT_GEMINI_QUICK_MODEL,
  });

  expect(result.data?.meaning_summary).toBe("học tập");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[0]).toContain(DEFAULT_GEMINI_QUICK_MODEL);
  const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(requestBody.systemInstruction.parts[0].text).toContain("lexicography engine");
  expect(requestBody.contents[0].role).toBe("user");
  expect(requestBody.contents[0].parts[0].text).not.toContain("lexicography engine");
 });

 it("requires a managed key for conversation and sends text mode", async () => {
  const missingKey = await generateAiConversationReply(
   [{ role: "user", content: "Giải thích 觉得 và 感觉" }],
   { userApiKeys: [] },
  );

  expect(missingKey.data).toBeNull();
  expect(missingKey.error).toContain("API key AI");

  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     choices: [{ message: { content: "觉得 (juéde) là cảm thấy hoặc cho rằng." } }],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await generateAiConversationReply(
   [
    { role: "user", content: "Giải thích 觉得 và 感觉" },
    { role: "assistant", content: "Mình sẽ giải thích ngắn gọn." },
   ],
   { userApiKeys: [groqCredential] },
  );

  expect(result.data).toContain("觉得");
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).not.toHaveProperty(
   "response_format",
  );
 });

 it("sends trusted persisted context as a real system message for OpenAI-compatible BYOK", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(JSON.stringify({ choices: [{ message: { content: "最近怎么样？" } }] }), {
    status: 200,
   }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const trustedContext = "[PRODUCT POLICY — HIGHEST PRIORITY]\nCharacter: 小林";

  const result = await generateAiConversationReply([{ role: "user", content: "你好" }], {
   userApiKeys: [groqCredential],
   systemContext: trustedContext,
  });

  expect(result.data).toBe("最近怎么样？");
  const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(requestBody.messages[0]).toEqual({ role: "system", content: trustedContext });
  expect(requestBody.messages[1].role).toBe("user");
  expect(requestBody.messages[1].content).toContain("Learner: 你好");
  expect(requestBody.messages[1].content).not.toContain("PRODUCT POLICY");
 });

 it("sends trusted persisted context through Gemini systemInstruction for Gemini BYOK", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     candidates: [{ content: { parts: [{ text: "最近怎么样？" }] } }],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);
  const trustedContext = "[PRODUCT POLICY — HIGHEST PRIORITY]\nCharacter: 小林";

  const result = await generateAiConversationReply([{ role: "user", content: "你好" }], {
   userApiKeys: [geminiCredential],
   systemContext: trustedContext,
  });

  expect(result.data).toBe("最近怎么样？");
  const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(requestBody.systemInstruction.parts[0].text).toBe(trustedContext);
  expect(requestBody.contents[0].role).toBe("user");
  expect(requestBody.contents[0].parts[0].text).toContain("Learner: 你好");
  expect(requestBody.contents[0].parts[0].text).not.toContain("PRODUCT POLICY");
 });
});
