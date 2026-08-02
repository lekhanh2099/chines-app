import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";

import { BookSectionContent } from "./BookSectionContent";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";

describe("BookSectionContent", () => {
 it("renders Boya preparation content without exposing source provenance", () => {
  const section = SectionSchema.parse({
   id: "boya-9e-intermediate-1-l01-preparation",
   type: "communication",
   order: 1,
   title: "预习",
   title_vi: "Chuẩn bị trước khi đọc",
   items: [
    {
     id: "prep-note",
     type: "preparation_note",
     order: 1,
     zh: "这一课讲的是一个中国人到美国后的故事。",
     pinyin: "Zhè yī kè jiǎng de shì yī gè gùshì.",
     vi: "Bài học kể về câu chuyện của một người Trung Quốc ở Mỹ.",
     source_raw: "developer-only raw paragraph",
     source_paragraph_index: 6,
    },
    {
     id: "prep-table",
     type: "preparation_table",
     order: 2,
     columns: ["词语", "意思"],
     rows: [["困惑", "bối rối"]],
     source_table_index: 1,
    },
   ],
   source_paragraphs: [{ id: "p-6", text: "raw", order: 1 }],
  });

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <BookSectionContent
     section={section}
     displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: true }}
    />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("这一课讲的是一个中国人到美国后的故事。");
  expect(html).toContain("Bài học kể về câu chuyện");
  expect(html).toContain("<table");
  expect(html).toContain("困惑");
  expect(html).not.toContain("SOURCE RAW");
  expect(html).not.toContain("developer-only raw paragraph");
  expect(html).not.toContain("SOURCE PARAGRAPH INDEX");
 });

 it("renders both normalized Boya comparison table shapes exactly once", () => {
  const section = SectionSchema.parse({
   id: "boya-9e-comparison",
   type: "summary",
   order: 4,
   title: "词语辨析",
   title_vi: "Phân biệt từ",
   items: [],
   blocks: [
    {
     id: "comparison-intermediate",
     type: "vocabulary_comparison",
     order: 1,
     title: "词语辨析",
     tables: [
      [
       ["Từ", "Nghĩa"],
       ["愣", "sững sờ"],
      ],
     ],
     source_blocks: [{ kind: "table", table_index: 1 }],
    },
    {
     id: "comparison-advanced",
     type: "vocabulary_comparison",
     order: 2,
     title: "深邃 – 深刻",
     columns: ["Từ", "Nghĩa"],
     rows: [
      { id: "row-1", order: 1, cells: ["深邃", "sâu thẳm"] },
      { id: "row-2", order: 2, cells: ["深刻", "sâu sắc"] },
     ],
     examples_and_notes: [{ id: "note-1", text: "深邃的大海。", order: 1 }],
     source_table_index: 2,
    },
   ],
  });

  const html = renderToStaticMarkup(
   <BookSectionContent section={section} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />,
  );

  expect(html.match(/<table/g)).toHaveLength(2);
  expect(html.match(/深邃/g)).toHaveLength(3);
  expect(html).toContain("深邃的大海。");
  expect(html).not.toContain("SOURCE BLOCKS");
  expect(html).not.toContain("source_table_index");
  expect(html).not.toContain("table_index");
 });

 it("renders narrative paragraphs without adding labels to learner text", () => {
  const section = SectionSchema.parse({
   id: "lesson-text",
   type: "text",
   order: 1,
   title: "Bài khóa",
   blocks: [
    {
     id: "narrative-1",
     type: "text_narrative",
     order: 1,
     title: "好人难当",
     paragraphs: [
      { id: "paragraph-1", order: 1, zh: "第一段。", pinyin: "Dì yī duàn.", vi: "Đoạn một." },
      { id: "paragraph-2", order: 2, zh: "第二段。", pinyin: "Dì èr duàn.", vi: "Đoạn hai." },
     ],
    },
   ],
  });

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <BookSectionContent section={section} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("第一段。");
  expect(html).toContain("第二段。");
  expect(html).not.toContain("Đoạn 1");
  expect(html).not.toContain("Đoạn 2");
 });
});
