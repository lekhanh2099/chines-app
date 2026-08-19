import { DailyReadingWorkspace } from "@/features/hanzihome/reader/DailyReadingWorkspace";
import { GeneratedDailyReadingArea } from "@/features/hanzihome/reader/daily-reading/GeneratedDailyReadingArea";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";
import { getStaticStudioLessonDetail } from "@/features/hanzihome/static-json/studio-static-content";

export default async function DailyReadingPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";

 if (documentId.length === 0) {
  return (
   <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
    <GeneratedDailyReadingArea />
   </div>
  );
 }

 const initialDocuments = await listReaderDocuments("daily");
 const initialResource = await getReaderDocument(documentId);
 const initialLesson =
  initialResource === null ? null : getStaticStudioLessonDetail(initialResource.document.lesson_id);

 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <DailyReadingWorkspace
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    initialLesson={initialLesson}
   />
  </div>
 );
}
