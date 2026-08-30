import { notFound } from "next/navigation";

import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import { attachLessonVocabularyResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 getStaticStudioCourseCatalog,
 getStaticStudioLessonDetail,
} from "@/features/hanzihome/static-json/studio-static-content";

const businessChineseCourseId = "hanzihome-business-chinese";

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
 const selectedBookId = `${businessChineseCourseId}:book:${selectedBookKey}`;
 const catalog = getStaticStudioCourseCatalog(businessChineseCourseId);
 if (!catalog) notFound();

 const selectedLessonSummary =
  catalog.lessons.find(
   (lesson) => lesson.bookId === selectedBookId && lesson.lessonNumber === selectedLessonNumber,
  ) ??
  catalog.lessons.find((lesson) => lesson.bookId === selectedBookId && lesson.lessonNumber === 1);
 if (!selectedLessonSummary) notFound();

 const staticLesson = getStaticStudioLessonDetail(selectedLessonSummary.id);
 if (!staticLesson) notFound();
 const lesson = attachLessonVocabularyResource(staticLesson, {
  lessonId: staticLesson.id,
  items: staticLesson.vocab,
  total: staticLesson.vocab.length,
 });

 return (
  <BusinessChineseStudyWorkspace books={catalog.books} lessons={catalog.lessons} lesson={lesson} />
 );
}
