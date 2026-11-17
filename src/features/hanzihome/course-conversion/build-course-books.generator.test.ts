import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

import { convertCourseBooks } from "./convert-course-book";
import { courseExportSchema, courseExportTables } from "./course-export.schema";
import { renderCoverageReport } from "./coverage-report";

const exportDirectory = process.env.COURSE_EXPORT_DIR ?? "";

/**
 * Opt-in generator (`npm run content:build-courses`): reads the course export,
 * writes one textbook-format JSON per book and the coverage report next to the
 * export. It never runs in the normal test suite.
 */
it.runIf(exportDirectory !== "")(
 "writes the course books and the coverage report",
 () => {
  const tables = Object.fromEntries(
   Object.entries(courseExportTables).map(([key, file]) => [
    key,
    JSON.parse(readFileSync(path.join(exportDirectory, `${file}.json`), "utf8")),
   ]),
  );
  const courseExport = courseExportSchema.parse(tables);
  const conversions = convertCourseBooks(courseExport);
  const outputDirectory = fileURLToPath(new URL("../static-json/courses/", import.meta.url));
  mkdirSync(outputDirectory, { recursive: true });
  const files = conversions.map((conversion) => {
   const file = path.join(outputDirectory, `${conversion.book.id}.json`);
   writeFileSync(file, `${JSON.stringify(conversion.book)}\n`);
   return { id: conversion.book.id, file };
  });
  // The client bundles only this catalog; lesson content stays on the server.
  const catalogFile = path.join(outputDirectory, "catalog.json");
  writeFileSync(
   catalogFile,
   `${JSON.stringify(
    conversions.map(({ book }) => ({
     id: book.id,
     key: book.key,
     label: book.label,
     lessons: book.lessons.map((lesson) => ({
      id: lesson.id,
      bookKey: lesson.bookKey,
      number: lesson.number,
      title: lesson.title,
      vocabCount: lesson.vocab.length,
     })),
    })),
   )}\n`,
  );
  // Old course URLs (`/hanzihome?courseId=…`) are redirected with this map.
  const convertedBookIds = new Set(conversions.map((conversion) => conversion.book.id));
  const legacyRoutesFile = path.join(outputDirectory, "legacy-routes.json");
  writeFileSync(
   legacyRoutesFile,
   `${JSON.stringify({
    courseBooks: courseExport.books
     .filter((book) => convertedBookIds.has(book.id))
     .map((book) => ({ courseId: book.course_id, bookKey: book.id })),
    lessons: courseExport.lessons
     .filter((lesson) => convertedBookIds.has(lesson.book_id) && !lesson.deleted_at)
     .map((lesson) => ({
      legacyId: lesson.id,
      bookKey: lesson.book_id,
      number: lesson.lesson_number,
     })),
   })}\n`,
  );
  execFileSync(
   "npx",
   ["oxfmt", catalogFile, legacyRoutesFile, ...files.map((entry) => entry.file)],
   {
    stdio: "inherit",
   },
  );
  const bytes = new Map(files.map((entry) => [entry.id, statSync(entry.file).size]));
  writeFileSync(
   path.join(exportDirectory, "conversion-report.md"),
   renderCoverageReport(conversions, bytes),
  );
  expect(files.length).toBeGreaterThan(0);
 },
 120_000,
);
