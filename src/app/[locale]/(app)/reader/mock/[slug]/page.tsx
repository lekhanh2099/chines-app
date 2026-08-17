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
    initialDocumentSlug={slug}
   />
  </div>
 );
}
