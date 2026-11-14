import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { hanziHomeVocabItemSchema } from "@/features/hanzihome/hanzihome-api.schemas";

import { VocabList } from "./VocabList";

const word = hanziHomeVocabItemSchema.parse({
 id: "vocab-01",
 runtimeId: "vocab-01",
 order: 1,
 hanzi: "学习",
 pinyin: "xuéxí",
 pos: "verb",
 tags: [],
 meaning: { meaning_vi: "học" },
 examples: [],
 category: "lesson",
});

describe("VocabList", () => {
 it("fits the desktop picker to its content before a user resizes it", () => {
  const html = renderToStaticMarkup(
   <VocabList
    words={[word]}
    selectedWordId={word.runtimeId}
    progress={{}}
    bookmarkedIds={[]}
    searchValue=""
    statusFilter="all"
    onSearchChange={vi.fn()}
    onStatusFilterChange={vi.fn()}
    onSelectWord={vi.fn()}
   />,
  );

  expect(html).toContain("max-height:520px");
  expect(html).not.toContain("height:192px");
  expect(html).toContain('aria-valuetext="Tự động theo nội dung"');
 });
});
