import { notFound } from "next/navigation";

import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import {
 getTextbookCatalogForBookKeys,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

export default async function ChineseBridgePage({
 searchParams,
}: Pick<PageProps<"/[locale]/hsk/nhip-cau-han-ngu">, "searchParams">) {
 const params = await searchParams;
 const requestedLesson = typeof params.lesson === "string" ? Number(params.lesson) : 1;
 const lessonNumber =
  Number.isInteger(requestedLesson) && requestedLesson >= 1 && requestedLesson <= 15
   ? requestedLesson
   : 1;
 const lesson = getTextbookLesson("nhip-cau", lessonNumber);
 if (!lesson) notFound();

 return (
  <BusinessChineseStudyWorkspace
   key={lesson.id}
   books={getTextbookCatalogForBookKeys(["nhip-cau"])}
   lesson={lesson}
  />
 );
}
