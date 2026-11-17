import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { courseBookKeySchema, courseBookSchema } from "./course-book.schema";

const directory = fileURLToPath(new URL("../static-json/courses/", import.meta.url));
// `catalog.json` and `legacy-routes.json` are indexes, not books.
const files = readdirSync(directory).filter(
 (file) => file.endsWith(".json") && file !== "catalog.json" && file !== "legacy-routes.json",
);

describe("generated course books", () => {
 it("has one file per course book key", () => {
  expect(files.map((file) => file.replace(/\.json$/u, "")).sort()).toEqual(
   [...courseBookKeySchema.options].sort(),
  );
 });

 it.each(files)("%s matches the textbook contract and has unique block ids", (file) => {
  const book = courseBookSchema.parse(JSON.parse(readFileSync(path.join(directory, file), "utf8")));
  expect(`${book.key}.json`).toBe(file);
  const blockIds = book.lessons.flatMap((lesson) =>
   lesson.sections.flatMap((section) => section.blocks.map((block) => block.id)),
  );
  expect(new Set(blockIds).size).toBe(blockIds.length);
  const lessonIds = book.lessons.map((lesson) => lesson.id);
  expect(new Set(lessonIds).size).toBe(lessonIds.length);
  for (const lesson of book.lessons) {
   expect(lesson.sections.every((section) => section.blocks.length > 0)).toBe(true);
   expect(new Set(lesson.vocab.map((word) => word.id)).size).toBe(lesson.vocab.length);
  }
 });
});
