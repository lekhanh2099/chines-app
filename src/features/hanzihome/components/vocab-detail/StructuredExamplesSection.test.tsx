import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { hanziHomeVocabItemSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { StructuredExamplesSection } from "./StructuredExamplesSection";

const word = hanziHomeVocabItemSchema.parse({
 id: "vocab-example-font-01",
 runtimeId: "vocab-example-font-01",
 order: 1,
 hanzi: "尽管",
 pinyin: "jǐnguǎn",
 pos: "conjunction",
 tags: [],
 meaning: { meaning_vi: "mặc dù; cứ việc" },
 examples: [
  {
   id: "vocab-example-font-01-example-01",
   order: 1,
   zh: "尽管今天下雨，他还是骑自行车来了。",
   pinyin: "Jǐnguǎn jīntiān xiàyǔ, tā háishi qí zìxíngchē lái le.",
   vi: "Mặc dù hôm nay mưa, anh ấy vẫn đạp xe đến.",
   analysis_vi: "尽管……还是…… tạo quan hệ nhượng bộ.",
  },
 ],
 category: "lesson",
});

describe("StructuredExamplesSection", () => {
 it("renders Chinese example glyphs through the shared Hanzi font contract", () => {
  const html = renderToStaticMarkup(<StructuredExamplesSection item={word} keyword="尽管" />);

  expect(html).toContain('lang="zh-CN"');
  expect(html).toContain("font-hanzi");
  expect(html).toContain("<mark");
  expect(html).toContain("尽管");
  expect(html).toContain("今天下雨，他还是骑自行车来了。");
 });
});
