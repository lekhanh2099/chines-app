import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { getTextbookCatalog, getTextbookLesson } from "./business-chinese-static-content";

const readingLessons = Array.from({ length: 18 }, (_, index) => {
 const lesson = getTextbookLesson("doc-hieu", index + 1);
 if (!lesson) throw new Error(`Expected reading comprehension unit ${index + 1}.`);
 return lesson;
});

const reviewedPayloadHashes = [
 "b1beef32355df102896d85e390bf6d757004ebfb9c9de504daa63a7b49d0c3b0",
 "9adb3030df72d8df106fc18e31505edefca972f7908c30a6e4e1ea0dcbb8c65f",
 "31fd1fc18f1ba416bbff1b4d968048742068050f1dda1a5b50af50a218f1318e",
 "94bb82ed90e7cee12df0342f5e305a599576960d0329d541180960ab54226c86",
 "019d8f37733be2ac0f510f4786260b1e275d08f13b83bbad7452deb89d49ae71",
 "fef535ea5f1b4e4238979741b7d0d512c9d4ea9fbb0264fb09929ebb4ba2e5aa",
 "92b8bc9d103fd7f28d53c366a6dbc684c9b066b20600090fd0329fc8e0c9faea",
 "8c9199ed7fe63237813b292ac989d2de490f7a78d77c3aaafc231e0c8d95602b",
 "1cb91f88dc1a8e053a00ccfc155e4591fdae489a923721590f5d11c03589755c",
 "d4e1e7016f4d0d413bbebd0dba1a9a5ed3d349e1905ea4d282ea13174dbfcd2a",
 "37affecd4f825903c2dc9abced931ecf9e058380a2ce1e7a1718d11e26b142af",
 "2fead6c1335ae0c0335c8c437ca3f493490be7751b989a4ac1f255e5f47de296",
 "aa2e82e8abe7d283a25418db06837e465ed5083e3bd059744679830cdfcec5ca",
 "6f975f128d50f7168b4784f4fe6069d5c2f53288547fded85477fb10523d45c5",
 "110049096a99b91c6a5d39f06782793373928bbe42ddd6dca711824ccd405856",
 "22b83235c47afbb6c11bf02920b692f0130a57e73e65629b16be425945515b37",
 "7898eb1a2b51ef4a19d101914bc74b3a4ff1d7554d5bc4e34981d6cbaf79a698",
 "aa2a059db0982c5bc65caa10ff69068f64f63df353758c382667e11c65b51c55",
];

