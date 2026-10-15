import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
 buildBusinessChineseReaderDocument,
 buildTextbookHref,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import {
 dictationSourcesFromTextbook,
 translationSegmentsFromTextbook,
} from "@/features/hanzihome/practice/translation-practice";
import {
 createTextbookPersonalNoteContent,
 createTextbookReadingContent,
} from "@/features/hanzihome/components/notes/lessonNoteContent";
import { getTextbookCatalog, getTextbookLesson } from "./business-chinese-static-content";

const book = getTextbookCatalog().find((item) => item.key === "khau-ngu");
if (!book) throw new Error("Missing Khẩu ngữ book.");
const allLessons = book.lessons.map((summary) => {
 const lesson = getTextbookLesson("khau-ngu", summary.number);
 if (!lesson) throw new Error(`Missing Khẩu ngữ unit ${summary.number}.`);
 return lesson;
});

const lessons = [3, 5, 7, 8, 9].map((number) => {
 const lesson = getTextbookLesson("khau-ngu", number);
 if (!lesson) throw new Error(`Missing Khẩu ngữ source lesson ${number}.`);
 return lesson;
});

const reviewedVocabularyHashes = [
 "fe4ee7536a4f10b38690bc7ffe3e5a168483bafb7e5cb50f3d1dac05e2c138ff",
 "dfcf044064287d77acfeffa6033281832ec461a285a990ffe02b77495eb243fd",
 "027a5fbd39315dc9e86f5b6831c6b1d78f126b5fb62a13ceaad70c5aa4727591",
 "e31b13ac5ec4e462e20e72098280e9709f43c1191de99a3b1b43fccd9401b46a",
 "bce8f14a480e335d3026a7c3a243348939e34a4d9ccb7a3ce3e0b4fff027f984",
];

const reviewedSectionHashes = [
 "88cd21d427070562b628e0fb579ce2db1e4b87bb627ddb6da43eba92d8810adb",
 "783985f19350dbcd9995000d3046ce6b9e32cd5888bd6b59e0b55889f5e5f49c",
 "e3952e9692542b0f2d254ead107085a91b77832a6cd3f1be6ef2ae3e8578820e",
 "cb42d9e34caa1000f3371291c0df8350dc41f017c77e083be165430812c7c8ca",
 "cd060e859c31a062607bd00f701dee8c8b98439ec38503cce2cbabcb59f01bbe",
];

