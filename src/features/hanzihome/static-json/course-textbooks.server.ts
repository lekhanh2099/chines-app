import "server-only";

import { z } from "zod";

import boyaAdvancedOne from "./courses/boya-9e-advanced-1.json";
import boyaAdvancedTwo from "./courses/boya-9e-advanced-2.json";
import hanyuTwoShang from "./courses/hanyu-q2-shang.json";
import hanyuTwoXia from "./courses/hanyu-q2-xia.json";
import hanyuThreeShang from "./courses/hanyu-q3-shang.json";
import hanyuThreeXia from "./courses/hanyu-q3-xia.json";
import {
 courseBookKeySchema,
 getTextbookLesson,
 textbookBookSchema,
 type TextbookBook,
 type TextbookLesson,
} from "./business-chinese-static-content";

const _courseBooks: TextbookBook[][] = [];

/** The converted course books with full lesson content; validated once per server instance. */
export function getCourseTextbookBooks(): readonly TextbookBook[] {
 if (_courseBooks.length === 0) {
  _courseBooks.push(
   z
    .array(textbookBookSchema)
    .parse([
     hanyuTwoShang,
     hanyuTwoXia,
     hanyuThreeShang,
     hanyuThreeXia,
     boyaAdvancedOne,
     boyaAdvancedTwo,
    ]),
  );
 }
 const [books = []] = _courseBooks;
 return books;
}

/** A lesson of any book: bundled textbooks and converted course books. */
export function getTextbookLessonOnServer(
 bookKey: TextbookLesson["bookKey"],
 lessonNumber: number,
): TextbookLesson | null {
 if (!courseBookKeySchema.safeParse(bookKey).success) {
  return getTextbookLesson(bookKey, lessonNumber);
 }
 const book = getCourseTextbookBooks().find((item) => item.key === bookKey);
 return book?.lessons.find((lesson) => lesson.number === lessonNumber) ?? null;
}