describe("Đọc hiểu static content", () => {
 it("keeps all eighteen units, seventy-three articles, and the Excel vocabulary inventory", () => {
  expect(getTextbookCatalog().find((book) => book.key === "doc-hieu")?.lessons).toHaveLength(18);
  expect(
   readingLessons.map(
    (lesson) => lesson.sections.filter((section) => section.category === "text").length,
   ),
  ).toEqual([5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  expect(readingLessons.map((lesson) => lesson.vocab.length)).toEqual([
   49, 58, 80, 78, 66, 67, 79, 80, 79, 51, 50, 52, 59, 61, 84, 94, 76, 77,
  ]);
  const sections = readingLessons.flatMap((lesson) => lesson.sections);
  const blocks = sections.flatMap((section) => section.blocks);
  const vocabulary = readingLessons.flatMap((lesson) => lesson.vocab);
  expect(sections).toHaveLength(165);
  expect(blocks).toHaveLength(2251);
  expect(vocabulary).toHaveLength(1240);
  const ids = [...readingLessons, ...sections, ...blocks, ...vocabulary].map((node) => node.id);
  expect(new Set(ids).size).toBe(ids.length);
 });

 it("uses the same spreadsheet rows for the vocabulary list and its complete article-labelled table", () => {
  for (const lesson of readingLessons) {
   const table = lesson.sections.find((section) => section.category === "vocab")?.blocks[0];
   expect(table?.rows[0]).toEqual([
    "Tên bài",
    "Nghĩa tên bài",
    "STT",
    "Từ",
    "Pinyin",
    "Từ loại",
    "Hán Việt",
    "Nghĩa",
   ]);
   expect(table?.rows.slice(1).map((row) => row.slice(3))).toEqual(
    lesson.vocab.map((word) => [word.hanzi, word.pinyin, word.pos, word.hanviet, word.meaning]),
   );
   expect(table?.rows.slice(1).every((row) => row[0].length > 0 && row[1].length > 0)).toBe(true);
  }
  expect(readingLessons[0].vocab[0]).toMatchObject({
   hanzi: "白天",
   pinyin: "báitiān",
   hanviet: "Bạch thiên",
   meaning: "ban ngày",
   pos: "",
   traditional: "",
  });
 });

 it("preserves aligned meanings, untranslated notes, and both numeric tuition tables", () => {
  const textBlocks = readingLessons.flatMap((lesson) =>
   lesson.sections
    .filter((section) => section.category === "text")
    .flatMap((section) => section.blocks),
  );
  expect(textBlocks).toHaveLength(418);
  expect(textBlocks.every((block) => typeof block.translation === "string")).toBe(true);
  expect(textBlocks.filter((block) => block.translation)).toHaveLength(415);
  expect(textBlocks.filter((block) => block.translation === "").map((block) => block.text)).toEqual(
   ["注释：", "大专：大学专科的简称，一般学习时间是2～3年。", "函照：信件和照片。"],
  );
  const taibai = readingLessons[10].sections.find(
   (section) => section.id === "doc-hieu-unit-11-article-01-text",
  );
  expect(taibai?.blocks).toHaveLength(1);
  expect(taibai?.blocks[0].translation?.split("\n\n")).toHaveLength(4);
  const fees = readingLessons[0].sections.find(
   (section) => section.id === "doc-hieu-unit-01-article-04-fees",
  );
  expect(fees?.category).toBe("overview");
  expect(fees?.blocks.map((block) => block.rows)).toEqual([
   [
    ["四周", "八周", "十二周", "一学期", "一学年"],
    ["$420", "$760", "$920", "$1300", "$2300"],
   ],
   [
    ["4 tuần", "8 tuần", "12 tuần", "1 học kỳ", "1 năm"],
    ["420", "760", "920", "1300", "2300"],
   ],
  ]);
 });

 it("separates all annotated answers from prompts and marks answer-bearing table columns", () => {
  const practice = readingLessons.flatMap((lesson) =>
   lesson.sections
    .filter((section) => section.category === "practice")
    .flatMap((section) => section.blocks),
  );
  const exercises = practice.filter(
   (block) => block.type === "paragraph" && block.text.includes("→"),
  );
  expect(exercises).toHaveLength(1564);
  for (const block of exercises) {
   const separator = block.text.indexOf("→");
   expect(block.text.slice(0, separator)).not.toMatch(/[✓✔✅❌]|Đáp án/iu);
   expect(block.text.slice(separator + 1).trim().length).toBeGreaterThan(0);
  }
  const tables = practice.filter((block) => block.type === "table");
  expect(tables).toHaveLength(6);
  expect(tables.every((block) => block.answerColumnIndexes?.length && block.text.length)).toBe(
   true,
  );
  for (const table of tables) {
   expect(practice.filter((block) => block.text === table.text)).toEqual([table]);
  }
  expect(
   tables.find((block) => block.id === "doc-hieu-unit-08-article-01-practice-block-211")
    ?.answerColumnIndexes,
  ).toEqual([0, 1]);
  expect(
   exercises.find((block) => block.id === "doc-hieu-unit-02-article-01-practice-block-193")?.text,
  ).toBe("她去 ____ 给公婆买礼物。 → 她去 超市 给公婆买礼物。");
 });

 it("excludes export progress chatter but retains the source's incomplete-exercise notice", () => {
  const serialized = JSON.stringify(readingLessons);
  expect(serialized).not.toContain("Đã xong toàn bộ");
  expect(serialized).not.toContain("Bạn muốn tiếp Unit");
  expect(serialized).not.toContain("Chúc mừng! Bạn đã hoàn thành");
  expect(serialized).not.toContain("Chưa học");
  expect(serialized).not.toContain("Mức nhớ");
  expect(serialized).toContain("Do sách scan có thể bị lỗi một phần");
 });

 it("locks the ordered reviewed source and spreadsheet payload for every unit", () => {
  expect(
   readingLessons.map((lesson) =>
    createHash("sha256")
     .update(JSON.stringify({ sections: lesson.sections, vocab: lesson.vocab }))
     .digest("hex"),
   ),
  ).toEqual(reviewedPayloadHashes);
 });
});
