import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function ReaderCoursePage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("core");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;

 return (
  <main className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="core"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    title="Giáo trình chính"
    description="12 bài U3–U5 với đầy đủ dữ liệu đọc, bài tập, từ vựng, phân tích và ghi chú."
   />
  </main>
 );
}
