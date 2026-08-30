import { BusinessChineseWorkspace } from "./_components/business-chinese-workspace";
import {
 getBusinessChineseBookSummaries,
 getBusinessChineseLesson,
 resolveBusinessChineseBookKey,
 resolveBusinessChineseLessonNumber,
} from "./_lib/business-chinese-data";

function singleSearchParam(value: string | string[] | undefined) {
 return typeof value === "string" ? value : undefined;
}

export default async function BusinessChinesePage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const bookKey = resolveBusinessChineseBookKey(singleSearchParam(params.book));
 const lessonNumber = resolveBusinessChineseLessonNumber(
  bookKey,
  singleSearchParam(params.lesson),
 );
 const lesson = getBusinessChineseLesson(bookKey, lessonNumber);
 const books = getBusinessChineseBookSummaries();

 return <BusinessChineseWorkspace books={books} bookKey={bookKey} lesson={lesson} />;
}
