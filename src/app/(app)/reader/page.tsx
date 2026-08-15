import { ReaderWorkspace } from "@/features/hanzihome/reader/ReaderWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
 listReaderPdfAssets,
} from "@/features/hanzihome/reader/reader-content-repository";
import { readerKindSchema } from "@/features/hanzihome/reader/reader.schemas";

export default async function ReaderPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const collectionValue = typeof params.collection === "string" ? params.collection : undefined;
 const parsedKind = readerKindSchema.safeParse(collectionValue);
 const kind = parsedKind.success ? parsedKind.data : "core";
 const documentId = typeof params.document === "string" ? params.document : "";
 const surface = params.surface === "pdf" ? "pdf" : "text";
 const initialDocuments = await listReaderDocuments(kind);
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;
 const initialPdfAssets = surface === "pdf" ? await listReaderPdfAssets() : [];

 return (
  <main className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderWorkspace
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    initialPdfAssets={initialPdfAssets}
   />
  </main>
 );
}
