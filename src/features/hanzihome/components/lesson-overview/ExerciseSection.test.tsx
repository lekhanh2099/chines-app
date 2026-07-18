import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExerciseSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";

import { ExerciseCard } from "./ExerciseSection";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";

describe("ExerciseCard", () => {
 it("uses the Chinese exercise title instead of page metadata mislabeled as Vietnamese", () => {
  const item = ExerciseSchema.parse({
   id: "boya-preintermediate-2-l01-src-004",
   type: "fill_blank",
   order: 4,
   title: "选择合适的动词填空,并说说句子中“出来”的意思:",
   title_vi: "Trang bài tập 9",
   instruction: {
    zh: "选择合适的动词填空,并说说句子中“出来”的意思:",
    vi: "Trang bài tập 9",
   },
   questions: [],
  });

  const html = renderToStaticMarkup(
   <ExerciseCard item={item} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />,
  );

  expect(html).toContain("选择合适的动词填空");
  expect(html).not.toContain("Trang bài tập 9");
 });

 it("applies the selected Hanzi font and size to questions and answers", () => {
  const item = ExerciseSchema.parse({
   id: "boya-9e-intermediate-1-l01-exercise-07",
   type: "fill_blank",
   order: 7,
   title: "用提示词完成句子",
   title_vi: "Hoàn thành câu",
   instruction: { zh: "", vi: "" },
   questions: [
    {
     id: "question-1",
     prompt: "他在美国待了三年，__________。（居然）",
     answer: "居然一句英语都不会说。",
    },
   ],
  });
  const displayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   showAnswers: true,
   hanziFont: "songti" as const,
   hanziSize: "xl" as const,
  };

  const html = renderToStaticMarkup(<ExerciseCard item={item} displayMode={displayMode} />);

  expect(html).toContain("他在美国待了三年");
  expect(html).toContain("居然一句英语都不会说");
  expect(html).toContain("font-size:clamp(1.375rem, 4vw, 1.75rem)");
  expect(html).toContain("Hanzi Songti");
 });
});
