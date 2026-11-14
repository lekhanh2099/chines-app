import { describe, expect, it } from "vitest";

import { buildTextbookHref } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import {
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

import { collectTextbookDocuments } from "./collect-textbook-documents";

const catalog = getTextbookCatalog();
const documents = collectTextbookDocuments();
const byId = new Map(documents.map((document) => [document.item.id, document]));

function requireLesson(bookKey: Parameters<typeof getTextbookLesson>[0], lessonNumber: number) {
 const lesson = getTextbookLesson(bookKey, lessonNumber);
 if (!lesson) throw new Error(`Missing textbook lesson ${bookKey}:${lessonNumber}`);
 return lesson;
}

describe("collectTextbookDocuments", () => {
 it("indexes every lesson and every vocabulary entry of every book in the catalog", () => {
  expect(catalog.map((book) => book.key).sort()).toEqual(
   ["doc-hieu", "khau-ngu", "nhip-cau", "tm2", "tm3"].sort(),
  );
  for (const book of catalog) {
   for (const summary of book.lessons) {
    const lesson = requireLesson(summary.bookKey, summary.number);
    expect(byId.get(`textbook-lesson:${lesson.id}`)?.item.href).toBe(
     buildTextbookHref(lesson.bookKey, lesson.number),
    );
    const vocab = documents.filter(
     (document) =>
      document.item.kind === "vocab" &&
      document.item.id.startsWith("textbook-vocab:") &&
      document.item.metadata?.bookKey === lesson.bookKey &&
      document.item.metadata?.lessonNumber === lesson.number,
    );
    expect(vocab).toHaveLength(lesson.vocab.length);
   }
  }
  expect(new Set(documents.map((document) => document.item.id)).size).toBe(documents.length);
 });

 it("deep-links a block to its lesson, its section tab and its rendered anchor id", () => {
  const lesson = requireLesson("doc-hieu", 2);
  const section = lesson.sections.find((candidate) => candidate.category === "text");
  const block = section?.blocks.find((candidate) => candidate.text.includes("团聚"));
  if (!section || !block) throw new Error("Missing Đọc hiểu 团聚 fixture");
  const document = byId.get(`textbook-block:${block.id}`);
  expect(document?.item.kind).toBe("lesson_text");
  expect(document?.item.href).toBe(`/hsk/doc-hieu?lesson=2&tab=text#${block.id}`);
  expect(document?.body).toContain("团聚");
  expect(document?.body).toContain("đoàn tụ");
  expect(document?.item.subtitle).toContain("Đọc hiểu");
 });

 it("keeps exercise answers out of the indexed text", () => {
  const lesson = requireLesson("doc-hieu", 2);
  const block = lesson.sections
   .filter((section) => section.category === "practice")
   .flatMap((section) => section.blocks)
   .find((candidate) => candidate.text.startsWith("2. 团聚") && candidate.text.includes("→"));
  if (!block) throw new Error("Missing Đọc hiểu exercise fixture");
  const document = byId.get(`textbook-block:${block.id}`);
  expect(document?.item.kind).toBe("exercise");
  expect(document?.item.href).toBe(`/hsk/doc-hieu?lesson=2&tab=practice#${block.id}`);
  expect(document?.body).toContain("团聚");
  expect(document?.body).not.toContain("✓");
 });

 it("indexes a lesson added to the catalog without code changes", () => {
  const book = catalog.find((candidate) => candidate.key === "khau-ngu");
  const template = requireLesson("khau-ngu", 1);
  if (!book) throw new Error("Missing Khẩu ngữ book");
  const addedNumber = Math.max(...book.lessons.map((lesson) => lesson.number)) + 1;
  const added = {
   ...template,
   id: `khau-ngu-lesson-${addedNumber}`,
   number: addedNumber,
   vocab: template.vocab.map((entry) => ({ ...entry, id: `${entry.id}-added` })),
   sections: template.sections.map((section) => ({
    ...section,
    id: `${section.id}-added`,
    blocks: section.blocks.map((block) => ({ ...block, id: `${block.id}-added` })),
   })),
  };
  const extended = collectTextbookDocuments({
   catalog: [
    {
     ...book,
     lessons: [
      ...book.lessons,
      {
       id: added.id,
       bookKey: added.bookKey,
       number: added.number,
       title: added.title,
       vocabCount: added.vocab.length,
      },
     ],
    },
   ],
   getLesson: (bookKey, lessonNumber) =>
    lessonNumber === addedNumber ? added : getTextbookLesson(bookKey, lessonNumber),
  });
  expect(extended.find((document) => document.item.id === `textbook-lesson:${added.id}`)).toEqual(
   expect.objectContaining({
    item: expect.objectContaining({ href: buildTextbookHref("khau-ngu", addedNumber) }),
   }),
  );
  expect(
   extended.filter(
    (document) =>
     document.item.id.startsWith("textbook-vocab:") && document.item.id.endsWith("-added"),
   ),
  ).toHaveLength(added.vocab.length);
 });
});
