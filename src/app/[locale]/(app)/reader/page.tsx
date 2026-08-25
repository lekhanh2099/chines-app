import { ReaderWorkspace } from "@/features/hanzihome/reader/ReaderWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
 listReaderPdfAssets,
} from "@/features/hanzihome/reader/reader-content-repository";
import type { ReaderDocumentResource } from "@/features/hanzihome/reader/reader-content-api";
import { getLatestIncompleteReaderProgress } from "@/features/hanzihome/reader/reader-progress-repository.server";
import { readerKindSchema } from "@/features/hanzihome/reader/reader.schemas";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

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
 let initialResumeHref = "";
 if (resumeDocument?.kind === "core") {
  initialResumeHref = `/reader/course/${resumeDocument.slug}`;
 } else if (resumeDocument?.kind === "hsk") {
  initialResumeHref = `/hsk/${resumeDocument.slug.replace(/^hsk-/u, "")}`;
 } else if (resumeDocument?.kind === "reinforcement") {
  initialResumeHref = `/reader/practice/${resumeDocument.slug}`;
 } else if (resumeDocument?.kind === "mock") {
  initialResumeHref = `/reader/mock/${resumeDocument.slug}`;
 } else if (resumeDocument?.kind === "humanities") {
  initialResumeHref = `/humanities?document=${encodeURIComponent(resumeDocument.id)}`;
 } else if (resumeDocument?.kind === "personal") {
  initialResumeHref = `/personal-learning/${resumeDocument.slug}`;
 } else if (resumeDocument?.kind === "daily") {
  initialResumeHref = "/daily-reading";
 }

 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <ReaderWorkspace
    initialDocuments={initialDocuments}
    initialResource={initialResource}
    initialPdfAssets={initialPdfAssets}
    initialResumeDocument={resumeDocument}
    initialResumeHref={initialResumeHref}
    initialResumeUnavailable={initialResumeUnavailable}
   />
  </div>
 );
}
