import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { getTextbookCatalog, getTextbookLesson } from "./business-chinese-static-content";

const expectedVocabularyHashes = [
 "76b2fbf5704c44d9214fc620a63ac21c4d2a7dfaabff47f4a2d69c95586e98f0",
 "e8bb695d48842699e0be4cda9f151a0df7c2666e0840b57a310b99ec6989b4d4",
 "58f075a835d389e3b0a2fa84c9e78aea4650c68e66f5af0f30471ceb0a1006ce",
 "d45d8faa9aae9803cd377242940ef4e6cf036f3cc46058b9449c6c8b0ecbbf0e",
 "f6e698175b65158fa6ac9eba4d40be7009271b85aeae3a9c09e2a44cb7297a8a",
 "2c19dd9dd3f0f316b8f8db84938cb4dd88abf0cbec228b9afe4a9c2fa629efd0",
 "48ec4e55e74481e3aa252f4e127501e83ecf41fa7d52baafaad96ad583d09be4",
 "855c0d26a61c3f578a96ef4e63b457847cedb204545f910205d8c65605bc5dc2",
 "7b1ca4695d608c55f60111671b75e6f86f60aa82ceccf696ea4c30c67822b315",
 "58706bff00e26dbc423550e411974cdbd1837475ac278045359acc78c1f44c38",
 "9cea1363dc36ba4b2a8d61965b42e4e3cf80864ef85f67706399aa6700e4e43e",
 "c9b42cbd9f79a2a95eca5c92767acbaadfd7f5dc9f6ac7a78012ed7cb550dd51",
 "2d52880c671ad0b17eda9ae5804dcca9c1d881c9974f7e2bcf523d55ac68c648",
 "53a41cb601adde7bd93a23f4a3e2ca01c986f201973c0416b9f7549a7044815a",
 "19ef0fc7eef2734e333d719a67c7cb76bfd1c43b9dd8d359cdd8db0c4728d2d2",
];

const expectedSectionHashes = [
 "b8211a80d108880f0344b3ca9680c3c752e393317da6b76c512bb5023c1c3a4d",
 "b6e8d3b79ea9362e00ba44cce0e8c7a45de7257987a08db68cd6d34d2e762a7b",
 "68acc8ce974af8bcef3c30110650e9b69f9d0dc98ce0ec6a1210776f060d1569",
 "5d760370cf95200a95cef6ec3d35c628d84f42dff6e598ef94ad6e85b9f639d4",
 "ff529695add9b4f5605f4f51827b8d954a96a7769cf7ab91dd154a5b6528325c",
 "75ac9b1e4abdb90677414e29437d6d2e1cc096895c0b4964020f326bf3cadd73",
 "5ce5f3ad2bc9b91557ab486c2c55763d4ad556233b6a1265748c7d951264631f",
 "3e1794aa728c125d2ce543d1baa7ecd35965548e7820968738c5fd3734e4108c",
 "8ccbb888544ee5286594a9c23053010cb53406b83afd39eb98dd9c1e41e4046c",
 "2d41d841b8d874a161dc84bfc259b1f91a520a0dc9eecad3c62471c396b55547",
 "3bd33ab7ede8bd48ceb2e2e59ac45f5ef7e960b272e1d014e979b215ef8d4bb3",
 "c7afd7b2479339962783f52b0ce18c7f82692966c6948950eba7a4145e85dc0a",
 "a4d7a269468a74fdcd2c8be0a15b1a84f3d10bc9e8f752318e8187f3a23498d2",
 "1430fd666b44fe7e9fc6ffdb33d5b59ddbc1a8389be59aa3a58828eee98810a8",
 "8fe53da18066523b639bd77312cb0a259c598da5be4e46bc7488dc194eda61fe",
];

const lessons = Array.from({ length: 15 }, (_, index) => {
 const lesson = getTextbookLesson("nhip-cau", index + 1);
 if (!lesson) throw new Error(`Missing Nhịp cầu lesson ${index + 1}.`);
 return lesson;
});

