import { StudioDictationWorkspace } from "@/features/dictation/StudioDictationWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/reading/repositories/reading-content.repository";
import { listStaticStudioCourseLessons } from "@/features/hanzihome/static-json/studio-static-content";
import { SkillsHubHeaderContext } from "@/features/skills-hub/SkillsHubHeaderContext";

export default async function DictationPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.documentId === "string" ? params.documentId : "";
 const readerDocumentId =
  typeof params.readerDocumentId === "string" ? params.readerDocumentId : "";
 const initialReaderDocuments = await listReaderDocuments("core");
 const initialReaderResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;
 const selectedCourseDocumentId =
  readerDocumentId.length > 0 ? readerDocumentId : (initialReaderDocuments[0]?.id ?? "");
 const initialReaderCourseResource =
  selectedCourseDocumentId.length > 0 ? await getReaderDocument(selectedCourseDocumentId) : null;
 const initialDictationLessons = listStaticStudioCourseLessons("hanzihome-studio-dictation");

 return (
  <>
   <SkillsHubHeaderContext sectionId="dictation" />
   <div className="hanzihome-static-page min-w-0">
    <StudioDictationWorkspace
     initialReaderDocuments={initialReaderDocuments}
     initialReaderResource={initialReaderResource}
     initialReaderCourseResource={initialReaderCourseResource}
     initialDictationLessons={initialDictationLessons}
    />
   </div>
  </>
 );
}
