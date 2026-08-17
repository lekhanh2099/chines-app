import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function ReaderHskPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("hsk");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;

 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderCollectionWorkspace
    kind="hsk"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    title="Thư viện bài đọc HSK"
    description="50 bài đọc HSK 3–4 được sắp theo cấp độ, quyển và bài. Mỗi bài dùng chung trình đọc có TTS chạy theo chữ, pinyin, nghĩa và tra từ."
   />
  </div>
 );
}
