import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function ReaderMockPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("mock");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;

 return (
  <main className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="mock"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    title="Đọc lạ / mô phỏng kiểm tra"
    description="Các bài đọc mô phỏng được sắp theo đơn nguyên để luyện đọc ngoài bài đã học."
   />
  </main>
 );
}
