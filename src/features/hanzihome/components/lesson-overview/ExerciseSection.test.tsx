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
});
