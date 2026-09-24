import { notFound } from "next/navigation";

import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 getTextbookCatalogForBookKeys,
 getBusinessChineseLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

// Book 2 (tm2) is hidden from display upon request; only Book 3 (tm3) is visible in the active workspace.
const visibleBusinessChineseBookKeys: readonly TextbookLesson["bookKey"][] = ["tm3"];

export default async function BusinessChinesePage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const selectedBookKey = "tm3";
 const requestedLesson = typeof params.lesson === "string" ? Number(params.lesson) : 1;
 const selectedLessonNumber =
  Number.isInteger(requestedLesson) && requestedLesson >= 1 && requestedLesson <= 10
   ? requestedLesson
   : 1;
 const catalog = getTextbookCatalogForBookKeys(visibleBusinessChineseBookKeys);
 const lesson = getBusinessChineseLesson(selectedBookKey, selectedLessonNumber);
 if (!lesson) notFound();

 return <BusinessChineseStudyWorkspace key={lesson.id} books={catalog} lesson={lesson} />;
}
