import { notFound } from "next/navigation";

import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import {
 getTextbookCatalog,
 getBusinessChineseLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

export default async function BusinessChinesePage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const selectedBookKey = params.book === "tm3" ? "tm3" : "tm2";
 const requestedLesson = typeof params.lesson === "string" ? Number(params.lesson) : 1;
 const selectedLessonNumber =
  Number.isInteger(requestedLesson) && requestedLesson >= 1 && requestedLesson <= 10
   ? requestedLesson
   : 1;
 const catalog = getTextbookCatalog();
 const lesson = getBusinessChineseLesson(selectedBookKey, selectedLessonNumber);
 if (!lesson) notFound();

 return <BusinessChineseStudyWorkspace key={lesson.id} books={catalog} lesson={lesson} />;
}
