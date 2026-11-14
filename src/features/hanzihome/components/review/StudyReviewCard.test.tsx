import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { hanziHomeVocabItemSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";

vi.mock("@/features/hanzihome/listening/MandarinSpeakButton", () => ({
 MandarinSpeakButton: ({ className }: { className?: string }) => (
  <button type="button" className={className}>
   Nghe
  </button>
 ),
}));

import { StudyReviewCard } from "./StudyReviewCard";
import { ReviewHeader } from "./ReviewHeader";

const source = hanziHomeVocabItemSchema.parse({
 id: "review-vocab-01",
 runtimeId: "review-vocab-01",
 order: 1,
 hanzi: "尽管",
 pinyin: "jǐnguǎn",
 pos: "conjunction",
 tags: [],
 meaning: { meaning_vi: "mặc dù" },
 examples: [
  {
   id: "review-vocab-01-example-01",
   order: 1,
   zh: "有问题你尽管问。",
   pinyin: "Yǒu wèntí nǐ jǐnguǎn wèn.",
   vi: "Có vấn đề gì thì bạn cứ hỏi.",
  },
 ],
 category: "lesson",
});

const item: ReviewItem = {
 type: "vocab",
 id: source.runtimeId,
 prompt: source.hanzi,
 answer: "jǐnguǎn · mặc dù",
 status: "new",
 source,
};

const touchHandlers = {
 onTouchStart: vi.fn(),
 onTouchEnd: vi.fn(),
};

describe("StudyReviewCard", () => {
 it("renders a compact mobile deck selector and keeps the desktop filters", () => {
  const html = renderToStaticMarkup(<ReviewHeader mode="grammar" onModeChange={vi.fn()} />);
  expect(html).toContain('role="combobox"');
  expect(html).toContain('aria-label="Ôn tập chủ động"');
  expect(html).toContain("hidden flex-wrap gap-2 sm:flex");
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain("Ngữ pháp");
 });
 it("does not offer a mode selector when the review is restricted to one deck", () => {
  const html = renderToStaticMarkup(
   <ReviewHeader
    mode="vocab"
    modes={[{ value: "vocab", label: "Từ vựng" }]}
    onModeChange={vi.fn()}
   />,
  );
  expect(html).not.toContain('role="combobox"');
 });
 it("keeps the reveal action and TTS button as sibling controls", () => {
  const html = renderToStaticMarkup(
   <StudyReviewCard
    item={item}
    revealed={false}
    onReveal={vi.fn()}
    onOpenDetail={vi.fn()}
    selectedWritingIndex={0}
    onSelectedWritingIndexChange={vi.fn()}
    touchHandlers={touchHandlers}
   />,
  );

  const firstButtonOpen = html.indexOf("<button");
  const firstButtonClose = html.indexOf("</button>", firstButtonOpen);
  const secondButtonOpen = html.indexOf("<button", firstButtonOpen + 1);

  expect(firstButtonOpen).toBeGreaterThanOrEqual(0);
  expect(firstButtonClose).toBeGreaterThan(firstButtonOpen);
  expect(secondButtonOpen).toBeGreaterThan(firstButtonClose);
  expect(html).toContain("font-hanzi");
  expect(html).toContain("尽管");
 });
});
