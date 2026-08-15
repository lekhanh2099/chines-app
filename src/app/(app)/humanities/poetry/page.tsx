import { HumanitiesTrackWorkspace } from "@/features/hanzihome/humanities/HumanitiesTrackWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function HumanitiesPoetryPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("humanities");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;

 return (
  <main className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <HumanitiesTrackWorkspace
    kind="poetry"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
   />
  </main>
 );
}
