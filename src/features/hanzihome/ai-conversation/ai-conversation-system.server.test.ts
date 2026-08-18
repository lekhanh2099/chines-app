import { afterEach, describe, expect, it, vi } from "vitest";

import {
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_MODEL,
} from "./ai-conversation-system.server";

vi.mock("server-only", () => ({}));

afterEach(() => {
 vi.unstubAllGlobals();
 vi.unstubAllEnvs();
});

describe("system AI conversation", () => {
 it("uses the configured Gemini system key in text mode", async () => {
  vi.stubEnv("GEMINI_API_KEY", "gemini-system-key");
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     candidates: [
      {
       content: {
        parts: [{ text: "你好，我们继续练习吧。" }],
       },
      },
     ],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await generateSystemAiConversationReply([{ role: "user", content: "你好" }]);

  expect(result).toEqual({ data: "你好，我们继续练习吧。", error: null });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain(SYSTEM_AI_CONVERSATION_MODEL);
  const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(requestBody.generationConfig).not.toHaveProperty("responseMimeType");
  expect(requestBody.systemInstruction.parts[0].text).toContain("conversation partner");
  expect(requestBody.contents[0].role).toBe("user");
  expect(requestBody.contents[0].parts[0].text).toContain("Learner: 你好");
 });

 it("keeps a supplied trusted context in Gemini systemInstruction instead of user content", async () => {
  vi.stubEnv("GEMINI_API_KEY", "gemini-system-key");
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     candidates: [
      {
       content: {
        parts: [{ text: "最近怎么样？" }],
       },
      },
     ],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);
  const trustedContext = "[PRODUCT POLICY — HIGHEST PRIORITY]\nCharacter: 小林";

  const result = await generateSystemAiConversationReply(
   [{ role: "user", content: "你好" }],
   undefined,
   trustedContext,
  );

  expect(result.data).toBe("最近怎么样？");
  const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(requestBody.systemInstruction.parts[0].text).toBe(trustedContext);
  expect(requestBody.contents[0].parts[0].text).not.toContain("PRODUCT POLICY");
  expect(requestBody.contents[0].parts[0].text).toContain("Learner: 你好");
 });

 it("reports the missing server key without throwing", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");

  const result = await generateSystemAiConversationReply([{ role: "user", content: "你好" }]);

  expect(result.data).toBeNull();
  expect(result.error).toContain("AI hệ thống chưa được cấu hình");
 });
});
