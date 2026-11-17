import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getTextbookLesson } from "./business-chinese-static-content";
import { getTextbookCatalog } from "./textbook-catalog";

describe("textbook catalog", () => {
 it("lists every lesson of the bundled textbooks with the content's own id, title and vocabulary count", () => {
  const catalog = getTextbookCatalog();
  expect(catalog.map((book) => book.key)).toEqual([
   "tm2",
   "tm3",
   "nhip-cau",
   "doc-hieu",
   "khau-ngu",
  ]);
  for (const book of catalog) {
   for (const summary of book.lessons) {
    const lesson = getTextbookLesson(book.key, summary.number);
    expect(lesson).toMatchObject({ id: summary.id, title: summary.title, bookKey: book.key });
    expect(lesson?.vocab).toHaveLength(summary.vocabCount);
   }
  }
 });

 it("keeps lesson content out of client modules", () => {
  const offenders: string[] = [];
  const visit = (directory: string) => {
   for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|fixture)\.tsx?$/.test(entry.name)) {
     const source = readFileSync(file, "utf8");
     if (
      /^\s*["']use client["'];/m.test(source) &&
      /from "[^"]*business-chinese-static-content"/.test(source)
     ) {
      offenders.push(file);
     }
    }
   }
  };
  visit(path.resolve("src"));
  expect(offenders).toEqual([]);
 });
});
