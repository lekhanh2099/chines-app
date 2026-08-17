import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function ReaderMockDocumentPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const initialDocuments = await listReaderDocuments("mock");
 const selected = initialDocuments.find((document) => document.slug === slug);
 const initialResource = selected === undefined ? null : await getReaderDocument(selected.id);

 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="mock"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    title="Đọc lạ / mô phỏng kiểm tra"
    description="Các bài đọc mô phỏng được sắp theo đơn nguyên để luyện đọc ngoài bài đã học."
    initialDocumentSlug={slug}
   />
  </div>
 );
}
