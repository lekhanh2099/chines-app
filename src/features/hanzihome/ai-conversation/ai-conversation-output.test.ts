import { describe, expect, it } from "vitest";

import { sanitizeAiConversationReply } from "./ai-conversation-output";

describe("sanitizeAiConversationReply", () => {
 it("removes closed think blocks and keeps the learner-facing answer", () => {
  expect(
   sanitizeAiConversationReply(
    "<think>internal reasoning that must never be rendered</think>\n\n你好！很高兴见到你。",
   ),
  ).toBe("你好！很高兴见到你。");
 });

 it("fails closed when a provider returns an unclosed think block", () => {
  expect(sanitizeAiConversationReply("<think>internal reasoning without a closing tag")).toBe("");
 });

 it("leaves ordinary assistant replies unchanged", () => {
  expect(sanitizeAiConversationReply("你好，我们继续练习吧。")).toBe("你好，我们继续练习吧。");
 });
});
