import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
 getBusinessChineseCatalog,
 getBusinessChineseCorpus,
 getBusinessChineseLesson,
} from "./business-chinese-static-content";

const expectedSectionHashes = [
 [
  "business-chinese-tm2-lesson-01",
  "4adca041633f693a1faa059291cc5bb926b7336175c5759fc1b3938a3ecae785",
 ],
 [
  "business-chinese-tm2-lesson-02",
  "3033942fb97580900d82bfab0ab5b588a66f63157c9807a87129b4b55938b418",
 ],
 [
  "business-chinese-tm2-lesson-03",
  "6662f5bbcddc0a9213fb7a83ce09adb3a0b897a2526ea40f390c1aa3ebb051a1",
 ],
 [
  "business-chinese-tm2-lesson-04",
  "e4eee51069f9d0a96a68d5e39f1bc33179ddd92fca5aaa4a3bf7b31048b9816c",
 ],
 [
  "business-chinese-tm2-lesson-05",
  "edaf221d05147c52591bb59bafaf552bc2c947b6c5ae1d58264ab2582d1a6072",
 ],
 [
  "business-chinese-tm2-lesson-06",
  "14f83488a64d96abe209f714c276f2558dc000176b6b65b72983401230140341",
 ],
 [
  "business-chinese-tm2-lesson-07",
  "fb4f5e9492d12649ecd7c2813ac4d01c9cc542d38bfa1061075bb06757ceefd5",
 ],
 [
  "business-chinese-tm2-lesson-08",
  "6b6184a4787c9f6b1760b98dd6b6973da814c49f2d3601a6fbcb4d93bd806423",
 ],
 [
  "business-chinese-tm2-lesson-09",
  "b9739b9a2f1bb34dca1181ef95ecae9ad6f7d8b2ffdc3018d5c259f505727687",
 ],
 [
  "business-chinese-tm2-lesson-10",
  "012ed8ce5fcefbe117de39197b3b329db3bae6b18d7e8d4da3eda9686f84ca00",
 ],
 [
  "business-chinese-tm3-lesson-01",
  "ae677cfda37520e7bfe7b675a791394ea9c9dd7d58c80fa3d711696fc2d03d00",
 ],
 [
  "business-chinese-tm3-lesson-02",
  "7a5fc93d789663ecac8b17081f1a74a47b79964812b8b00024ba9710407950eb",
 ],
 [
  "business-chinese-tm3-lesson-03",
  "fe405889b7ee4e194da8e97033e13d8ce9dd1de50d5069428907bc32cbe333d7",
 ],
 [
  "business-chinese-tm3-lesson-04",
  "177300c6b349602e2e1902a8ba19501deeeeebeaa88077c150396bdee1577c90",
 ],
 [
  "business-chinese-tm3-lesson-05",
  "84c62b142689cc92ed0ece585f723d221a4dbcc5383d805780b9451bd38a5523",
 ],
 [
  "business-chinese-tm3-lesson-06",
  "e67c9daae5368657e5e6af17f24557d0041491a7836dbb25175d932cc0a6b94b",
 ],
 [
  "business-chinese-tm3-lesson-07",
  "14d8bb7aaa9a3421bdbe1239290efdfa1f5962bdab21805e4c461fb9fa0162d5",
 ],
 [
  "business-chinese-tm3-lesson-08",
  "364e250e4aff1f708a8c5a88efb67650f7ce0ddbbcb8006f311d2bf08f7c47c2",
 ],
 [
  "business-chinese-tm3-lesson-09",
  "c18e940bcd77cb65876663069ad11187212c79fb60caa2fd4fe986d309996dd0",
 ],
 [
  "business-chinese-tm3-lesson-10",
  "490d6aea40a65833897f11ea19366b280a7243e60337ca0811a86570712a1058",
 ],
];

describe("Business Chinese static content", () => {
 it("keeps the reviewed two-book inventory", () => {
  const corpus = getBusinessChineseCorpus();
  const inventory = corpus.books.map((book) => {
   const blocks = book.lessons.flatMap((lesson) =>
    lesson.sections.flatMap((section) => section.blocks),
   );
   return {
    key: book.key,
    lessons: book.lessons.length,
    sections: book.lessons.reduce((total, lesson) => total + lesson.sections.length, 0),
    blocks: blocks.length,
    tables: blocks.filter((block) => block.type === "table").length,
    vocab: book.lessons.reduce((total, lesson) => total + lesson.vocab.length, 0),
   };
  });

  expect(corpus.meta).toMatchObject({ lessonCount: 20, vocabCount: 393 });
  expect(inventory).toEqual([
   { key: "tm2", lessons: 10, sections: 175, blocks: 1983, tables: 102, vocab: 167 },
   { key: "tm3", lessons: 10, sections: 170, blocks: 1890, tables: 111, vocab: 226 },
  ]);
  expect(getBusinessChineseCatalog().map((book) => book.lessons.length)).toEqual([10, 10]);
 });

 it("preserves representative source blocks, tables, and inline exercise answers", () => {
  const tm2Lesson1 = getBusinessChineseLesson("tm2", 1);
  const tm3Lesson1 = getBusinessChineseLesson("tm3", 1);
  if (!tm2Lesson1 || !tm3Lesson1) throw new Error("Expected both representative lessons.");
  const serializedTm2 = JSON.stringify(tm2Lesson1);

  expect(tm2Lesson1.title).toBe("BÀI 1: 订购真丝面料 (Đặt mua vải lụa tơ tằm)");
  expect(tm3Lesson1.title).toBe("BÀI 1: 开户汇款");
  expect(serializedTm2).toContain(
   "我们可以参观一下贵厂吗？ → Viết lại: 我们是否可以参观一下贵厂？",
  );
  expect(serializedTm2).toContain(
   '[["Mục","Nội dung chính"],["Chủ đề","Đặt hàng và thương lượng giá cả với nhà cung cấp"]',
  );
  expect(serializedTm2).toContain("✅ TỔNG KẾT BÀI 1");
 });

 it("removes only the audited export chatter and progress blocks", () => {
  const serialized = JSON.stringify(getBusinessChineseCorpus());

  expect(serialized).not.toContain("Vậy là tôi đã xuất");
  expect(serialized).not.toContain("Vậy là mình đã xuất");
  expect(serialized).not.toContain("TIẾN ĐỘ HOÀN THÀNH");
  expect(serialized).not.toContain("Bạn có muốn tôi tiếp tục xuất");
  expect(serialized).not.toContain("Bạn cần hỗ trợ thêm gì nữa không");
  expect(serialized).not.toContain("Bạn cần thêm bảng tổng hợp nào khác không");
  expect(serialized).not.toContain("TỔNG KẾT TOÀN BỘ QUYỂN 3");
  expect(serialized).toContain("Học idiom trước");
  expect(serialized).toContain("NHÓM 1: IDIOM - THÀNH NGỮ / TỤC NGỮ");
 });

 it("locks the ordered section payload for all twenty lessons", () => {
  const corpus = getBusinessChineseCorpus();
  const actualHashes = corpus.books.flatMap((book) =>
   book.lessons.map((lesson) => [
    lesson.id,
    createHash("sha256").update(JSON.stringify(lesson.sections)).digest("hex"),
   ]),
  );

  expect(actualHashes).toEqual(expectedSectionHashes);
 });
});