describe("Nhịp cầu static content", () => {
 it("keeps all fifteen source lessons and all 831 authoritative workbook rows", () => {
  const catalog = getTextbookCatalog().find((book) => book.key === "nhip-cau");
  expect(catalog?.lessons).toHaveLength(15);
  expect(lessons.map((lesson) => lesson.vocab.length)).toEqual([
   60, 43, 64, 62, 59, 58, 54, 65, 57, 59, 63, 50, 42, 71, 24,
  ]);
  expect(lessons.flatMap((lesson) => lesson.vocab)).toHaveLength(831);
  expect(lessons.map((lesson) => lesson.sections.map((section) => section.category))).toEqual(
   Array.from({ length: 15 }, () => ["text", "vocab", "vocab", "grammar", "text", "practice"]),
  );
  const blocks = lessons.flatMap((lesson) => lesson.sections.flatMap((section) => section.blocks));
  expect(blocks).toHaveLength(5837);
  expect(blocks.filter((block) => block.type === "table")).toHaveLength(69);
  expect(new Set(blocks.map((block) => block.id)).size).toBe(blocks.length);
 });

 it("preserves exact lexical values and order from the workbook, including blank parts of speech", () => {
  expect(
   lessons.map((lesson) =>
    createHash("sha256")
     .update(
      JSON.stringify(
       lesson.vocab.map((word) => [word.hanzi, word.pinyin, word.pos, word.hanviet, word.meaning]),
      ),
     )
     .digest("hex"),
   ),
  ).toEqual(expectedVocabularyHashes);
  expect(lessons.flatMap((lesson) => lesson.vocab).filter((word) => !word.pos)).toHaveLength(65);
  for (const lesson of lessons) {
   const table = lesson.sections
    .flatMap((section) => section.blocks)
    .find((block) => block.id === `${lesson.id}-workbook-vocab`);
   expect(table?.rows.slice(1).map((row) => row.slice(1, 6))).toEqual(
    lesson.vocab.map((word) => [word.hanzi, word.pinyin, word.pos, word.hanviet, word.meaning]),
   );
   expect(new Set(lesson.vocab.map((word) => `${word.hanzi}:${word.pinyin}`)).size).toBe(
    lesson.vocab.length,
   );
  }
 });

 it("preserves source meanings and tags actual dialogue without treating narrative colons as speakers", () => {
  const reading = lessons.flatMap((lesson) =>
   lesson.sections
    .filter((section) => section.category === "text")
    .flatMap((section) => section.blocks),
  );
  expect(reading).toHaveLength(720);
  expect(reading.filter((block) => block.translation)).toHaveLength(614);
  expect(reading.filter((block) => block.speaker)).toHaveLength(209);
  for (const block of reading) expect(typeof block.translation).toBe("string");
  const narrative = reading.find((block) => block.text.includes("仿佛跳着舞在向我讲述："));
  expect(narrative?.speaker).toBeUndefined();
  expect(narrative?.translation).toContain(":");
  expect(reading.find((block) => block.id === "nhip-cau-lesson-01-source-565")).toMatchObject({
   speaker: "老师",
   text: '同学们，你们知道什么是"东西"吗？',
   translation: 'Các em, các em có biết "đông tây" là gì không?',
  });
 });

 it("keeps source supplementary annotations distinct from workbook vocabulary", () => {
  const annotationRows = lessons.flatMap((lesson) => {
   const blocks = lesson.sections
    .filter((section) => section.category === "vocab")
    .flatMap((section) => section.blocks);
   return blocks.flatMap((block, index) =>
    block.text.includes("chú giải bài đọc từ tài liệu gốc (ngoài Excel)")
     ? (blocks[index + 1]?.rows.slice(1) ?? [])
     : [],
   );
  });
  expect(annotationRows).toHaveLength(33);
  expect(annotationRows).toContainEqual([
   "娘家",
   "niángjia",
   "nhà mẹ đẻ (của phụ nữ đã lấy chồng)",
   "nương gia",
  ]);
  expect(annotationRows).toContainEqual([
   "付三押一",
   "fù sān yā yī",
   "trả ba tháng tiền thuê và thế chân một tháng (hợp đồng thuê nhà)",
   "phó tam áp nhất",
  ]);
  const lesson2 = lessons.find((lesson) => lesson.number === 2);
  expect(lesson2?.vocab.some((word) => word.hanzi === "娘家")).toBe(false);
  expect(JSON.stringify(lessons)).toContain("中国青少年发展基金会");
  expect(JSON.stringify(lessons)).toContain("Tên riêng (专名)");
 });

 it("uses existing hidden-answer data without inventing listening blanks", () => {
  const practice = lessons.flatMap((lesson) =>
   lesson.sections
    .filter((section) => section.category === "practice")
    .flatMap((section) => section.blocks),
  );
  expect(
   practice.find((block) => block.id === "nhip-cau-lesson-01-source-697")?.answerColumnIndexes,
  ).toEqual([2, 3]);
  expect(practice.find((block) => block.id === "nhip-cau-lesson-06-source-686")?.text).toBe(
   "字谜答案： → 告\n尖\n也",
  );
  const completedListening = practice.filter((block) =>
   block.text.includes("Câu hoàn chỉnh trong tài liệu nguồn; không có vị trí trống"),
  );
  expect(completedListening).toHaveLength(3);
  for (const block of completedListening) expect(block.text).toContain(" → (1)");
 });

 it("locks the reconciled source sections and excludes only export chatter and progress", () => {
  expect(
   lessons.map((lesson) =>
    createHash("sha256").update(JSON.stringify(lesson.sections)).digest("hex"),
   ),
  ).toEqual(expectedSectionHashes);
  const serialized = JSON.stringify(lessons);
  expect(serialized).not.toContain("ĐÃ HOÀN THÀNH BÀI");
  expect(serialized).not.toContain("Trạng thái");
  expect(serialized).not.toContain("Mức nhớ");
  expect(serialized).not.toContain("_Giữ lần đầu");
 });
});
