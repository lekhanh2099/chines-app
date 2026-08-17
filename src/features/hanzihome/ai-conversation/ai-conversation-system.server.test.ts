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

  const result = await generateSystemAiConversationReply([
   { role: "user", content: "你好" },
  ]);

  expect(result).toEqual({ data: "你好，我们继续练习吧。", error: null });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain(SYSTEM_AI_CONVERSATION_MODEL);
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).not.toHaveProperty(
   "responseMimeType",
  );
 });

 it("reports the missing server key without throwing", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");

  const result = await generateSystemAiConversationReply([{ role: "user", content: "你好" }]);

  expect(result.data).toBeNull();
  expect(result.error).toContain("AI hệ thống chưa được cấu hình");
 });
});
