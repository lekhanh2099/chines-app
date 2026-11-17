import { notFound } from "next/navigation";

import { BusinessChineseStudyWorkspace } from "@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace";
import {
 courseBookKeySchema,
 getTextbookCatalogForBookKeys,
} from "@/features/hanzihome/static-json/textbook-catalog";
import { getTextbookLessonOnServer } from "@/features/hanzihome/static-json/course-textbooks.server";

export default async function CourseTextbookPage({
 params,
 searchParams,
}: PageProps<"/[locale]/textbooks/[book]">) {
 const bookKey = courseBookKeySchema.safeParse((await params).book);
 if (!bookKey.success) notFound();
 const [book] = getTextbookCatalogForBookKeys([bookKey.data]);
 const [firstLesson] = book?.lessons ?? [];
 if (!book || !firstLesson) notFound();

 const query = await searchParams;
 const requested = typeof query.lesson === "string" ? Number(query.lesson) : firstLesson.number;
 const lessonNumber = book.lessons.some((item) => item.number === requested)
  ? requested
  : firstLesson.number;
 const lesson = getTextbookLessonOnServer(bookKey.data, lessonNumber);
 if (!lesson) notFound();

 return <BusinessChineseStudyWorkspace key={lesson.id} books={[book]} lesson={lesson} />;
}
