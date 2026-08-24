import { notFound } from "next/navigation";

import { HskGrammarStudyWorkspace } from "@/features/hanzihome/components/grammar/HskGrammarStudyWorkspace";
import {
 getStaticStudioCourseCatalog,
 getStaticStudioLessonDetail,
} from "@/features/hanzihome/static-json/studio-static-content";

const studioGrammarCourseId = "hanzihome-studio-grammar";

export default async function HskGrammarPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const requestedLevel = typeof params.level === "string" ? params.level : "";
 const requestedPointId = typeof params.point === "string" ? params.point : "";
 const catalog = getStaticStudioCourseCatalog(studioGrammarCourseId);
 if (!catalog) notFound();

 const selectedLessonSummary =
  catalog.lessons.find((lesson) => lesson.bookTitle === requestedLevel) ?? catalog.lessons[0];
 if (!selectedLessonSummary) notFound();

 const lesson = getStaticStudioLessonDetail(selectedLessonSummary.id);
 if (!lesson) notFound();

 const point = lesson.grammar.find((item) => item.id === requestedPointId) ?? lesson.grammar[0];
 if (!point) notFound();

 return <HskGrammarStudyWorkspace levels={catalog.lessons} lesson={lesson} point={point} />;
}