describe("Khẩu ngữ static content", () => {
 it("includes all twenty lessons and four reviews in the original source order", () => {
  expect(book.label).toBe("Khẩu ngữ Trung cấp 1");
  expect(book.lessons.map((lesson) => lesson.number)).toEqual([
   1, 2, 3, 4, 5, 21, 6, 7, 8, 9, 10, 22, 11, 12, 13, 14, 15, 23, 16, 17, 18, 19, 20, 24,
  ]);
  expect(allLessons.filter((lesson) => lesson.number <= 20).map((lesson) => lesson.number)).toEqual(
   Array.from({ length: 20 }, (_, index) => index + 1),
  );
  expect(allLessons.filter((lesson) => lesson.number > 20).map((lesson) => lesson.title)).toEqual([
   "ÔN TẬP 1: 我来介绍一下",
   "ÔN TẬP 2: 我的新房子",
   "ÔN TẬP 3: 昨天我有个约会",
   "ÔN TẬP 4: 国际婚姻",
  ]);
  const nodes = allLessons.flatMap((lesson) => [
   lesson,
   ...lesson.vocab,
   ...lesson.sections,
   ...lesson.sections.flatMap((section) => section.blocks),
  ]);
  expect(new Set(nodes.map((node) => node.id)).size).toBe(nodes.length);
 });

 it("preserves all five school lessons with their original numbers and 142 vocabulary rows", () => {
  expect(lessons.map((lesson) => lesson.vocab.length)).toEqual([31, 29, 28, 24, 30]);
  expect(lessons.flatMap((lesson) => lesson.vocab)).toHaveLength(142);
  expect(lessons.map((lesson) => lesson.title)).toEqual([
   "BÀI 3: 好东西人人爱吃",
   "BÀI 5: 你喜欢逛商店吗？",
   "BÀI 7: 让我们轻松一下",
   "BÀI 8: 计划赶不上变化",
   "BÀI 9: 大手大脚还是精打细算",
  ]);
  for (const lesson of lessons) {
   expect(lesson.sections.map((section) => section.category)).toEqual([
    "overview",
    "vocab",
    "text",
    "grammar",
    "practice",
   ]);
  }
  const sections = lessons.flatMap((lesson) => lesson.sections);
  const blocks = sections.flatMap((section) => section.blocks);
  const vocabulary = lessons.flatMap((lesson) => lesson.vocab);
  const ids = [...lessons, ...sections, ...blocks, ...vocabulary].map((node) => node.id);
  expect(sections).toHaveLength(25);
  expect(blocks).toHaveLength(381);
  expect(new Set(ids).size).toBe(ids.length);
 });

 it("keeps the source vocabulary order, exact lexical fields, and blank parts of speech", () => {
  expect(lessons.map((lesson) => lesson.vocab.filter((word) => !word.pos).length)).toEqual([
   4, 7, 5, 0, 8,
  ]);
  for (const lesson of allLessons) {
   const table = lesson.sections.find((section) => section.category === "vocab")?.blocks[0];
   expect(table?.rows[0]).toEqual(["STT", "Hán tự", "Pinyin", "Từ loại", "Hán Việt", "Dịch nghĩa"]);
   expect(table?.rows.slice(1)).toEqual(
    lesson.vocab.map((word, index) => [
     String(index + 1),
     word.hanzi,
     word.pinyin,
     word.pos,
     word.hanviet,
     word.meaning,
    ]),
   );
   expect(lesson.vocab.every((word) => word.traditional === "" && word.hanviet === "")).toBe(true);
   expect(new Set(lesson.vocab.map((word) => `${word.hanzi}:${word.pinyin}`)).size).toBe(
    lesson.vocab.length,
   );
  }
  expect(lessons[0].vocab[17]).toMatchObject({
   hanzi: "麻婆豆腐",
   pinyin: "mápó dòufu",
   pos: "",
   meaning: "đậu hủ Mapo",
  });
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
  ).toEqual(reviewedVocabularyHashes);
 });

 it("keeps each introduction visible before all sixteen texts and all thirty-two notes", () => {
  expect(
   lessons.map(
    (lesson) =>
     lesson.sections
      .filter((section) => section.category === "text")
      .flatMap((section) => section.blocks)
      .filter((block) => block.type === "subheading").length,
   ),
  ).toEqual([3, 4, 3, 3, 3]);
  expect(
   lessons.map(
    (lesson) =>
     lesson.sections
      .filter((section) => section.category === "grammar")
      .flatMap((section) => section.blocks)
      .filter((block) => block.type === "subheading").length,
   ),
  ).toEqual([7, 6, 5, 7, 7]);
  for (const lesson of lessons) {
   expect(lesson.intro).toEqual([]);
   expect(lesson.sections[0]?.blocks).toHaveLength(1);
   expect(lesson.sections[0]?.blocks[0]?.text.length).toBeGreaterThan(0);
  }
  expect(lessons[0].sections[0]?.blocks[0]?.text).toBe(
   "好东西人人爱吃，可是光会吃还不行，还要会说。到了餐厅怎么点菜？怎么向别人说你喜欢吃什么？等你们学会了，我请你们尝尝我的手艺。",
  );
 });

 it("preserves unfinished exercises and the precise underlined targets without supplying answers", () => {
  const practiceByLesson = lessons.map((lesson) =>
   lesson.sections
    .filter((section) => section.category === "practice")
    .flatMap((section) => section.blocks),
  );
  expect(
   practiceByLesson.map((blocks) =>
    blocks.reduce((count, block) => count + (block.text.match(/_+/gu)?.length ?? 0), 0),
   ),
  ).toEqual([3, 27, 4, 8, 8]);
  expect(
   practiceByLesson[0].flatMap((block) =>
    [...block.text.matchAll(/【([^】]+)】/gu)].map((match) => match[1]),
   ),
  ).toEqual(["我喜欢吃", "不想吃东西", "没问题", "糟", "很拿手"]);
  expect(
   practiceByLesson[3].flatMap((block) =>
    [...block.text.matchAll(/【([^】]+)】/gu)].map((match) => match[1]),
   ),
  ).toEqual(["不但", "晚上", "肯定", "说一声"]);
  expect(practiceByLesson[0].find((block) => block.id === "khau-ngu-lesson-03-p07-b15")?.text).toBe(
   "（1）A：我们去吃涮羊肉怎么样？\nB：________________。",
  );
  const blocks = lessons.flatMap((lesson) => lesson.sections.flatMap((section) => section.blocks));
  for (const block of blocks) {
   expect(block.answerColumnIndexes).toBeUndefined();
   expect(block.translation ?? "").toBe("");
   expect(block.text).not.toContain("→");
  }
 });

 it("keeps all twelve menu items, their prices, the complete recipe, and the weekly timetable", () => {
  const menu = lessons[0].sections
   .filter((section) => section.category === "practice")
   .flatMap((section) => section.blocks)
   .filter((block) => block.type === "table");
  expect(menu.map((block) => ({ title: block.text, rows: block.rows }))).toEqual([
   {
    title: "凉菜",
    rows: [
     ["菜名", "价格"],
     ["凉拌海带丝", "9元"],
     ["小葱拌豆腐", "8元"],
     ["皮蛋豆腐", "10元"],
     ["凉拌苦瓜", "12元"],
     ["鸡丝黄瓜", "13元"],
     ["四川泡菜", "6元"],
    ],
   },
   {
    title: "热菜",
    rows: [
     ["菜名", "价格"],
     ["铁板牛柳", "28元"],
     ["红烧茄子", "18元"],
     ["宫爆鸡丁", "20元"],
     ["松鼠桂鱼", "98元"],
     ["家常豆腐", "16元"],
     ["蒜茸豆苗", "15元"],
    ],
   },
  ]);
  const recipe = lessons[0].sections
   .flatMap((section) => section.blocks)
   .find((block) => block.id === "khau-ngu-lesson-03-p09-b06");
  expect(recipe?.text).toBe(
   "［做法］把油菜洗净，切成3厘米长的段。葱、姜、蒜切成末。把白糖、米醋、酱油、味精、精盐、水淀粉调成汁。把20克油放到锅里烧热，然后把油菜放到锅里炒一炒，等菜变了颜色马上盛出来放在盘子里。锅里再放油15克烧热，把豆瓣酱、葱、姜、蒜一起放入锅中，等有了香味，再把调好的酱油、醋汁放到锅里炒一炒，最后把盘里的油菜再放到锅里炒几下就做成了。",
  );
  const timetable = lessons[3].sections
   .filter((section) => section.category === "practice")
   .flatMap((section) => section.blocks)
   .find((block) => block.type === "table");
  expect(timetable?.rows).toEqual([
   ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
   ["上午", "上课", "上课", "上课", "实验", "上课", "", ""],
   ["下午", "上课", "实验", "上课", "上课", "实验", "", ""],
   ["晚上", "游泳", "自习", "实验", "游泳", "", "游泳", ""],
  ]);
 });

 it("keeps the school advertisements and ships all eight source images at their declared dimensions", () => {
  const schoolImageBlocks = lessons
   .flatMap((lesson) => lesson.sections.flatMap((section) => section.blocks))
   .filter((block) => block.image);
  expect(
   schoolImageBlocks.map((block) => [block.image?.src, block.image?.width, block.image?.height]),
  ).toEqual([
   ["/textbooks/khau-ngu/lesson-05-advertisements.png", 1190, 468],
   ["/textbooks/khau-ngu/lesson-07-advertisement.png", 790, 624],
   ["/textbooks/khau-ngu/lesson-09-advertisements.png", 1175, 790],
  ]);
  const imageBlocks = allLessons
   .flatMap((lesson) => lesson.sections.flatMap((section) => section.blocks))
   .filter((block) => block.image);
  expect(imageBlocks).toHaveLength(8);
  const serviceWorker = readFileSync(new URL("../../../../public/sw.js", import.meta.url), "utf8");
  for (const block of imageBlocks) {
   if (!block.image) throw new Error(`Missing source image for ${block.id}.`);
   expect(block.type).toBe("paragraph");
   expect(block.text).toBe("");
   const file = readFileSync(new URL(`../../../../public${block.image.src}`, import.meta.url));
   expect(Array.from(file.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
   expect(file.readUInt32BE(16)).toBe(block.image.width);
   expect(file.readUInt32BE(20)).toBe(block.image.height);
   expect(block.image.alt.length).toBeGreaterThan(0);
   expect(serviceWorker).toContain(`"${block.image.src}"`);
  }
 });

 it("keeps the complete source vocabulary, text and note inventory, including separate proper names", () => {
  const coreLessons = allLessons.filter((lesson) => lesson.number <= 20);
  expect(coreLessons.map((lesson) => lesson.vocab.length)).toEqual([
   29, 28, 31, 46, 29, 35, 28, 24, 30, 34, 24, 38, 33, 32, 38, 34, 36, 38, 44, 46,
  ]);
  expect(allLessons.flatMap((lesson) => lesson.vocab)).toHaveLength(730);
  expect(
   coreLessons.map(
    (lesson) =>
     lesson.sections
      .filter((section) => section.category === "text")
      .flatMap((section) => section.blocks)
      .filter((block) => block.type === "subheading").length,
   ),
  ).toEqual([4, 4, 3, 3, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 4, 3, 4]);
  expect(
   coreLessons.map(
    (lesson) =>
     lesson.sections
      .filter((section) => section.category === "grammar")
      .flatMap((section) => section.blocks)
      .filter((block) => block.type === "subheading").length,
   ),
  ).toEqual([6, 6, 7, 6, 6, 7, 5, 7, 7, 4, 7, 6, 9, 7, 4, 6, 7, 5, 5, 5]);
  for (const [number, name] of [
   [1, "瑞典"],
   [18, "麦当劳"],
  ] satisfies [number, string][]) {
   const lesson = getTextbookLesson("khau-ngu", number);
   expect(lesson?.vocab.some((word) => word.hanzi === name)).toBe(false);
   expect(
    lesson?.sections.some((section) =>
     section.blocks.some(
      (block) => block.type === "table" && block.rows.some((row) => row.includes(name)),
     ),
    ),
   ).toBe(true);
  }
 });

 it("keeps review vocabulary, questions and source answers without turning reviews into Bài 21–24", () => {
  const reviews = allLessons.filter((lesson) => lesson.number > 20);
  expect(reviews.map((lesson) => lesson.vocab.length)).toEqual([8, 25, 11, 9]);
  for (const review of reviews) {
   expect(review.id).toMatch(/^khau-ngu-review-0[1-4]$/u);
   expect(review.rawTitle).toMatch(/^复习[一二三四]$/u);
   for (const content of [
    createTextbookReadingContent(review),
    createTextbookPersonalNoteContent(review),
   ]) {
    expect(JSON.stringify(content)).toContain(review.title);
    expect(JSON.stringify(content)).not.toContain(`Bài ${review.number}`);
   }
  }
  const lastReview = getTextbookLesson("khau-ngu", 24);
  if (!lastReview) throw new Error("Missing fourth review.");
  const answers = lastReview.sections
   .filter((section) => section.category === "practice")
   .flatMap((section) => section.blocks)
   .filter((block) => block.text.includes("→"));
  expect(answers.map((block) => block.text.split("→")[1]?.trim())).toEqual([
   "a",
   "c",
   "d",
   "正确答案：1. a　2. c　3. d",
  ]);
  const document = buildBusinessChineseReaderDocument(lastReview, "all");
  for (const block of answers) {
   const segment = document.segments.find((item) => item.id === `${block.id}:prompt`);
   expect(segment?.zh).toBeTruthy();
   expect(segment?.zh).not.toContain("→");
   expect(segment?.zh).not.toContain("正确答案：");
  }
 });

 it("preserves explicit dialogue speakers and source text in Reader with the original lesson href", () => {
  expect(
   lessons.map(
    (lesson) =>
     lesson.sections
      .filter((section) => section.category === "text")
      .flatMap((section) => section.blocks)
      .filter((block) => block.speaker).length,
   ),
  ).toEqual([16, 20, 12, 8, 14]);
  for (const lesson of allLessons) {
   const document = buildBusinessChineseReaderDocument(lesson, "text");
   const textBlocks = lesson.sections
    .filter((section) => section.category === "text")
    .flatMap((section) => section.blocks);
   expect(document.id).toBe(`${lesson.id}:text`);
   expect(document.source.sourceId).toBe(lesson.id);
   expect(document.source.href).toBe(`/hsk/khau-ngu-tc1?lesson=${lesson.number}`);
   expect(buildTextbookHref(lesson.bookKey, lesson.number)).toBe(document.source.href);
   expect(document.segments.map((segment) => segment.id)).toEqual(
    textBlocks.map((block) => block.id),
   );
   for (const block of textBlocks) {
    const segment = document.segments.find((candidate) => candidate.id === block.id);
    expect(block.translation).toBe("");
    expect(segment?.zh).toBe(block.text);
    expect(segment?.speechText).toBe(block.text);
    expect(segment?.speaker?.label ?? "").toBe(block.speaker ?? "");
    expect(segment?.vi).toBeUndefined();
   }
   expect(translationSegmentsFromTextbook(lesson)).toEqual([]);
  }
 });

 it("covers every source reading block in dictation without speaking image filenames or alt text", () => {
  for (const lesson of allLessons) {
   const sources = dictationSourcesFromTextbook(lesson);
   const textSection = lesson.sections.find((section) => section.category === "text");
   if (!textSection) throw new Error(`Missing source text section for ${lesson.id}.`);
   const entries = sources.find((source) => source.id === textSection.id)?.entries ?? [];
   for (const block of textSection.blocks) {
    const sentences = entries.filter(
     (entry) => entry.id === block.id || entry.id.startsWith(`${block.id}:sentence-`),
    );
    expect(sentences.length).toBeGreaterThan(0);
    expect(
     sentences
      .map((entry) => entry.zh)
      .join("")
      .replace(/\s/gu, ""),
    ).toBe(block.text.replace(/\s/gu, ""));
   }
   const document = buildBusinessChineseReaderDocument(lesson, "all");
   const imageBlocks = lesson.sections
    .flatMap((section) => section.blocks)
    .filter((block) => block.image);
   for (const block of imageBlocks) {
    expect(document.segments.some((segment) => segment.id === block.id)).toBe(false);
    expect(sources.flatMap((source) => source.entries).some((entry) => entry.id === block.id)).toBe(
     false,
    );
   }
   expect(sources.flatMap((source) => source.entries).every((entry) => entry.vi === "")).toBe(true);
  }
 });

 it("locks all ordered sections reviewed against the Vietnamese source packet", () => {
  expect(
   lessons.map((lesson) =>
    createHash("sha256").update(JSON.stringify(lesson.sections)).digest("hex"),
   ),
  ).toEqual(reviewedSectionHashes);
 });

 it("locks the fifteen additional lessons and four reviews checked against the complete source scan", () => {
  const additionalLessons = allLessons.filter((lesson) => ![3, 5, 7, 8, 9].includes(lesson.number));
  expect(additionalLessons).toHaveLength(19);
  expect(createHash("sha256").update(JSON.stringify(additionalLessons)).digest("hex")).toBe(
   "5cbf39adff091ff676ea9d279e727525f489d5f23a76575bfded37403303d027",
  );
 });
});
