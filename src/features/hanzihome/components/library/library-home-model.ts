import type { HanziHomeCourseBook } from "@/features/hanzihome/types";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { LibraryCourseGroup, LibraryCourseGroupKey } from "./library-course-groups";

export function filterLibraryGroups({
 groups,
 books,
 filter,
 searchTerm,
 getGroupTitle,
}: {
 groups: LibraryCourseGroup[];
 books: HanziHomeCourseBook[];
 filter: string;
 searchTerm: string;
 getGroupTitle: (key: LibraryCourseGroupKey) => string;
}): LibraryCourseGroup[] {
 return groups.filter(
  (group) =>
   (filter === "all" ||
    (filter === "hanyu" && group.key === "hanyu") ||
    (filter === "boya" && (group.key === "boya" || group.key === "boyaSecondEdition")) ||
    (filter === "specialized" && (group.key === "listening" || group.key === "other"))) &&
   (getGroupTitle(group.key).toLocaleLowerCase().includes(searchTerm) ||
    group.courses.some(
     (course) =>
      course.title.toLocaleLowerCase().includes(searchTerm) ||
      books.some(
       (book) => book.courseId === course.id && book.title.toLocaleLowerCase().includes(searchTerm),
      ),
    )),
 );
}

export function filterLibraryTextbooks(
 textbooks: TextbookBookSummary[],
 filter: string,
 searchTerm: string,
): TextbookBookSummary[] {
 return filter === "all" || filter === "specialized"
  ? textbooks.filter((book) => book.label.toLocaleLowerCase().includes(searchTerm))
  : [];
}

export function buildLibraryCollectionOrder(
 savedOrder: string[],
 groups: LibraryCourseGroup[],
 textbooks: TextbookBookSummary[],
): string[] {
 return [
  ...new Set([
   ...savedOrder,
   ...groups.map((group) => `group:${group.key}`),
   ...textbooks.map((book) => `static:${book.id}`),
  ]),
 ];
}

export function filterVisibleLibraryCollectionIds(
 collectionOrder: string[],
 visibleGroups: LibraryCourseGroup[],
 visibleTextbooks: TextbookBookSummary[],
): string[] {
 return collectionOrder.filter(
  (id) =>
   visibleGroups.some((group) => id === `group:${group.key}`) ||
   visibleTextbooks.some((book) => id === `static:${book.id}`),
 );
}
