import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExerciseSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";

import { DEFAULT_LESSON_DISPLAY_MODE } from "../types";
import { PhoneticsExerciseBody } from "./PhoneticsExerciseBody";

describe("PhoneticsExerciseBody", () => {
 it("renders normalized Boya questions without leaking import metadata", () => {
  const item = ExerciseSchema.parse({
   id: "boya-intermediate-2-l01-src-005",
   type: "phonetics",
   order: 5,
   title: "根据拼音写出词语",
   title_vi: "Viết từ theo pinyin",
   instruction: { zh: "", vi: "Điền từ thích hợp." },
   questions: [
    {
     id: "boya-intermediate-2-l01-src-005-q01",
     order: 1,
     prompt: "我的词汇量不够,你有什么记生词的好 ( )?",
     answer: null,
     source_ref: "boya-intermediate-2-l01-p06",
     source_page: 6,
     source_pages: [{ pdfPage: 24, printedPage: 6 }],
     source_assets: ["assets/boya-intermediate-2/textbook/page-024.webp"],
     answer_origin: "manual",
    },
   ],
  });

  const html = renderToStaticMarkup(
   <PhoneticsExerciseBody item={item} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />,
  );

  expect(html).toContain("我的词汇量不够");
  expect(html).not.toContain("boya-intermediate-2-l01-p06");
  expect(html).not.toContain("pdfPage");
  expect(html).not.toContain("source_assets");
  expect(html).not.toContain("ANSWER ORIGIN");
 });
});
