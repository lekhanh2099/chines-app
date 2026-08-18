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
 const initialDocuments = await listReaderDocuments("daily");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;
 const initialLesson =
  initialResource === null ? null : getStaticStudioLessonDetail(initialResource.document.lesson_id);

 return (
  <div className="hanzihome-static-page grid min-w-0 gap-6 p-3 sm:p-5 lg:p-6">
   <GeneratedDailyReadingArea />
   <DailyReadingWorkspace
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    initialLesson={initialLesson}
   />
  </div>
 );
}
