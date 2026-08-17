import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function PersonalLearningPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("personal");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;
 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="personal"
    title="Personal Learning"
    description="Curriculum và bài tập cá nhân đã nhập, với tiến độ mới thuộc HanziHome."
    initialDocuments={initialDocuments}
    initialResource={initialResource}
   />
  </div>
 );
}
