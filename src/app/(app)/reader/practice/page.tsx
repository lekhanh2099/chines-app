import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
 listReaderPdfAssets,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function ReaderPracticePage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("reinforcement");
 const initialUnitReferenceDocuments = await listReaderDocuments("core");
 const initialPdfAssets = await listReaderPdfAssets();
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;

 return (
  <main className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="reinforcement"
    initialDocuments={initialDocuments}
    initialUnitReferenceDocuments={initialUnitReferenceDocuments}
    initialPdfAssets={initialPdfAssets}
    initialResource={initialResource}
    title="Luyện củng cố PDF"
    description="Tài liệu luyện đọc từ PDF nguồn, giữ metadata trang và workspace học theo tài liệu."
   />
  </main>
 );
}
