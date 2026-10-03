import { describe, expect, it } from "vitest";

import { createAiConversationVisibleStreamFilter } from "./ai-conversation-stream-filter";

function collect(chunks: readonly string[]) {
 const filter = createAiConversationVisibleStreamFilter();
 let visible = "";
 for (const chunk of chunks) visible += filter.push(chunk);
 visible += filter.flush();
 return visible;
}

describe("AI conversation visible stream filter", () => {
 it("suppresses a think block even when both tags are split across chunks", () => {
  const visible = collect(["你好<thi", "nk>internal", " reasoning</th", "ink>继续聊。"]);

  expect(visible).toBe("你好继续聊。");
 });

 it("does not mistake the word thinking for a think tag", () => {
  expect(collect(["Use <thinking> as ordinary text."])).toBe("Use <thinking> as ordinary text.");
 });

 it("strips a stray closing think tag across chunk boundaries without hiding visible text", () => {
  expect(collect(["前半句</thi", "nk>后半句"])).toBe("前半句后半句");
 });

 it("preserves ordinary less-than text that is not a think tag", () => {
  expect(collect(["1 < 2，继续聊天。"])).toBe("1 < 2，继续聊天。");
 });

 it("never flushes unfinished hidden reasoning", () => {
  const filter = createAiConversationVisibleStreamFilter();
  expect(filter.push("可见<think>不应该出现")).toBe("可见");
  expect(filter.flush()).toBe("");
 });
});
