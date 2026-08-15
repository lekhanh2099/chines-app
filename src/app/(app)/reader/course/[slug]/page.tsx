import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function ReaderCourseDocumentPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const initialDocuments = await listReaderDocuments("core");
 const selected = initialDocuments.find((document) => document.slug === slug);
 const initialResource = selected === undefined ? null : await getReaderDocument(selected.id);

 return (
  <main className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="core"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    title="Giáo trình chính"
    description="Các bài đọc theo đơn nguyên, giữ nguyên thứ tự bài và bài luyện của Hanzi Studio."
    initialDocumentSlug={slug}
   />
  </main>
 );
}
