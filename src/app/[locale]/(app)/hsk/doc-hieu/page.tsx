import { notFound } from "next/navigation";

import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import {
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

export default async function ReadingComprehensionPage({
 searchParams,
}: Pick<PageProps<"/[locale]/hsk/doc-hieu">, "searchParams">) {
 const params = await searchParams;
 const requestedLesson = typeof params.lesson === "string" ? Number(params.lesson) : 1;
 const lessonNumber =
  Number.isInteger(requestedLesson) && requestedLesson >= 1 && requestedLesson <= 18
   ? requestedLesson
   : 1;
 const lesson = getTextbookLesson("doc-hieu", lessonNumber);
 if (!lesson) notFound();

 return (
  <BusinessChineseStudyWorkspace key={lesson.id} books={getTextbookCatalog()} lesson={lesson} />
 );
}
