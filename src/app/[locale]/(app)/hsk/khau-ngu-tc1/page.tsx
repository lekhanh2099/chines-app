import { notFound } from "next/navigation";

import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import {
 getTextbookCatalogForBookKeys,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

export default async function SpokenChinesePage({
 searchParams,
}: Pick<PageProps<"/[locale]/hsk/khau-ngu-tc1">, "searchParams">) {
 const params = await searchParams;
 const books = getTextbookCatalogForBookKeys(["khau-ngu"]);
 const requestedLesson = typeof params.lesson === "string" ? Number(params.lesson) : 1;
 const lessonNumber = books.some((book) =>
  book.lessons.some((lesson) => lesson.number === requestedLesson),
 )
  ? requestedLesson
  : 1;
 const lesson = getTextbookLesson("khau-ngu", lessonNumber);
 if (!lesson) notFound();

 return <BusinessChineseStudyWorkspace key={lesson.id} books={books} lesson={lesson} />;
}
