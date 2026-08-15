import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function HskReaderDocumentPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const initialDocuments = await listReaderDocuments("hsk");
 const selected = initialDocuments.find(
  (document) => document.slug === slug || document.slug.replace(/^hsk-/u, "") === slug,
 );
 const initialResource = selected === undefined ? null : await getReaderDocument(selected.id);

 return (
  <main className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="hsk"
    title="HSK Reader"
    description="50 bài đọc HSK 3–4 được sắp theo cấp độ, quyển và bài. Mỗi bài dùng chung trình đọc có TTS chạy theo chữ, pinyin, nghĩa và tra từ."
    initialDocumentSlug={slug}
    initialDocuments={initialDocuments}
    initialResource={initialResource}
   />
  </main>
 );
}
