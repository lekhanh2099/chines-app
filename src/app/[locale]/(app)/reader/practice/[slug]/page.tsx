import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
 listReaderPdfAssets,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function ReaderPracticeDocumentPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const initialDocuments = await listReaderDocuments("reinforcement");
 const initialUnitReferenceDocuments = await listReaderDocuments("core");
 const initialPdfAssets = await listReaderPdfAssets();
 const selected = initialDocuments.find((document) => document.slug === slug);
 const initialResource = selected === undefined ? null : await getReaderDocument(selected.id);

 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="reinforcement"
    initialDocuments={initialDocuments}
    initialUnitReferenceDocuments={initialUnitReferenceDocuments}
    initialPdfAssets={initialPdfAssets}
    initialResource={initialResource}
    title="Luyện củng cố PDF"
    description="Tài liệu luyện đọc từ PDF nguồn, giữ metadata trang và workspace học theo tài liệu."
    initialDocumentSlug={slug}
   />
  </div>
 );
}
