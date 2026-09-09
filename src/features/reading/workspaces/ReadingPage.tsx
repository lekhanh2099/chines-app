import { PageContainer } from "@/components/layout/page-container";
import { resolveReadingDocumentHref } from "../navigation/reading-route-registry";
import { ReaderWorkspace } from "@/features/reading/workspaces/ReaderWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
 listReaderPdfAssets,
} from "@/features/reading/repositories/reading-content.repository";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import { getLatestIncompleteReaderProgress } from "@/features/reading/repositories/reading-progress.repository";
import { readerKindSchema } from "@/features/reading/model/reading-resource.schemas";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export async function ReadingPage({
 collection,
 documentId = "",
 surface = "text",
}: {
 collection?: string;
 documentId?: string;
 surface?: string;
}) {
 const parsedKind = readerKindSchema.safeParse(collection);
 const kind = parsedKind.success ? parsedKind.data : "core";
 const initialDocuments = await listReaderDocuments(kind);
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;
 const initialPdfAssets = surface === "pdf" ? await listReaderPdfAssets() : [];
 let initialResumeResource: ReaderDocumentResource | null = null;
 let initialResumeUnavailable = false;

 if (!parsedKind.success && documentId.length === 0 && surface === "text") {
  const auth = await requireAuthenticatedRoute();
  if (auth.authenticated) {
   try {
    const progress = await getLatestIncompleteReaderProgress(auth.context);
    initialResumeResource =
     progress === null ? null : await getReaderDocument(progress.document_id);
   } catch {
    initialResumeUnavailable = true;
   }
  }
 }

 const resumeDocument = initialResumeResource?.document ?? null;
 const initialResumeHref = resumeDocument ? resolveReadingDocumentHref(resumeDocument) : "";

 return (
  <PageContainer>
   <ReaderWorkspace
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    initialPdfAssets={initialPdfAssets}
    initialResumeDocument={resumeDocument}
    initialResumeHref={initialResumeHref}
    initialResumeUnavailable={initialResumeUnavailable}
   />
  </PageContainer>
 );
}
